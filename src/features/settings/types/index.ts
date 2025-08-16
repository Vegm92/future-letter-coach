// Settings feature types

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateRequest {
  full_name?: string;
  timezone?: string;
  avatar_url?: string;
}

export interface AIPreferences {
  enhancement_style: 'professional' | 'casual' | 'inspirational';
  auto_enhancement: boolean;
  milestone_suggestions: boolean;
  content_analysis: boolean;
}

export interface NotificationSettings {
  email_reminders: boolean;
  push_notifications: boolean;
  letter_delivery: boolean;
  milestone_updates: boolean;
  weekly_summary: boolean;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  login_notifications: boolean;
  data_export_enabled: boolean;
}

export interface AccessibilitySettings {
  theme: 'light' | 'dark' | 'system';
  font_size: 'small' | 'medium' | 'large';
  high_contrast: boolean;
  reduced_motion: boolean;
  language: string;
}

export interface LetterDefaults {
  default_send_time: string;
  default_privacy: 'private' | 'public';
  include_milestones: boolean;
  auto_enhance: boolean;
}

// ============================================================================
// CONSOLIDATED SETTINGS TYPES FROM lib/settings
// ============================================================================

// Settings configuration types
export interface SettingsConfig {
  [key: string]: SettingDefinition;
}

export interface SettingDefinition {
  type: "string" | "number" | "boolean" | "select" | "multiselect" | "json";
  defaultValue: unknown;
  label: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: unknown) => boolean | string;
  };
  category: string;
  order: number;
}

// Settings data types
export interface SettingsData {
  [key: string]: unknown;
}

export interface SettingsCategory {
  name: string;
  label: string;
  description?: string;
  icon?: string;
  settings: string[];
}

// Settings validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "custom";
  value?: unknown;
  message: string;
}

// Settings migration types
export interface SettingsMigration {
  version: number;
  migrate: (oldData: SettingsData) => SettingsData;
  description: string;
}

// Settings import/export types
export interface SettingsExport {
  version: string;
  timestamp: string;
  data: SettingsData;
  metadata: {
    app: string;
    user: string;
    environment: string;
  };
}

// Settings hooks types
export interface UseSettingsReturn {
  settings: SettingsData;
  updateSetting: <T>(key: string, value: T) => void;
  resetSetting: (key: string) => void;
  resetAllSettings: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

// Settings service types
export interface SettingsServiceInterface {
  getSetting: <T>(key: string, defaultValue: T) => T;
  setSetting: <T>(key: string, value: T) => void;
  deleteSetting: (key: string) => void;
  getAllSettings: () => SettingsData;
  resetSettings: () => void;
  validateSettings: (data: SettingsData) => ValidationResult;
  migrateSettings: (fromVersion: number, toVersion: number) => void;
}

// Settings storage types
export interface SettingsStorage {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  delete: (key: string) => void;
  clear: () => void;
  keys: () => string[];
  has: (key: string) => boolean;
}

// Settings cache types
export interface SettingsCache {
  data: Map<string, unknown>;
  timestamp: number;
  ttl: number;
}

// Settings event types
export interface SettingsChangeEvent {
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

export interface SettingsEvents {
  onChange: (event: SettingsChangeEvent) => void;
  onReset: (keys: string[]) => void;
  onImport: (data: SettingsExport) => void;
  onExport: (data: SettingsExport) => void;
}
