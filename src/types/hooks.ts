import type { FieldType } from '@/lib/constants';
import type { EnhancementData, EnhancementService, NotificationService } from './services';
import type { CachedItem } from './database';
import type { ErrorHandler } from '@/utils/errorHandler';
import type { CacheManager } from '@/utils/cacheManager';

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

// Toast hook types
export type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export type ActionType = {
  type: "ADD_TOAST";
  toast: ToasterToast;
} | {
  type: "UPDATE_TOAST";
  toast: Partial<ToasterToast>;
} | {
  type: "DISMISS_TOAST";
  toastId?: ToasterToast["id"];
} | {
  type: "REMOVE_TOAST";
  toastId?: ToasterToast["id"];
};

export interface State {
  toasts: ToasterToast[];
}