import { Letter, Milestone } from "./database";

// Enhancement service types
export interface EnhancementRequest {
  title?: string;
  goal?: string;
  content?: string;
  send_date?: string;
}

export interface EnhancementResponse {
  enhancedLetter: {
    title: string;
    goal: string;
    content: string;
  };
  suggestedMilestones?: Array<{
    title: string;
    percentage: number;
    target_date: string;
    description: string;
  }>;
}

export interface MilestoneSuggestionRequest {
  letterId: string;
  goal: string;
  content?: string;
  sendDate: string;
}

export interface MilestoneSuggestionResponse {
  suggestedMilestones: Array<{
    title: string;
    percentage: number;
    target_date: string;
    description: string;
  }>;
}

// Notification service types
export interface NotificationRequest {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
}

// Letter delivery service types
export interface LetterDeliveryRequest {
  letterId: string;
  action: "schedule" | "send";
}

export interface LetterDeliveryResponse {
  success: boolean;
  message: string;
  newStatus: string;
  emailSent: boolean;
}

// Error response types
export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

// Cache manager types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

// Error handler types
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  timestamp: string;
  userAgent?: string;
}
