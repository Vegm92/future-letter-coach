/**
 * SIMPLIFIED ENHANCEMENT HOOK
 * 
 * Direct Supabase Edge Function calls.
 * No complex service layers or state management.
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { EnhancementRequest, EnhancementResponse, UseEnhancementReturn } from '../lib/types';

export function useEnhancement(): UseEnhancementReturn {
  const { toast } = useToast();

  const enhancementMutation = useMutation({
    mutationFn: async (data: EnhancementRequest): Promise<EnhancementResponse> => {
      const { data: response, error } = await supabase.functions.invoke('enhance-letter-complete', {
        body: data,
      });

      if (error) throw error;
      
      // Transform response to match our types
      return {
        enhancedTitle: response.enhancedLetter.title,
        enhancedGoal: response.enhancedLetter.goal,
        enhancedContent: response.enhancedLetter.content,
        suggestedMilestones: response.suggestedMilestones || [],
      };
    },
    onSuccess: () => {
      toast({
        title: 'Letter Enhanced',
        description: 'AI has provided suggestions to improve your letter.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Enhancement failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    enhance: enhancementMutation.mutateAsync,
    isLoading: enhancementMutation.isPending,
    error: enhancementMutation.error?.message,
  };
}
