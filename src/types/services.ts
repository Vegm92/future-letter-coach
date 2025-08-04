// Service interface definitions

export interface EnhancementParams {
  title: string;
  goal: string;
  content: string;
  send_date: string;
}

export interface EnhancementData {
  enhancedLetter: {
    title: string;
    goal: string;
    content: string;
  };
  suggestedMilestones: Array<{
    title: string;
    description: string;
    percentage: number;
    target_date: string;
  }>;
}

export interface EnhancementService {
  fetchEnhancement(params: EnhancementParams): Promise<EnhancementData>;
  generateInputHash(inputs: EnhancementParams): string;
}

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

export interface ErrorContext {
  operation: string;
  [key: string]: any;
}

export interface CachedItem<T> {
  data: T;
  timestamp: number;
  expirationMs: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  expirationMs?: number;
  expirationSeconds?: number;
  expirationMinutes?: number;
  expirationHours?: number;
}

export interface CacheStats {
  total: number;
  valid: number;
  expired: number;
  averageAge: number;
  oldestItem: number;
  newestItem: number;
  memoryUsage: number;
}