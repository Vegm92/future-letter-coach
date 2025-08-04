import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FORM_FIELDS, ENHANCEMENT_CONFIG, ERROR_MESSAGES, type FieldType } from '@/lib/constants';
import { SupabaseEnhancementService } from '@/services/enhancementService';
import { ToastNotificationService } from '@/services/notificationService';
import { ErrorHandler } from '@/utils/errorHandler';
import { CacheManager } from '@/utils/cacheManager';
import type { 
  UseSmartEnhancementProps, 
  EnhancementState, 
  UseSmartEnhancementDeps,
  EnhancementData
} from '@/types';

export const useSmartEnhancement = (
  {
    title,
    goal,
    content,
    send_date,
    onApplyField,
    onApplyMilestones
  }: UseSmartEnhancementProps,
  deps?: UseSmartEnhancementDeps
) => {
  const { toast } = useToast();
  
  // Use injected dependencies or create defaults
  const enhancementService = deps?.enhancementService || new SupabaseEnhancementService(supabase);
  const notificationService = deps?.notificationService || new ToastNotificationService(toast);
  const errorHandler = deps?.errorHandler || new ErrorHandler(notificationService);
  const cacheManager = deps?.cacheManager || new CacheManager<EnhancementData>();

  const [enhancementState, setEnhancementState] = useState<EnhancementState>({
    status: 'idle',
    data: null,
    showSuggestions: false,
    isExpanded: false,
    appliedFields: new Set(),
    loadingFields: new Set(),
    milestonesApplied: false,
    isApplyingMilestones: false,
    lastInputHash: null,
    isUsingCache: false,
  });

  // Check if we have a cached enhancement for current inputs
  const getCachedEnhancement = useCallback((inputHash: string): EnhancementData | null => {
    return cacheManager.get(inputHash);
  }, [cacheManager]);

  // Function to fetch enhancement from service
  const fetchEnhancement = useCallback(async (title: string, goal: string, content: string, sendDate: string): Promise<EnhancementData> => {
    return enhancementService.fetchEnhancement({ title, goal, content, send_date: sendDate });
  }, [enhancementService]);

  const fetchEnhancementWithHash = useCallback(async (inputHash: string) => {
    try {
      const data = await fetchEnhancement(title, goal, content, send_date);
      
      // Cache the result
      cacheManager.set(inputHash, data, ENHANCEMENT_CONFIG.CACHE_EXPIRATION_HOURS);
      
      setEnhancementState(prev => ({
        ...prev,
        status: 'success',
        data,
        showSuggestions: true,
        isExpanded: true,
        lastInputHash: inputHash,
        isUsingCache: false
      }));

      notificationService.success(ERROR_MESSAGES.ENHANCEMENT_SUCCESS);
    } catch (error: any) {
      setEnhancementState(prev => ({
        ...prev,
        status: 'error'
      }));

      errorHandler.handleError(error, 'fetchEnhancement', {
        inputHash,
        formData: { 
          titleLength: title.length, 
          goalLength: goal.length, 
          contentLength: content.length,
          sendDate: send_date 
        }
      });
    }
  }, [title, goal, content, send_date, fetchEnhancement, cacheManager, notificationService, errorHandler]);

  // Main enhancement function
  const enhance = useCallback(async () => {
    if (enhancementState.status === 'loading') return;
    
    const inputHash = enhancementService.generateInputHash({ title, goal, content, send_date });
    
    // Check cache first
    const cached = getCachedEnhancement(inputHash);
    if (cached) {
      setEnhancementState(prev => ({
        ...prev,
        status: 'success',
        data: cached,
        showSuggestions: true,
        isExpanded: true,
        appliedFields: new Set(),
        milestonesApplied: false,
        lastInputHash: inputHash,
        isUsingCache: true
      }));
      
      notificationService.info({
        title: "✨ Cached Enhancement Restored!",
        description: "Using previously generated suggestions for these inputs."
      });
      return;
    }

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

    await fetchEnhancementWithHash(inputHash);
  }, [enhancementState.status, enhancementService, getCachedEnhancement, fetchEnhancementWithHash, title, goal, content, send_date, notificationService]);

  // Apply individual field enhancement
  const applyField = useCallback(async (field: FieldType) => {
    if (!enhancementState.data?.enhancedLetter) return;

    const value = enhancementState.data.enhancedLetter[field];
    
    setEnhancementState(prev => ({
      ...prev,
      loadingFields: new Set([...prev.loadingFields, field])
    }));
    
    try {
      // Apply with a small delay to ensure smooth UX
      await new Promise(resolve => setTimeout(resolve, ENHANCEMENT_CONFIG.APPLY_FIELD_DELAY));
      
      onApplyField(field, value);

      setEnhancementState(prev => ({
        ...prev,
        appliedFields: new Set([...prev.appliedFields, field]),
        loadingFields: new Set([...prev.loadingFields].filter(f => f !== field))
      }));

      notificationService.success({
        ...ERROR_MESSAGES.FIELD_APPLIED,
        description: `Updated ${field} with AI suggestion.`
      });
    } catch (error: any) {
      setEnhancementState(prev => ({
        ...prev,
        loadingFields: new Set([...prev.loadingFields].filter(f => f !== field))
      }));
      
      errorHandler.handleFieldApplicationError(error, field, value);
    }
  }, [enhancementState.data, onApplyField, notificationService, errorHandler]);

  // Apply milestone suggestions
  const applyMilestones = useCallback(async () => {
    if (!enhancementState.data?.suggestedMilestones?.length || !onApplyMilestones || enhancementState.milestonesApplied) return;

    setEnhancementState(prev => ({
      ...prev,
      isApplyingMilestones: true
    }));

    try {
      // Apply with a slightly longer delay for milestones
      await new Promise(resolve => setTimeout(resolve, ENHANCEMENT_CONFIG.APPLY_MILESTONES_DELAY));
      
      onApplyMilestones(enhancementState.data.suggestedMilestones);

      setEnhancementState(prev => ({
        ...prev,
        milestonesApplied: true,
        isApplyingMilestones: false
      }));

      notificationService.success({
        ...ERROR_MESSAGES.MILESTONES_APPLIED,
        description: `Added ${enhancementState.data.suggestedMilestones.length} suggested milestones.`
      });
    } catch (error: any) {
      setEnhancementState(prev => ({
        ...prev,
        isApplyingMilestones: false
      }));
      
      errorHandler.handleMilestoneApplicationError(
        error, 
        enhancementState.data?.suggestedMilestones?.length || 0,
        enhancementState.data?.suggestedMilestones
      );
    }
  }, [enhancementState.data, enhancementState.milestonesApplied, onApplyMilestones, notificationService, errorHandler]);

  // Apply all remaining enhancements
  const applyAllRemaining = useCallback(async () => {
    if (!enhancementState.data?.enhancedLetter) return;

    const remainingFields = FORM_FIELDS.filter(
      field => !enhancementState.appliedFields.has(field) && enhancementState.data!.enhancedLetter[field] !== ''
    );

    if (remainingFields.length === 0 && (enhancementState.milestonesApplied || !enhancementState.data.suggestedMilestones?.length)) {
      notificationService.info({
        title: "Nothing to Apply",
        description: "All enhancements have already been applied."
      });
      return;
    }

    // Apply remaining fields
    for (const field of remainingFields) {
      await applyField(field);
    }

    // Apply milestones if not already applied
    if (!enhancementState.milestonesApplied && enhancementState.data.suggestedMilestones?.length && onApplyMilestones) {
      await applyMilestones();
    }
    
    notificationService.success({
      title: "✅ All Enhancements Applied",
      description: "Your letter has been updated with all remaining AI suggestions."
    });
  }, [enhancementState, applyField, applyMilestones, onApplyMilestones, notificationService]);

  const retry = () => enhance();

  const setIsExpanded = (expanded: boolean) => {
    setEnhancementState(prev => ({
      ...prev,
      isExpanded: expanded
    }));
  };

  // Check if we already have enhancement data for current inputs
  const currentInputHash = enhancementService.generateInputHash({ title, goal, content, send_date });
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