import { supabase } from '@/shared/config/client';
import { 
  withRetry, 
  logApiCall, 
  handleApiError, 
  createErrorResponse,
  type ApiResponse 
} from "@/shared/utils/api.utils";

export interface NotificationRequest {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  userId: string;
  data?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface NotificationResponse {
  id: string;
  sent: boolean;
  timestamp: string;
  deliveryStatus: 'pending' | 'sent' | 'failed' | 'delivered';
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

class NotificationService {
  private readonly retryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
  };

  async sendNotification(request: NotificationRequest): Promise<ApiResponse<NotificationResponse>> {
    try {
      logApiCall('info', 'Sending notification', { 
        type: request.type, 
        userId: request.userId,
        priority: request.priority 
      });

      const response = await withRetry(
        async () => {
          const { data, error } = await supabase.functions.invoke('send-notification', {
            body: request,
          });

          if (error) {
            throw new Error(error.message || 'Failed to send notification');
          }

          return data;
        },
        this.retryConfig,
        'send-notification'
      );

      logApiCall('info', 'Notification sent successfully', { 
        type: request.type, 
        userId: request.userId,
        notificationId: response.id 
      });

      return {
        success: true,
        data: response as NotificationResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Failed to send notification', { 
        type: request.type, 
        userId: request.userId, 
        error 
      });
      return createErrorResponse(error, 'send-notification');
    }
  }

  async sendBulkNotifications(requests: NotificationRequest[]): Promise<ApiResponse<NotificationResponse[]>> {
    try {
      logApiCall('info', 'Sending bulk notifications', { count: requests.length });

      const responses = await Promise.all(
        requests.map(request => this.sendNotification(request))
      );

      const successful = responses.filter(r => r.success);
      const failed = responses.filter(r => !r.success);

      logApiCall('info', 'Bulk notifications completed', { 
        total: requests.length,
        successful: successful.length,
        failed: failed.length 
      });

      if (failed.length > 0) {
        logApiCall('warn', 'Some notifications failed', { 
          failedCount: failed.length,
          errors: failed.map(f => f.error) 
        });
      }

      return {
        success: true,
        data: successful.map(r => r.data!).filter(Boolean),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Bulk notifications failed', { error });
      return createErrorResponse(error, 'send-bulk-notifications');
    }
  }

  async getNotificationHistory(userId: string, limit = 50): Promise<ApiResponse<Array<{
    id: string;
    type: string;
    title: string;
    message?: string;
    timestamp: string;
    read: boolean;
    delivered: boolean;
  }>>> {
    try {
      logApiCall('info', 'Fetching notification history', { userId, limit });

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message || 'Failed to fetch notification history');
      }

      logApiCall('info', 'Notification history fetched successfully', { 
        userId, 
        count: data?.length || 0 
      });

      return {
        success: true,
        data: data || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Failed to fetch notification history', { userId, error });
      return createErrorResponse(error, 'get-notification-history');
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      logApiCall('info', 'Marking notification as read', { notificationId });

      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        throw new Error(error.message || 'Failed to mark notification as read');
      }

      logApiCall('info', 'Notification marked as read successfully', { notificationId });

      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Failed to mark notification as read', { notificationId, error });
      return createErrorResponse(error, 'mark-notification-read');
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<ApiResponse<void>> {
    try {
      logApiCall('info', 'Marking all notifications as read', { userId });

      const { error } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        throw new Error(error.message || 'Failed to mark all notifications as read');
      }

      logApiCall('info', 'All notifications marked as read successfully', { userId });

      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Failed to mark all notifications as read', { userId, error });
      return createErrorResponse(error, 'mark-all-notifications-read');
    }
  }

  async getNotificationPreferences(userId: string): Promise<ApiResponse<NotificationPreferences>> {
    try {
      logApiCall('info', 'Fetching notification preferences', { userId });

      const { data, error } = await supabase
        .from('user_preferences')
        .select('notification_preferences')
        .eq('user_id', userId)
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to fetch notification preferences');
      }

      const preferences = data?.notification_preferences || this.getDefaultPreferences();

      logApiCall('info', 'Notification preferences fetched successfully', { userId });

      return {
        success: true,
        data: preferences,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Failed to fetch notification preferences', { userId, error });
      return createErrorResponse(error, 'get-notification-preferences');
    }
  }

  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<ApiResponse<void>> {
    try {
      logApiCall('info', 'Updating notification preferences', { userId, preferences });

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          notification_preferences: preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(error.message || 'Failed to update notification preferences');
      }

      logApiCall('info', 'Notification preferences updated successfully', { userId });

      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Failed to update notification preferences', { userId, error });
      return createErrorResponse(error, 'update-notification-preferences');
    }
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    try {
      logApiCall('info', 'Deleting notification', { notificationId });

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw new Error(error.message || 'Failed to delete notification');
      }

      logApiCall('info', 'Notification deleted successfully', { notificationId });

      return {
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logApiCall('error', 'Failed to delete notification', { notificationId, error });
      return createErrorResponse(error, 'delete-notification');
    }
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      email: true,
      push: false,
      inApp: true,
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    };
  }
}

export const notificationService = new NotificationService();
