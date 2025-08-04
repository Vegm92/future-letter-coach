export interface NotificationMessage {
  title: string;
  description: string;
  variant?: "default" | "destructive";
}

export interface NotificationService {
  success(message: NotificationMessage): void;
  error(message: NotificationMessage): void;
  info(message: NotificationMessage): void;
}

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