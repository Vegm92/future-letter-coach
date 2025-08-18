/**
 * PROGRESSIVE ENHANCEMENT HOOK
 * 
 * Supports individual field enhancement and milestone inference.
 * More thoughtful, step-by-step user experience.
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { 
  FieldEnhancementRequest, 
  FieldEnhancementResponse, 
  MilestoneInferenceRequest, 
  MilestoneInferenceResponse 
} from '../lib/types';


export function useEnhancement() {
  const { toast } = useToast();

  // Individual field enhancement
  const fieldEnhancementMutation = useMutation({
    mutationFn: async (data: FieldEnhancementRequest): Promise<FieldEnhancementResponse> => {
      const { data: response, error } = await supabase.functions.invoke('enhance-field', {
        body: data,
      });

      if (error) throw error;
      
      // The response comes wrapped in the standard format from the edge function
      return response.data;
    },
    onError: (error) => {
      toast({
        title: 'Enhancement failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Milestone inference
  const milestoneInferenceMutation = useMutation({
    mutationFn: async (data: MilestoneInferenceRequest): Promise<MilestoneInferenceResponse> => {
      const { data: response, error } = await supabase.functions.invoke('infer-milestones', {
        body: data,
      });

      if (error) throw error;
      
      // The response comes wrapped in the standard format from the edge function
      return response.data;
    },
    onError: (error) => {
      toast({
        title: 'Milestone inference failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    // Individual field enhancement
    enhanceField: fieldEnhancementMutation.mutateAsync,
    isEnhancingField: fieldEnhancementMutation.isPending,
    
    // Milestone inference
    inferMilestones: milestoneInferenceMutation.mutateAsync,
    isInferringMilestones: milestoneInferenceMutation.isPending,
    
    // Overall loading state
    isLoading: fieldEnhancementMutation.isPending || milestoneInferenceMutation.isPending,
  };
}
