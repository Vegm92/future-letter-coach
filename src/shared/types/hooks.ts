import { Letter, Milestone } from './database';

// Profile hook types
export interface ProfileData {
  id: string;
  user_id: string;
  email?: string;
  full_name?: string;
  timezone?: string;
  notification_preferences?: {
    email: boolean;
    push: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  full_name?: string;
  timezone?: string;
  notification_preferences?: {
    email: boolean;
    push: boolean;
  };
}

// Smart enhancement hook types
export interface EnhancementState {
  isEnhancing: boolean;
  enhancedFields: {
    title: string;
    goal: string;
    content: string;
  };
  suggestedMilestones: Array<{
    title: string;
    percentage: number;
    target_date: string;
    description: string;
  }>;
  appliedFields: Set<string>;
  appliedMilestones: boolean;
  error: string | null;
}

export interface EnhancementActions {
  enhanceLetter: () => Promise<void>;
  applyField: (field: keyof EnhancementState['enhancedFields'], value: string) => void;
  applyMilestones: (milestones: EnhancementState['suggestedMilestones']) => void;
  resetEnhancement: () => void;
}

// Voice memo recorder hook types
export interface VoiceMemoState {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  duration: number;
  error: string | null;
}

export interface VoiceMemoActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
}

// Mobile hook types
export interface MobileState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: {
    width: number;
    height: number;
  };
}

// Toast hook types
export interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Settings hook types
export interface SettingsData {
  [key: string]: unknown;
}

export interface SettingsActions {
  getSetting: <T>(key: string, defaultValue: T) => T;
  setSetting: <T>(key: string, value: T) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (data: string) => boolean;
}
