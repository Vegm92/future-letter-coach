import type { NotificationMessage, NotificationService } from '@/types/services';

export class ToastNotificationService implements NotificationService {
  constructor(private toast: (options: any) => void) {}
  
  success(message: NotificationMessage): void {
    this.toast({ ...message });
  }
  
  error(message: NotificationMessage): void {
    this.toast({ ...message, variant: "destructive" });
  }

  info(message: NotificationMessage): void {
    this.toast({ ...message });
  }
}

// Console notification service for testing/debugging
export class ConsoleNotificationService implements NotificationService {
  success(message: NotificationMessage): void {
    console.log('SUCCESS:', message.title, message.description);
  }
  
  error(message: NotificationMessage): void {
    console.error('ERROR:', message.title, message.description);
  }

  info(message: NotificationMessage): void {
    console.info('INFO:', message.title, message.description);
  }
}