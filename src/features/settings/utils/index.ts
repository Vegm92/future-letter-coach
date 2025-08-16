import {
  TIMEZONES,
  LANGUAGES,
  AI_TONES,
  TEXT_SIZES,
  DEFAULT_SETTINGS,
} from "../constants";
import type { SettingsData, ValidationResult, ValidationRule } from "../types";

// Settings validation utilities
export function validateSetting(
  key: string,
  value: unknown,
  rules: ValidationRule[]
): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    const validationResult = validateRule(key, value, rule);
    if (!validationResult.isValid) {
      errors.push(validationResult.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateRule(
  key: string,
  value: unknown,
  rule: ValidationRule
): { isValid: boolean; error: string } {
  switch (rule.type) {
    case "required":
      if (value === null || value === undefined || value === "") {
        return {
          isValid: false,
          error: `${key} is required`,
        };
      }
      break;

    case "min":
      if (typeof value === "number" && value < (rule.value as number)) {
        return {
          isValid: false,
          error: `${key} must be at least ${rule.value}`,
        };
      }
      break;

    case "max":
      if (typeof value === "number" && value > (rule.value as number)) {
        return {
          isValid: false,
          error: `${key} must be at most ${rule.value}`,
        };
      }
      break;

    case "pattern":
      if (
        typeof value === "string" &&
        !new RegExp(rule.value as string).test(value)
      ) {
        return {
          isValid: false,
          error: `${key} format is invalid`,
        };
      }
      break;

    case "custom":
      if (rule.value && typeof rule.value === "function") {
        const customValidator = rule.value as (
          value: unknown
        ) => boolean | string;
        const result = customValidator(value);
        if (typeof result === "string") {
          return {
            isValid: false,
            error: result,
          };
        }
        if (!result) {
          return {
            isValid: false,
            error: `${key} validation failed`,
          };
        }
      }
      break;
  }

  return { isValid: true, error: "" };
}

// Settings comparison utilities
export function hasSettingsChanged(
  original: SettingsData,
  current: SettingsData
): boolean {
  const originalKeys = Object.keys(original);
  const currentKeys = Object.keys(current);

  if (originalKeys.length !== currentKeys.length) {
    return true;
  }

  for (const key of originalKeys) {
    if (!currentKeys.includes(key)) {
      return true;
    }

    if (!isEqual(original[key], current[key])) {
      return true;
    }
  }

  return false;
}

export function getChangedSettings(
  original: SettingsData,
  current: SettingsData
): string[] {
  const changedKeys: string[] = [];

  for (const key of Object.keys(current)) {
    if (!isEqual(original[key], current[key])) {
      changedKeys.push(key);
    }
  }

  return changedKeys;
}

export function canSaveSettings(
  original: SettingsData,
  current: SettingsData,
  validationRules: Record<string, ValidationRule[]>
): { canSave: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for changes
  if (!hasSettingsChanged(original, current)) {
    return { canSave: false, errors: ["No changes detected"] };
  }

  // Validate current settings
  for (const [key, value] of Object.entries(current)) {
    if (validationRules[key]) {
      const validation = validateSetting(key, value, validationRules[key]);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }
  }

  return {
    canSave: errors.length === 0,
    errors,
  };
}

// Settings merge utilities
export function mergeSettings(
  base: SettingsData,
  overrides: SettingsData,
  strategy: "replace" | "merge" | "deep-merge" = "merge"
): SettingsData {
  switch (strategy) {
    case "replace":
      return { ...base, ...overrides };

    case "merge":
      return { ...base, ...overrides };

    case "deep-merge":
      return deepMerge(base, overrides);

    default:
      return { ...base, ...overrides };
  }
}

export function deepMerge(
  target: SettingsData,
  source: SettingsData
): SettingsData {
  const result: SettingsData = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = deepMerge(
        (result[key] as SettingsData) || {},
        value as SettingsData
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Settings transformation utilities
export function transformSettings(
  settings: SettingsData,
  transformer: (key: string, value: unknown) => unknown
): SettingsData {
  const transformed: SettingsData = {};

  for (const [key, value] of Object.entries(settings)) {
    transformed[key] = transformer(key, value);
  }

  return transformed;
}

export function filterSettings(
  settings: SettingsData,
  predicate: (key: string, value: unknown) => boolean
): SettingsData {
  const filtered: SettingsData = {};

  for (const [key, value] of Object.entries(settings)) {
    if (predicate(key, value)) {
      filtered[key] = value;
    }
  }

  return filtered;
}

export function mapSettings<T>(
  settings: SettingsData,
  mapper: (key: string, value: unknown) => T
): Record<string, T> {
  const mapped: Record<string, T> = {};

  for (const [key, value] of Object.entries(settings)) {
    mapped[key] = mapper(key, value);
  }

  return mapped;
}

// Settings serialization utilities
export function serializeSettings(settings: SettingsData): string {
  try {
    return JSON.stringify(settings, null, 2);
  } catch (error) {
    console.error("Failed to serialize settings:", error);
    return "{}";
  }
}

export function deserializeSettings(data: string): SettingsData {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to deserialize settings:", error);
    return {};
  }
}

// Settings migration utilities
export function migrateSettings(
  settings: SettingsData,
  migrations: Array<(data: SettingsData) => SettingsData>
): SettingsData {
  let migrated = { ...settings };

  for (const migration of migrations) {
    try {
      migrated = migration(migrated);
    } catch (error) {
      console.error("Migration failed:", error);
    }
  }

  return migrated;
}

// Settings backup utilities
export function createSettingsBackup(
  settings: SettingsData,
  metadata: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    data: settings,
    metadata: {
      app: "FutureLetter AI",
      ...metadata,
    },
  };
}

export function restoreSettingsFromBackup(
  backup: Record<string, unknown>
): SettingsData | null {
  try {
    if (
      backup.version &&
      backup.timestamp &&
      backup.data &&
      typeof backup.data === "object"
    ) {
      return backup.data as SettingsData;
    }
    return null;
  } catch (error) {
    console.error("Failed to restore settings from backup:", error);
    return null;
  }
}

// Form change tracking utilities
export function createLocalChangeTracker<T>() {
  return {
    hasChanges: (changes: Partial<T>): boolean => {
      return Object.keys(changes).length > 0;
    },

    canSave: (changes: Partial<T>, saving: boolean): boolean => {
      return Object.keys(changes).length > 0 && !saving;
    },

    getDisplayValue: <K extends keyof T>(
      field: K,
      localChanges: Partial<T>,
      originalData?: T,
      defaultValue: unknown = ""
    ): unknown => {
      return localChanges[field] ?? originalData?.[field] ?? defaultValue;
    },
  };
}

// Avatar utilities
export function getInitials(fullName?: string): string {
  if (!fullName) return "U";

  return fullName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Format utilities
export function formatSendDateOffset(days: number): string {
  if (days < 30) {
    return `${days} day${days === 1 ? "" : "s"}`;
  } else if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} month${months === 1 ? "" : "s"}`;
  } else {
    const years = Math.round(days / 365);
    return `${years} year${years === 1 ? "" : "s"}`;
  }
}

// Settings merging utilities for specific preference types
export function mergeAIPreferences(
  existing?: Record<string, unknown>,
  updates?: Partial<Record<string, unknown>>
): Record<string, unknown> {
  return {
    enabled: true,
    tone: "motivational",
    auto_apply: false,
    ...existing,
    ...updates,
  };
}

export function mergeAccessibilityPreferences(
  existing?: Record<string, unknown>,
  updates?: Partial<Record<string, unknown>>
): Record<string, unknown> {
  return {
    high_contrast: false,
    text_size: "normal",
    ...existing,
    ...updates,
  };
}

export function mergeNotificationPreferences(
  existing?: Record<string, unknown>,
  updates?: Partial<Record<string, unknown>>
): Record<string, unknown> {
  return {
    email: true,
    push: false,
    draft_reminders: true,
    delivery_alerts: true,
    enhancement_notifications: true,
    milestone_reminders: true,
    ...existing,
    ...updates,
  };
}

export function mergePrivacySettings(
  existing?: Record<string, unknown>,
  updates?: Partial<Record<string, unknown>>
): Record<string, unknown> {
  return {
    letter_visibility: "private",
    ...existing,
    ...updates,
  };
}

// Utility functions
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i], b[i])) return false;
      }
      return true;
    }

    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (
        !isEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key]
        )
      ) {
        return false;
      }
    }

    return true;
  }

  return false;
}
