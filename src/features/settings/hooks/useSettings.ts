import { useState, useCallback, useMemo, useEffect } from "react";
import { useProfile } from "./useProfile";
import { SettingsService } from "../services";

// Create settings service instance
const settingsService = new SettingsService();
import type {
  SettingsData,
  UseSettingsReturn,
  SettingsCategory,
} from "../types";

export function useSettings(): UseSettingsReturn {
  const { profile } = useProfile();
  const [settings, setSettings] = useState<SettingsData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    if (profile?.id) {
      loadSettings();
    }
  }, [profile?.id]);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedSettings = await settingsService.getAllSettings();
      setSettings(loadedSettings);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load settings";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSetting = useCallback(<T>(key: string, value: T) => {
    try {
      settingsService.setSetting(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update setting";
      setError(errorMessage);
    }
  }, []);

  const resetSetting = useCallback((key: string) => {
    try {
      settingsService.deleteSetting(key);
      setSettings((prev) => {
        const newSettings = { ...prev };
        delete newSettings[key];
        return newSettings;
      });
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reset setting";
      setError(errorMessage);
    }
  }, []);

  const resetAllSettings = useCallback(() => {
    try {
      settingsService.resetSettings();
      setSettings({});
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reset settings";
      setError(errorMessage);
    }
  }, []);

  const exportSettings = useCallback(() => {
    try {
      return settingsService.exportSettings();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export settings";
      setError(errorMessage);
      return "";
    }
  }, []);

  const importSettings = useCallback(
    (data: string) => {
      try {
        const success = settingsService.importSettings(data);
        if (success) {
          loadSettings(); // Reload settings after import
          setError(null);
        }
        return success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to import settings";
        setError(errorMessage);
        return false;
      }
    },
    [loadSettings]
  );

  return {
    settings,
    updateSetting,
    resetSetting,
    resetAllSettings,
    exportSettings,
    importSettings,
    isLoading,
    error,
  };
}

export function useSettingsCategory(categoryName: string) {
  const { settings } = useSettings();

  const categorySettings = useMemo(() => {
    const category: SettingsCategory = {
      name: categoryName,
      label: getCategoryLabel(categoryName),
      description: getCategoryDescription(categoryName),
      icon: getCategoryIcon(categoryName),
      settings: Object.keys(settings).filter((key) =>
        key.startsWith(`${categoryName}.`)
      ),
    };

    return category;
  }, [categoryName, settings]);

  return categorySettings;
}

export function useNestedSettings(baseKey: string) {
  const { settings, updateSetting } = useSettings();

  const currentNested = useMemo(() => {
    const nested: Record<string, unknown> = {};
    Object.keys(settings).forEach((key) => {
      if (key.startsWith(`${baseKey}.`)) {
        const nestedKey = key.substring(baseKey.length + 1);
        nested[nestedKey] = settings[key];
      }
    });
    return nested;
  }, [baseKey, settings]);

  const updateNestedSetting = useCallback(
    (nestedKey: string, value: unknown) => {
      const fullKey = `${baseKey}.${nestedKey}`;
      updateSetting(fullKey, value);
    },
    [baseKey, updateSetting]
  );

  const getNestedSetting = useCallback(
    <T>(nestedKey: string, defaultValue: T): T => {
      const fullKey = `${baseKey}.${nestedKey}`;
      return (settings[fullKey] as T) ?? defaultValue;
    },
    [baseKey, settings]
  );

  return {
    nestedSettings: currentNested,
    updateNestedSetting,
    getNestedSetting,
  };
}

// Helper functions
function getCategoryLabel(categoryName: string): string {
  const labels: Record<string, string> = {
    profile: "Profile",
    ai: "AI Preferences",
    notifications: "Notifications",
    accessibility: "Accessibility",
    privacy: "Privacy",
    defaults: "Letter Defaults",
    security: "Security",
  };
  return labels[categoryName] || categoryName;
}

function getCategoryDescription(categoryName: string): string {
  const descriptions: Record<string, string> = {
    profile: "Manage your profile information and preferences",
    ai: "Configure AI enhancement settings and preferences",
    notifications: "Control how and when you receive notifications",
    accessibility: "Customize the app for your accessibility needs",
    privacy: "Manage your privacy and data sharing preferences",
    defaults: "Set default values for new letters and goals",
    security: "Configure security settings and authentication",
  };
  return descriptions[categoryName] || "";
}

function getCategoryIcon(categoryName: string): string {
  const icons: Record<string, string> = {
    profile: "user",
    ai: "brain",
    notifications: "bell",
    accessibility: "eye",
    privacy: "shield",
    defaults: "settings",
    security: "lock",
  };
  return icons[categoryName] || "settings";
}
