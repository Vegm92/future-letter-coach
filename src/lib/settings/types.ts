import { UserProfile } from '@/hooks/useProfile';

// Type definitions for settings
export type AITone = 'casual' | 'motivational' | 'professional' | 'formal';
export type TextSize = 'small' | 'normal' | 'large';
export type PrivacyLevel = 'private' | 'shared' | 'public';
export type TimezoneValue = string;
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja';

export interface AIPreferences {
  enabled: boolean;
  tone: AITone;
  auto_apply: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  draft_reminders?: boolean;
  delivery_alerts?: boolean;
  enhancement_notifications?: boolean;
  milestone_reminders?: boolean;
}

export interface AccessibilityPreferences {
  high_contrast: boolean;
  text_size: TextSize;
}

export interface PrivacySettings {
  letter_visibility: PrivacyLevel;
}

export interface SettingsFormData {
  profile?: {
    full_name?: string;
    timezone?: TimezoneValue;
    avatar_url?: string;
  };
  defaults?: {
    default_send_date_offset?: number;
    default_letter_template?: string;
    default_goal_format?: string;
  };
  ai_preferences?: AIPreferences;
  notification_preferences?: NotificationPreferences;
  accessibility_preferences?: AccessibilityPreferences;
  privacy_settings?: PrivacySettings;
  language?: LanguageCode;
}

// Validation schemas
export interface SettingsValidation {
  isValidSendDateOffset: (offset: number) => boolean;
  isValidTimezone: (timezone: string) => boolean;
  isValidLanguage: (language: string) => boolean;
  isValidTextSize: (size: string) => boolean;
}

// Form change tracking
export interface SettingsChangeTracker {
  hasChanges: (original: any, current: any) => boolean;
  getChangedFields: (original: any, current: any) => string[];
  canSave: (formData: any) => boolean;
}