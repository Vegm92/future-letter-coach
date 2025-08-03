import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedLetter {
  title: string;
  goal: string;
  content: string;
}

interface SuggestedMilestone {
  title: string;
  percentage: number;
  target_date: string;
  description: string;
}

interface EnhanceLetterCompleteResponse {
  enhancedLetter: EnhancedLetter;
  suggestedMilestones: SuggestedMilestone[];
}

interface UseEnhanceLetterCompleteParams {
  title: string;
  goal: string;
  content: string;
  send_date: string;
  enabled?: boolean;
}

// Create a hash from the input parameters for cache key
const createCacheKey = (params: UseEnhanceLetterCompleteParams) => {
  const inputString = `${params.title}-${params.goal}-${params.content}-${params.send_date}`;
  return btoa(inputString).slice(0, 16); // Simple hash for cache key
};

export const useEnhanceLetterComplete = (params: UseEnhanceLetterCompleteParams) => {
  const cacheKey = createCacheKey(params);
  
  return useQuery({
    queryKey: ['enhance-letter-complete', cacheKey],
    queryFn: async (): Promise<EnhanceLetterCompleteResponse> => {
      const { data, error } = await supabase.functions.invoke('enhance-letter-complete', {
        body: {
          title: params.title,
          goal: params.goal,
          content: params.content,
          send_date: params.send_date,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to enhance letter');
      }

      if (!data?.enhancedLetter || !data?.suggestedMilestones) {
        throw new Error('Invalid response format');
      }

      return data;
    },
    enabled: params.enabled !== false && Boolean(params.goal?.trim()),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3 days
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};