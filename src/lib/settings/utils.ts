import { TIMEZONES, LANGUAGES, AI_TONES, TEXT_SIZES, DEFAULT_SETTINGS } from './constants';
import type { 
  AIPreferences, 
  NotificationPreferences, 
  AccessibilityPreferences, 
  PrivacySettings,
  SettingsFormData,
  AITone,
  TextSize,
  PrivacyLevel 
} from './types';

// Validation utilities
export const validateSendDateOffset = (offset: number): boolean => {
  return offset >= 1 && offset <= 3650; // 1 day to 10 years
};

export const validateTimezone = (timezone: string): boolean => {
  return TIMEZONES.some(tz => tz.value === timezone);
};

export const validateLanguage = (language: string): boolean => {
  return LANGUAGES.some(lang => lang.value === language);
};

export const validateTextSize = (size: string): boolean => {
  return TEXT_SIZES.some(ts => ts.value === size);
};

// Form utilities
export const hasFormChanges = (original: any, current: any): boolean => {
  if (!original || !current) return false;
  
  return JSON.stringify(original) !== JSON.stringify(current);
};

export const getChangedFields = (original: any, current: any): string[] => {
  const changes: string[] = [];
  
  if (!original || !current) return changes;
  
  Object.keys(current).forEach(key => {
    if (JSON.stringify(original[key]) !== JSON.stringify(current[key])) {
      changes.push(key);
    }
  });
  
  return changes;
};

// Settings merging utilities
export const mergeAIPreferences = (
  existing?: AIPreferences, 
  updates?: Partial<AIPreferences>
): AIPreferences => {
  return {
    ...DEFAULT_SETTINGS.AI_PREFERENCES,
    ...existing,
    ...updates,
  };
};

export const mergeNotificationPreferences = (
  existing?: NotificationPreferences,
  updates?: Partial<NotificationPreferences>
): NotificationPreferences => {
  return {
    ...DEFAULT_SETTINGS.NOTIFICATION_PREFERENCES,
    ...existing,
    ...updates,
  };
};

export const mergeAccessibilityPreferences = (
  existing?: AccessibilityPreferences,
  updates?: Partial<AccessibilityPreferences>
): AccessibilityPreferences => {
  return {
    ...DEFAULT_SETTINGS.ACCESSIBILITY_PREFERENCES,
    ...existing,
    ...updates,
  };
};

export const mergePrivacySettings = (
  existing?: PrivacySettings,
  updates?: Partial<PrivacySettings>
): PrivacySettings => {
  return {
    ...DEFAULT_SETTINGS.PRIVACY_SETTINGS,
    ...existing,
    ...updates,
  };
};

// Format utilities
export const formatSendDateOffset = (days: number): string => {
  if (days < 30) {
    return `${days} day${days === 1 ? '' : 's'}`;
  } else if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? '' : 's'}`;
  } else {
    const years = Math.round(days / 365);
    return `${years} year${years === 1 ? '' : 's'}`;
  }
};

export const getTimezoneLabel = (timezone: string): string => {
  const tz = TIMEZONES.find(t => t.value === timezone);
  return tz?.label || timezone;
};

export const getLanguageLabel = (languageCode: string): string => {
  const lang = LANGUAGES.find(l => l.value === languageCode);
  return lang?.label || languageCode;
};

export const getAIToneDescription = (tone: AITone): string => {
  const toneConfig = AI_TONES.find(t => t.value === tone);
  return toneConfig?.description || 'Unknown tone';
};

// Avatar utilities
export const getInitials = (fullName?: string): string => {
  if (!fullName) return 'U';
  
  return fullName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const validateAvatarFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and GIF files are allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  return { valid: true };
};

// Form state utilities
export const createLocalChangeTracker = <T>() => {
  return {
    hasChanges: (changes: T): boolean => {
      return Object.keys(changes as object).length > 0;
    },
    
    canSave: (changes: T, saving: boolean): boolean => {
      return Object.keys(changes as object).length > 0 && !saving;
    },
    
    getDisplayValue: <K extends keyof T>(
      field: K, 
      localChanges: Partial<T>, 
      originalData?: T,
      defaultValue: any = ''
    ): any => {
      return localChanges[field] ?? originalData?.[field] ?? defaultValue;
    }
  };
};

// Settings export/import utilities
export const exportUserSettings = (profile: any): SettingsFormData => {
  return {
    profile: {
      full_name: profile.full_name,
      timezone: profile.timezone,
      avatar_url: profile.avatar_url,
    },
    defaults: {
      default_send_date_offset: profile.default_send_date_offset,
      default_letter_template: profile.default_letter_template,
      default_goal_format: profile.default_goal_format,
    },
    ai_preferences: profile.ai_preferences,
    notification_preferences: profile.notification_preferences,
    accessibility_preferences: profile.accessibility_preferences,
    privacy_settings: profile.privacy_settings,
    language: profile.language,
  };
};

export const sanitizeSettingsImport = (data: any): Partial<SettingsFormData> => {
  const sanitized: Partial<SettingsFormData> = {};
  
  // Only include valid fields and validate them
  if (data.profile?.full_name && typeof data.profile.full_name === 'string') {
    sanitized.profile = { ...sanitized.profile, full_name: data.profile.full_name };
  }
  
  if (data.profile?.timezone && validateTimezone(data.profile.timezone)) {
    sanitized.profile = { ...sanitized.profile, timezone: data.profile.timezone };
  }
  
  if (data.defaults?.default_send_date_offset && 
      validateSendDateOffset(data.defaults.default_send_date_offset)) {
    sanitized.defaults = { 
      ...sanitized.defaults, 
      default_send_date_offset: data.defaults.default_send_date_offset 
    };
  }
  
  // Add more validation as needed
  
  return sanitized;
};