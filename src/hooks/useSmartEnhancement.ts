import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type FieldType = 'title' | 'goal' | 'content';

interface EnhancementData {
  enhancedLetter: {
    title: string;
    goal: string;
    content: string;
  };
  suggestedMilestones: Array<{
    title: string;
    percentage: number;
    target_date: string;
    description: string;
  }>;
}

interface CachedEnhancement {
  inputHash: string;
  data: EnhancementData;
  timestamp: number;
}

interface UseSmartEnhancementProps {
  title: string;
  goal: string;
  content: string;
  send_date: string;
  onApplyField: (field: FieldType, value: string) => void;
  onApplyMilestones?: (milestones: any[]) => void;
}

interface EnhancementState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: EnhancementData | null;
  showSuggestions: boolean;
  isExpanded: boolean;
  appliedFields: Set<FieldType>;
  loadingFields: Set<FieldType>;
  milestonesApplied: boolean;
  isApplyingMilestones: boolean;
  cachedEnhancements: Record<string, CachedEnhancement>;
  lastInputHash: string | null;
  isUsingCache: boolean;
}

export const useSmartEnhancement = ({
  title,
  goal,
  content,
  send_date,
  onApplyField,
  onApplyMilestones
}: UseSmartEnhancementProps) => {
  const [enhancementState, setEnhancementState] = useState<EnhancementState>({
    status: 'idle',
    data: null,
    showSuggestions: false,
    isExpanded: false,
    appliedFields: new Set(),
    loadingFields: new Set(),
    milestonesApplied: false,
    isApplyingMilestones: false,
    cachedEnhancements: {},
    lastInputHash: null,
    isUsingCache: false,
  });
  
  const { toast } = useToast();

  // Generate a hash from form inputs to use as cache key
  const generateInputHash = (title: string, goal: string, content: string, send_date: string) => {
    const inputString = `${title.trim()}|${goal.trim()}|${content.trim()}|${send_date}`;
    // Handle Unicode characters by encoding to UTF-8 first
    const encodedString = encodeURIComponent(inputString);
    return btoa(encodedString).replace(/[^a-zA-Z0-9]/g, ''); // Simple base64 hash, cleaned
  };

  // Check if we have cached data for current inputs
  const getCachedEnhancement = (inputHash: string): CachedEnhancement | null => {
    const cached = enhancementState.cachedEnhancements[inputHash];
    if (!cached) return null;
    
    // Optional: Check if cache is not too old (1 hour)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - cached.timestamp > oneHour) {
      return null;
    }
    
    return cached;
  };

  const fetchEnhancement = useCallback(async (inputHash: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('enhance-letter-complete', {
        body: { title, goal, content, send_date }
      });

      if (error) throw error;

      // Store the result in cache
      const cachedResult: CachedEnhancement = {
        inputHash,
        data,
        timestamp: Date.now()
      };

      setEnhancementState(prev => ({
        ...prev,
        status: 'success',
        data,
        showSuggestions: true,
        isExpanded: true,
        cachedEnhancements: {
          ...prev.cachedEnhancements,
          [inputHash]: cachedResult
        },
        lastInputHash: inputHash,
        isUsingCache: false
      }));

      toast({
        title: "✨ Letter Enhanced!",
        description: "Your letter has been enhanced with AI. Review the suggestions below.",
      });
    } catch (error: any) {
      // Detailed error logging with context
      console.error('[SmartEnhancement] Enhancement fetch failed:', {
        operation: 'fetchEnhancement',
        timestamp: new Date().toISOString(),
        inputHash,
        formData: { 
          titleLength: title.length, 
          goalLength: goal.length, 
          contentLength: content.length,
          sendDate: send_date 
        },
        error: {
          name: error?.name || 'Unknown',
          message: error?.message || 'No error message',
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          stack: error?.stack
        }
      });

      setEnhancementState(prev => ({
        ...prev,
        status: 'error'
      }));

      // Determine error type and provide specific feedback
      let errorTitle = "Enhancement Failed";
      let errorDescription = "Unable to enhance your letter. Please try again.";
      
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorTitle = "Network Error";
        errorDescription = "Please check your internet connection and try again.";
      } else if (error?.code === 'FUNCTION_INVOCATION_FAILED') {
        errorTitle = "Service Temporarily Unavailable";
        errorDescription = "The enhancement service is currently unavailable. Please try again in a few moments.";
      } else if (error?.message?.includes('rate limit') || error?.code === 429) {
        errorTitle = "Rate Limit Exceeded";
        errorDescription = "Too many enhancement requests. Please wait a moment before trying again.";
      } else if (error?.message?.includes('authentication') || error?.code === 401) {
        errorTitle = "Authentication Error";
        errorDescription = "Please refresh the page and try again.";
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });
    }
  }, [title, goal, content, send_date, toast]);

  const enhance = useCallback(async () => {
    if (enhancementState.status === 'loading') return;
    
    // Generate hash from current inputs
    const currentInputHash = generateInputHash(title, goal, content, send_date);
    
    // Check if we have cached data for these inputs
    const cachedData = getCachedEnhancement(currentInputHash);
    
    if (cachedData) {
      // Use cached data
      setEnhancementState(prev => ({
        ...prev,
        status: 'success',
        data: cachedData.data,
        showSuggestions: true,
        isExpanded: true,
        lastInputHash: currentInputHash,
        isUsingCache: true,
        appliedFields: new Set(),
        milestonesApplied: false
      }));

      toast({
        title: "✨ Cached Enhancement Restored!",
        description: "Using previously generated suggestions for these inputs.",
      });
      return;
    }
    
    // No cache found, proceed with API call
    setEnhancementState(prev => ({
      ...prev,
      status: 'loading',
      showSuggestions: false,
      isExpanded: false,
      data: null,
      appliedFields: new Set(),
      milestonesApplied: false,
      isUsingCache: false
    }));

    await fetchEnhancement(currentInputHash);
  }, [enhancementState.status, generateInputHash, getCachedEnhancement, fetchEnhancement, title, goal, content, send_date, toast]);

  const applyField = useCallback(async (field: FieldType) => {
    if (!enhancementState.data?.enhancedLetter) return;
    
    setEnhancementState(prev => ({
      ...prev,
      loadingFields: new Set([...prev.loadingFields, field])
    }));
    
    try {
      const value = enhancementState.data.enhancedLetter[field];
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief loading state
      onApplyField(field, value);
      
      setEnhancementState(prev => ({
        ...prev,
        appliedFields: new Set([...prev.appliedFields, field]),
        loadingFields: new Set([...prev.loadingFields].filter(f => f !== field))
      }));
      
      toast({
        title: "✅ Enhancement Applied",
        description: `Updated ${field} with AI suggestion.`,
      });
    } catch (error: any) {
      // Detailed error logging for field application
      console.error('[SmartEnhancement] Field application failed:', {
        operation: 'applyField',
        timestamp: new Date().toISOString(),
        field,
        value: enhancementState.data?.enhancedLetter[field]?.substring(0, 100) + '...',
        error: {
          name: error?.name || 'Unknown',
          message: error?.message || 'No error message',
          stack: error?.stack
        }
      });

      toast({
        title: "Failed to Apply Enhancement",
        description: `Could not apply ${field} enhancement. The form may be locked or there was a validation error.`,
        variant: "destructive"
      });
      
      setEnhancementState(prev => ({
        ...prev,
        loadingFields: new Set([...prev.loadingFields].filter(f => f !== field))
      }));
    }
  }, [enhancementState.data, onApplyField, toast]);

  const applyMilestones = useCallback(async () => {
    if (!enhancementState.data?.suggestedMilestones?.length || !onApplyMilestones || enhancementState.milestonesApplied) return;
    
    setEnhancementState(prev => ({
      ...prev,
      isApplyingMilestones: true
    }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief loading state
      onApplyMilestones(enhancementState.data.suggestedMilestones);
      
      setEnhancementState(prev => ({
        ...prev,
        milestonesApplied: true,
        isApplyingMilestones: false
      }));
      
      toast({
        title: "✅ Milestones Applied",
        description: `Added ${enhancementState.data.suggestedMilestones.length} suggested milestones.`,
      });
    } catch (error: any) {
      // Detailed error logging for milestone application
      console.error('[SmartEnhancement] Milestone application failed:', {
        operation: 'applyMilestones',
        timestamp: new Date().toISOString(),
        milestoneCount: enhancementState.data?.suggestedMilestones?.length || 0,
        milestones: enhancementState.data?.suggestedMilestones?.map(m => ({ 
          title: m.title, 
          percentage: m.percentage 
        })),
        error: {
          name: error?.name || 'Unknown',
          message: error?.message || 'No error message',
          stack: error?.stack
        }
      });

      toast({
        title: "Failed to Apply Milestones",
        description: "Could not apply suggested milestones. There may be a validation error or the form is locked.",
        variant: "destructive"
      });
      
      setEnhancementState(prev => ({
        ...prev,
        isApplyingMilestones: false
      }));
    }
  }, [enhancementState.data, enhancementState.milestonesApplied, onApplyMilestones, toast]);

  const applyAllRemaining = useCallback(async () => {
    if (!enhancementState.data?.enhancedLetter) return;
    
    const fieldsToApply: FieldType[] = (['title', 'goal', 'content'] as FieldType[])
      .filter(field => !enhancementState.appliedFields.has(field) && enhancementState.data!.enhancedLetter[field] !== '');
    
    if (fieldsToApply.length === 0 && (enhancementState.milestonesApplied || !enhancementState.data.suggestedMilestones?.length)) {
      toast({
        title: "Nothing to Apply",
        description: "All enhancements have already been applied.",
      });
      return;
    }

    // Apply remaining fields
    for (const field of fieldsToApply) {
      await applyField(field);
    }
    
    // Apply milestones if not applied yet
    if (!enhancementState.milestonesApplied && enhancementState.data.suggestedMilestones?.length && onApplyMilestones) {
      await applyMilestones();
    }
    
    toast({
      title: "✅ All Enhancements Applied",
      description: "Your letter has been updated with all remaining AI suggestions.",
    });
  }, [enhancementState, applyField, applyMilestones, onApplyMilestones, toast]);

  const retry = () => enhance();

  const setIsExpanded = (expanded: boolean) => {
    setEnhancementState(prev => ({
      ...prev,
      isExpanded: expanded
    }));
  };

  // Check if we already have enhancement data for current inputs
  const currentInputHash = generateInputHash(title, goal, content, send_date);
  const hasEnhancementForCurrentInputs = Boolean(getCachedEnhancement(currentInputHash));

  return {
    state: enhancementState.status,
    data: enhancementState.data,
    isExpanded: enhancementState.isExpanded,
    setIsExpanded,
    enhance,
    applyField,
    applyMilestones,
    applyAllRemaining,
    retry,
    canEnhance: Boolean(goal?.trim()) && 
                enhancementState.status !== 'loading' && 
                !hasEnhancementForCurrentInputs,
    appliedFields: enhancementState.appliedFields,
    loadingFields: enhancementState.loadingFields,
    milestonesApplied: enhancementState.milestonesApplied,
    isApplyingMilestones: enhancementState.isApplyingMilestones,
    hasEnhancementData: enhancementState.showSuggestions
  };
};