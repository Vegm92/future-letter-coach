import { ERROR_MESSAGES } from '@/lib/constants';
import type { ErrorContext, NotificationService } from '@/types/services';

export class ErrorHandler {
  constructor(private notificationService: NotificationService) {}
  
  handleError(error: any, operation: string, context?: any): void {
    const errorInfo = this.categorizeError(error);
    this.logError(operation, error, context);
    this.notificationService.error(errorInfo);
  }

  private categorizeError(error: any) {
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (error?.code === 'FUNCTION_INVOCATION_FAILED') {
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE;
    }
    
    if (error?.message?.includes('rate limit') || error?.code === 429) {
      return ERROR_MESSAGES.RATE_LIMIT;
    }
    
    if (error?.message?.includes('authentication') || error?.code === 401) {
      return ERROR_MESSAGES.AUTHENTICATION;
    }
    
    return ERROR_MESSAGES.ENHANCEMENT_FAILED;
  }

  private logError(operation: string, error: any, context?: any): void {
    console.error(`[SmartEnhancement] ${operation} failed:`, {
      operation,
      timestamp: new Date().toISOString(),
      error: {
        name: error?.name || 'Unknown',
        message: error?.message || 'No error message',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      },
      context
    });
  }

  handleFieldApplicationError(error: any, field: string, value?: string): void {
    this.logError('applyField', error, {
      field,
      value: value?.substring(0, 100) + '...'
    });
    
    this.notificationService.error({
      ...ERROR_MESSAGES.FIELD_APPLICATION_FAILED,
      description: `Could not apply ${field} enhancement. ${ERROR_MESSAGES.FIELD_APPLICATION_FAILED.description}`
    });
  }

  handleMilestoneApplicationError(error: any, milestoneCount: number, milestones?: any[]): void {
    this.logError('applyMilestones', error, {
      milestoneCount,
      milestones: milestones?.map(m => ({ 
        title: m.title, 
        percentage: m.percentage 
      }))
    });
    
    this.notificationService.error(ERROR_MESSAGES.MILESTONE_APPLICATION_FAILED);
  }
}