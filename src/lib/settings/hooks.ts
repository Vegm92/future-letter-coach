import { useState, useCallback } from 'react';
import { createLocalChangeTracker } from './utils';

// Generic hook for managing local form changes with auto-save capability
export const useSettingsForm = <T>(
  initialData: T,
  onSave: (data: Partial<T>) => Promise<void>,
  autoSaveDelay = 2000
) => {
  const [localChanges, setLocalChanges] = useState<Partial<T>>({});
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const tracker = createLocalChangeTracker<T>();

  const updateField = useCallback((field: keyof T, value: any) => {
    setLocalChanges(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new auto-save timeout
    const timeout = setTimeout(async () => {
      const updatedChanges = { ...localChanges, [field]: value };
      if (tracker.hasChanges(updatedChanges as T)) {
        setSaving(true);
        try {
          await onSave(updatedChanges);
          setLocalChanges({});
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setSaving(false);
        }
      }
    }, autoSaveDelay);

    setAutoSaveTimeout(timeout);
  }, [localChanges, autoSaveTimeout, onSave, autoSaveDelay, tracker]);

  const updateMultipleFields = useCallback((updates: Partial<T>) => {
    setLocalChanges(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const manualSave = useCallback(async () => {
    if (!tracker.hasChanges(localChanges as T) || saving) return;

    setSaving(true);
    try {
      await onSave(localChanges);
      setLocalChanges({});
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [localChanges, saving, onSave, tracker]);

  const resetChanges = useCallback(() => {
    setLocalChanges({});
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      setAutoSaveTimeout(null);
    }
  }, [autoSaveTimeout]);

  const getDisplayValue = useCallback((field: keyof T, defaultValue: any = '') => {
    return tracker.getDisplayValue(field, localChanges, initialData, defaultValue);
  }, [localChanges, initialData, tracker]);

  return {
    localChanges,
    saving,
    hasChanges: tracker.hasChanges(localChanges as T),
    canSave: tracker.canSave(localChanges as T, saving),
    updateField,
    updateMultipleFields,
    manualSave,
    resetChanges,
    getDisplayValue,
  };
};

// Hook for managing nested object updates (like preferences)
export const useNestedSettingsForm = <T extends Record<string, any>>(
  initialData: T,
  onSave: (data: Partial<T>) => Promise<void>,
  nestedKey: keyof T
) => {
  const [localChanges, setLocalChanges] = useState<Partial<T>>({});
  const [saving, setSaving] = useState(false);

  const currentNested = {
    ...initialData[nestedKey],
    ...localChanges[nestedKey]
  };

  const updateNestedField = useCallback((field: string, value: any) => {
    setLocalChanges(prev => ({
      ...prev,
      [nestedKey]: {
        ...currentNested,
        [field]: value
      }
    }));
  }, [currentNested, nestedKey]);

  const saveChanges = useCallback(async () => {
    if (Object.keys(localChanges).length === 0 || saving) return;

    setSaving(true);
    try {
      await onSave(localChanges);
      setLocalChanges({});
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [localChanges, saving, onSave]);

  return {
    currentNested,
    localChanges,
    saving,
    hasChanges: Object.keys(localChanges).length > 0,
    updateNestedField,
    saveChanges,
    resetChanges: () => setLocalChanges({}),
  };
};