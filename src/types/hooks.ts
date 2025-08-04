import type { FieldType } from '@/lib/constants';
import type { EnhancementData, EnhancementService, NotificationService } from './services';
import type { CachedItem } from './database';
import type { ErrorHandler } from '@/utils/errorHandler';
import type { CacheManager } from '@/utils/cacheManager';
import type { ToastProps, ToastActionElement } from '@/components/ui/toast';

// Smart enhancement hook types
export interface UseSmartEnhancementProps {
  title: string;
  goal: string;
  content: string;
  send_date: string;
  onApplyField: (field: FieldType, value: string) => void;
  onApplyMilestones?: (milestones: any[]) => void;
}

export interface EnhancementState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: EnhancementData | null;
  showSuggestions: boolean;
  isExpanded: boolean;
  appliedFields: Set<FieldType>;
  loadingFields: Set<FieldType>;
  milestonesApplied: boolean;
  isApplyingMilestones: boolean;
  lastInputHash: string | null;
  isUsingCache: boolean;
}

export interface UseSmartEnhancementDeps {
  enhancementService?: EnhancementService;
  notificationService?: NotificationService;
  errorHandler?: ErrorHandler;
  cacheManager?: CacheManager<EnhancementData>;
}

// Toast hook types (moved from src/hooks/use-toast.ts)

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

export type ActionType = typeof actionTypes;

export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

export type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

export interface State {
  toasts: ToasterToast[];
}