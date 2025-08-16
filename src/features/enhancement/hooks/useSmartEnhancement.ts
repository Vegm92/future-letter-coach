import { useState, useCallback, useMemo } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { EnhancementService } from "../services";

// Create enhancement service instance
const enhancementService = new EnhancementService();
import { logApiCall, handleApiError } from "@/shared/utils/api.utils";
import type { 
  EnhancementRequest, 
  EnhancementResponse,
  MilestoneSuggestionRequest,
  MilestoneSuggestionResponse 
} from "../services/enhancementService";

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

export function useSmartEnhancement(): [EnhancementState, EnhancementActions] {
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
