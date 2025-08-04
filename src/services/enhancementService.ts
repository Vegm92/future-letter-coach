import { ENHANCEMENT_CONFIG } from '@/lib/constants';
import type { EnhancementParams, EnhancementData, EnhancementService } from '@/types';

export class SupabaseEnhancementService implements EnhancementService {
  constructor(private supabaseClient: any) {}
  
  async fetchEnhancement(params: EnhancementParams): Promise<EnhancementData> {
    const { data, error } = await this.supabaseClient.functions.invoke(
      ENHANCEMENT_CONFIG.FUNCTION_NAME,
      { body: params }
    );

    if (error) {
      throw error;
    }

    return data;
  }

  generateInputHash(inputs: EnhancementParams): string {
    const inputString = `${inputs.title}|${inputs.goal}|${inputs.content}|${inputs.send_date}`;
    let hash = 0;
    for (let i = 0; i < inputString.length; i++) {
      const char = inputString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }
}

// Mock service for testing
export class MockEnhancementService implements EnhancementService {
  async fetchEnhancement(params: EnhancementParams): Promise<EnhancementData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      enhancedLetter: {
        title: `Enhanced: ${params.title}`,
        goal: `Enhanced: ${params.goal}`,
        content: `Enhanced: ${params.content}`
      },
      suggestedMilestones: [
        { title: "Test Milestone", description: "Test description", percentage: 25, target_date: "2024-12-31" }
      ]
    };
  }

  generateInputHash(inputs: EnhancementParams): string {
    return 'mock-hash-123';
  }
}