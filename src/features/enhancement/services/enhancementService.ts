import { supabase } from "@/shared/config/client";
import { 
  withRetry, 
  logApiCall, 
  handleApiError, 
  createErrorResponse,
  type ApiResponse 
} from "@/shared/utils/api.utils";
import type { Letter, Milestone } from "@/shared/types/database";

export interface EnhancementRequest {
  title?: string;
  goal?: string;
  content?: string;
  send_date?: string;
  includeMilestones?: boolean;
}

export interface EnhancementResponse {
  enhancedContent: string;
  enhancedGoal?: string;
  milestones?: Omit<Milestone, 'id' | 'completed'>[];
  suggestions: string[];
  confidence: number;
}

export interface MilestoneSuggestionRequest {
  goal: string;
  content?: string;
  send_date?: string;
}

export interface MilestoneSuggestionResponse {
  milestones: Omit<Milestone, 'id' | 'completed'>[];
  reasoning: string;
  confidence: number;
}

class EnhancementService {
  private readonly retryConfig = {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };

  async enhanceLetter(request: EnhancementRequest): Promise<ApiResponse<EnhancementResponse>> {
    try {
      logApiCall('info', 'Starting letter enhancement', { request });

      const response = await withRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('enhance-letter', {
            body: request,
          });

          if (error) {
            throw new Error(error.message || 'Enhancement failed');
          }

          return data;
        },
        this.retryConfig,
        'enhance-letter'
      );

      logApiCall('info', 'Letter enhancement completed successfully', { 
        request, 
        response: { 
          hasEnhancedContent: !!response.enhancedContent,
          hasMilestones: !!response.milestones?.length,
          confidence: response.confidence 
        } 
      });

      return {
        success: true,
        data: response as EnhancementResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Letter enhancement failed', { request, error });
      return createErrorResponse(error, 'enhance-letter');
    }
  }

  async suggestMilestones(request: MilestoneSuggestionRequest): Promise<ApiResponse<MilestoneSuggestionResponse>> {
    try {
      logApiCall('info', 'Starting milestone suggestions', { request });

      const response = await withRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('suggest-milestones', {
            body: request,
          });

          if (error) {
            throw new Error(error.message || 'Milestone suggestions failed');
          }

          return data;
        },
        this.retryConfig,
        'suggest-milestones'
      );

      logApiCall('info', 'Milestone suggestions completed successfully', { 
        request, 
        response: { 
          milestoneCount: response.milestones?.length || 0,
          confidence: response.confidence 
        } 
      });

      return {
        success: true,
        data: response as MilestoneSuggestionResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Milestone suggestions failed', { request, error });
      return createErrorResponse(error, 'suggest-milestones');
    }
  }

  async enhanceGoal(goal: string): Promise<ApiResponse<{ enhancedGoal: string; suggestions: string[] }>> {
    try {
      logApiCall('info', 'Starting goal enhancement', { goal });

      const response = await withRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('enhance-goal', {
            body: { goal },
          });

          if (error) {
            throw new Error(error.message || 'Goal enhancement failed');
          }

          return data;
        },
        this.retryConfig,
        'enhance-goal'
      );

      logApiCall('info', 'Goal enhancement completed successfully', { 
        goal, 
        response: { 
          hasEnhancedGoal: !!response.enhancedGoal,
          suggestionCount: response.suggestions?.length || 0 
        } 
      });

      return {
        success: true,
        data: response as { enhancedGoal: string; suggestions: string[] },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Goal enhancement failed', { goal, error });
      return createErrorResponse(error, 'enhance-goal');
    }
  }

  async getEnhancementHistory(letterId: string): Promise<ApiResponse<Array<{
    id: string;
    timestamp: string;
    type: 'content' | 'goal' | 'milestones';
    original: string;
    enhanced: string;
    confidence: number;
  }>>> {
    try {
      logApiCall('info', 'Fetching enhancement history', { letterId });

      const { data, error } = await supabase
        .from('enhancement_history')
        .select('*')
        .eq('letter_id', letterId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message || 'Failed to fetch enhancement history');
      }

      logApiCall('info', 'Enhancement history fetched successfully', { 
        letterId, 
        count: data?.length || 0 
      });

      return {
        success: true,
        data: data || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Failed to fetch enhancement history', { letterId, error });
      return createErrorResponse(error, 'get-enhancement-history');
    }
  }

  // Helper method to check if enhancement is available
  async isEnhancementAvailable(): Promise<boolean> {
    try {
      const { data } = await supabase.functions.invoke('enhancement-status');
      return data?.available || false;
    } catch (error) {
      logApiCall('warn', 'Could not check enhancement availability', { error });
      return false;
    }
  }

  // Helper method to get enhancement usage stats
  async getUsageStats(userId: string): Promise<{
    daily: number;
    monthly: number;
    remaining: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('enhancement_usage')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const daily = data?.filter(u => 
        new Date(u.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;

      const monthly = data?.filter(u => 
        new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0;

      // Assuming daily limit of 10 and monthly limit of 100
      const remaining = Math.max(0, 10 - daily);

      return { daily, monthly, remaining };
    } catch (error) {
      logApiCall('warn', 'Could not fetch usage stats', { userId, error });
      return { daily: 0, monthly: 0, remaining: 10 };
    }
  }
}

// Export the class
export { EnhancementService };

// Create singleton instance
export const enhancementService = new EnhancementService();
