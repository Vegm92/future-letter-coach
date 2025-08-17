import { useState, useCallback, useMemo, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { EnhancementService } from "../services";

// Create enhancement service instance
const enhancementService = new EnhancementService();
import { logApiCall, handleApiError } from "@/shared/utils/api.utils";
import type { 
  EnhancementRequest, 
  EdgeFunctionResponse,
  EnhancementResponse,
  MilestoneSuggestionRequest,
  MilestoneSuggestionResponse 
} from "../services/enhancementService";

// Legacy hook types for backward compatibility
interface EnhancementState {
  isEnhancing: boolean;
  isSuggestingMilestones: boolean;
  currentEnhancement?: EnhancementResponse;
  currentMilestones?: MilestoneSuggestionResponse;
  error?: string;
  retryCount: number;
}

interface EnhancementActions {
  enhanceLetter: (request: EnhancementRequest) => Promise<void>;
  suggestMilestones: (request: MilestoneSuggestionRequest) => Promise<void>;
  enhanceGoal: (goal: string) => Promise<{ enhancedGoal: string; suggestions: string[] } | null>;
  clearError: () => void;
  resetState: () => void;
  checkAvailability: () => Promise<boolean>;
  getUsageStats: (userId: string) => Promise<{daily: number; monthly: number; remaining: number}>;
}

// New interface for form-specific enhancement hook
interface SmartEnhancementParams {
  title: string;
  goal: string;
  content: string;
  send_date: string;
  onApplyField: (field: string, value: string) => void;
  onApplyMilestones?: (milestones: Array<{
    title: string;
    percentage: number;
    target_date: string;
    description: string;
  }>) => void;
}

interface EnhancedLetter {
  title: string;
  goal: string;
  content: string;
}

interface EnhancementData {
  enhancedLetter: EnhancedLetter;
  suggestedMilestones?: Array<{
    title: string;
    percentage: number;
    target_date: string;
    description: string;
  }>;
}

// Legacy function signature for backward compatibility
export function useSmartEnhancement(): [EnhancementState, EnhancementActions];

// New function signature for form-specific enhancement
export function useSmartEnhancement(params: SmartEnhancementParams): {
  state: 'idle' | 'loading' | 'success' | 'error';
  canEnhance: boolean;
  enhance: () => void;
  retry: () => void;
  hasEnhancementData: boolean;
  data?: EnhancementData;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  appliedFields: Set<string>;
  loadingFields: Set<string>;
  applyField: (field: string) => void;
  applyAllRemaining: () => void;
  milestonesApplied: boolean;
  isApplyingMilestones: boolean;
  applyMilestones: () => void;
};

// Implementation for both signatures
export function useSmartEnhancement(params?: SmartEnhancementParams) {
  // If no params provided, use the legacy hook implementation
  if (!params) {
    const [state, setState] = useState<EnhancementState>({
      isEnhancing: false,
      isSuggestingMilestones: false,
      retryCount: 0,
    });

  const { toast } = useToast();

  const enhanceLetter = useCallback(async (request: EnhancementRequest) => {
    try {
      setState(prev => ({ ...prev, isEnhancing: true, error: undefined }));
      
      logApiCall('info', 'Starting letter enhancement via hook', { request });

      const response = await enhancementService.enhanceLetter(request);

      if (!response.success) {
        throw new Error(response.error || 'Enhancement failed');
      }

      setState(prev => ({
        ...prev,
        isEnhancing: false,
        currentEnhancement: response.data,
        retryCount: 0,
      }));

      toast({
        title: "Letter Enhanced",
        description: "AI has provided suggestions to improve your letter.",
      });

      logApiCall('info', 'Letter enhancement completed successfully via hook', { 
        request, 
        response: response.data 
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enhancement failed';
      
      setState(prev => ({
        ...prev,
        isEnhancing: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1,
      }));

      handleApiError(error, 'enhance-letter-hook', true);
      
      logApiCall('error', 'Letter enhancement failed via hook', { 
        request, 
        error: errorMessage,
        retryCount: state.retryCount + 1 
      });
    }
  }, [toast, state.retryCount]);

  const suggestMilestones = useCallback(async (request: MilestoneSuggestionRequest) => {
    try {
      setState(prev => ({ ...prev, isSuggestingMilestones: true, error: undefined }));
      
      logApiCall('info', 'Starting milestone suggestions via hook', { request });

      const response = await enhancementService.suggestMilestones(request);

      if (!response.success) {
        throw new Error(response.error || 'Milestone suggestions failed');
      }

      setState(prev => ({
        ...prev,
        isSuggestingMilestones: false,
        currentMilestones: response.data,
        retryCount: 0,
      }));

      toast({
        title: "Milestones Generated",
        description: `AI has suggested ${response.data.milestones.length} milestones for your goal.`,
      });

      logApiCall('info', 'Milestone suggestions completed successfully via hook', { 
        request, 
        response: response.data 
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Milestone suggestions failed';
      
      setState(prev => ({
        ...prev,
        isSuggestingMilestones: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1,
      }));

      handleApiError(error, 'suggest-milestones-hook', true);
      
      logApiCall('error', 'Milestone suggestions failed via hook', { 
        request, 
        error: errorMessage,
        retryCount: state.retryCount + 1 
      });
    }
  }, [toast, state.retryCount]);

  const enhanceGoal = useCallback(async (goal: string): Promise<{ enhancedGoal: string; suggestions: string[] } | null> => {
    try {
      logApiCall('info', 'Starting goal enhancement via hook', { goal });

      const response = await enhancementService.enhanceGoal(goal);

      if (!response.success) {
        throw new Error(response.error || 'Goal enhancement failed');
      }

      toast({
        title: "Goal Enhanced",
        description: "AI has improved your goal statement.",
      });

      logApiCall('info', 'Goal enhancement completed successfully via hook', { 
        goal, 
        response: response.data 
      });

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Goal enhancement failed';
      
      handleApiError(error, 'enhance-goal-hook', true);
      
      logApiCall('error', 'Goal enhancement failed via hook', { 
        goal, 
        error: errorMessage 
      });

      return null;
    }
  }, [toast]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      isEnhancing: false,
      isSuggestingMilestones: false,
      retryCount: 0,
    });
  }, []);

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    try {
      return await enhancementService.isEnhancementAvailable();
    } catch (error) {
      logApiCall('error', 'Failed to check enhancement availability', { error });
      return false;
    }
  }, []);

  const getUsageStats = useCallback(async (userId: string) => {
    try {
      return await enhancementService.getUsageStats(userId);
    } catch (error) {
      logApiCall('error', 'Failed to get usage stats', { userId, error });
      return { daily: 0, monthly: 0, remaining: 10 };
    }
  }, []);

  const actions: EnhancementActions = useMemo(() => ({
    enhanceLetter,
    suggestMilestones,
    enhanceGoal,
    clearError,
    resetState,
    checkAvailability,
    getUsageStats,
  }), [enhanceLetter, suggestMilestones, enhanceGoal, clearError, resetState, checkAvailability, getUsageStats]);

    return [state, actions];
  }
  
  // Form-specific implementation when params are provided
  const { toast } = useToast();
  const { title, goal, content, send_date, onApplyField, onApplyMilestones } = params;
  
  const [enhancementState, setEnhancementState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [enhancementData, setEnhancementData] = useState<EnhancementData | undefined>(undefined);
  const [isExpanded, setIsExpanded] = useState(false);
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());
  const [loadingFields, setLoadingFields] = useState<Set<string>>(new Set());
  const [milestonesApplied, setMilestonesApplied] = useState(false);
  const [isApplyingMilestones, setIsApplyingMilestones] = useState(false);
  const [canEnhance, setCanEnhance] = useState(true);
  
  // Check if enhancement is available
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const isAvailable = await enhancementService.isEnhancementAvailable();
        console.log('Enhancement availability check result:', isAvailable);
        setCanEnhance(isAvailable);
      } catch (error) {
        console.error('Failed to check enhancement availability:', error);
        // Enable enhancement by default if status check fails
        setCanEnhance(true);
      }
    };
    
    checkAvailability();
  }, []);
  
  // Enhance the letter
  const enhance = useCallback(async () => {
    if (!title && !goal && !content) {
      toast({
        title: "Missing content",
        description: "Please add some content to your letter before enhancing.",
        variant: "destructive",
      });
      return;
    }
    
    setEnhancementState('loading');
    
    try {
      const request: EnhancementRequest = {
        title,
        goal,
        content,
        send_date,
        includeMilestones: true,
      };
      
      logApiCall('info', 'Starting letter enhancement via form hook', { request });
      
      const response = await enhancementService.enhanceLetter(request);
      
      if (!response.success) {
        throw new Error(response.error || 'Enhancement failed');
      }
      
      // Convert the EdgeFunctionResponse to the expected EnhancementData format
      const adaptedData: EnhancementData = {
        enhancedLetter: {
          title: response.data.enhancedLetter?.title || title,
          goal: response.data.enhancedLetter?.goal || goal,
          content: response.data.enhancedLetter?.content || content,
        },
        suggestedMilestones: response.data.suggestedMilestones,
      };
      
      setEnhancementData(adaptedData);
      setEnhancementState('success');
      setIsExpanded(true);
      
      toast({
        title: "Letter Enhanced",
        description: "AI has provided suggestions to improve your letter.",
      });
      
    } catch (error) {
      setEnhancementState('error');
      handleApiError(error, 'enhance-letter-form-hook', true);
      
      toast({
        title: "Enhancement failed",
        description: error instanceof Error ? error.message : "Failed to enhance letter",
        variant: "destructive",
      });
    }
  }, [title, goal, content, send_date, toast]);
  
  // Retry enhancement
  const retry = useCallback(() => {
    setEnhancementState('idle');
    enhance();
  }, [enhance]);
  
  // Apply a single field
  const applyField = useCallback((field: string) => {
    if (!enhancementData) return;
    
    setLoadingFields(prev => new Set(prev).add(field));
    
    setTimeout(() => {
      let value = '';
      
      switch (field) {
        case 'title':
          value = enhancementData.enhancedLetter.title;
          break;
        case 'goal':
          value = enhancementData.enhancedLetter.goal;
          break;
        case 'content':
          value = enhancementData.enhancedLetter.content;
          break;
      }
      
      onApplyField(field, value);
      
      setAppliedFields(prev => new Set(prev).add(field));
      setLoadingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }, 500); // Simulate loading for a better UX
  }, [enhancementData, onApplyField]);
  
  // Apply all remaining fields
  const applyAllRemaining = useCallback(() => {
    if (!enhancementData) return;
    
    ['title', 'goal', 'content'].forEach(field => {
      if (!appliedFields.has(field)) {
        applyField(field);
      }
    });
    
    if (enhancementData.suggestedMilestones && !milestonesApplied && onApplyMilestones) {
      applyMilestones();
    }
  }, [enhancementData, appliedFields, milestonesApplied, applyField, onApplyMilestones]);
  
  // Apply suggested milestones
  const applyMilestones = useCallback(() => {
    if (!enhancementData?.suggestedMilestones || !onApplyMilestones) return;
    
    setIsApplyingMilestones(true);
    
    setTimeout(() => {
      onApplyMilestones(enhancementData.suggestedMilestones || []);
      setMilestonesApplied(true);
      setIsApplyingMilestones(false);
    }, 500); // Simulate loading for a better UX
  }, [enhancementData, onApplyMilestones]);
  
  // Return the form-specific interface
  return {
    state: enhancementState,
    canEnhance,
    enhance,
    retry,
    hasEnhancementData: !!enhancementData,
    data: enhancementData,
    isExpanded,
    setIsExpanded,
    appliedFields,
    loadingFields,
    applyField,
    applyAllRemaining,
    milestonesApplied,
    isApplyingMilestones,
    applyMilestones,
  };
}
