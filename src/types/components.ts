import type { Letter, Milestone, SuggestedMilestone } from './database';

// Form component props
export interface CreateLetterFormProps {
  onClose: () => void;
  onSuccess: (letterData?: any) => void;
}

export interface EditLetterFormProps {
  letter: Letter;
  onClose: () => void;
  onSuccess: (updatedLetter: Letter) => void;
}

// Card component props
export interface LetterCardProps {
  letter: Letter;
  onEdit: (letter: Letter) => void;
  onPlay?: (url: string) => void;
  onView: (letter: Letter) => void;
  onTriggerDelivery?: (letter: Letter) => void;
  onStatusChange?: (letter: Letter, newStatus: string) => void;
  onDelete?: (letter: Letter) => void;
}

// Milestone component props
export interface SuggestedMilestonesProps {
  isOpen: boolean;
  onClose: () => void;
  letterId: string;
  suggestedMilestones: SuggestedMilestone[];
  onMilestonesAdded: () => void;
}

export interface MilestoneState extends SuggestedMilestone {
  selected: boolean;
  editing: boolean;
}

// Additional component props extracted from individual files
export interface AppSidebarProps {
  user: any;
  onCreateClick: () => void;
}

export interface AuthFormProps {
  onBack: () => void;
}

export interface DashboardProps {
  onCreateClick: () => void;
  onViewAllLetters: () => void;
  onViewLetter: (letter: Letter) => void;
}

export interface HeaderProps {
  user: any;
  onCreateClick: () => void;
}

export interface HeroSectionProps {
  onGetStarted: () => void;
}

export interface LettersViewProps {
  onCreateClick: () => void;
  refreshTrigger?: number;
}

export interface VisionVaultProps {
  onCreateClick: () => void;
}

// Component prop interfaces from component summaries
export interface InlineMilestoneSuggestionsProps {
  letterId: string;
  suggestedMilestones: SuggestedMilestone[];
  onMilestonesAdded: () => void;
  onClose: () => void;
}

export interface MilestoneManagerProps {
  letterId: string;
  milestones: Milestone[];
  onUpdate: (milestones: Milestone[]) => void;
  letter?: {
    title: string;
    goal: string;
    content: string;
    send_date: string;
  };
}

export interface LetterDetailProps {
  letter: Letter;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (letter: Letter) => void;
  onUpdate: (updatedLetter: Letter) => void;
  onPlay?: (url: string) => void;
  onDelete?: (letter: Letter) => void;
}

// EditLetterForm sub-component interfaces
export interface EnhancedFieldProps {
  label: string;
  value: string;
  fieldKey: string;
  isApplied: boolean;
  isLoading: boolean;
  onApply: () => void;
  className?: string;
}

export interface MilestoneSuggestionListProps {
  milestones: SuggestedMilestone[];
  isApplied: boolean;
  isApplying: boolean;
  onApply: () => void;
}

export interface EnhancementActionsProps {
  state: 'idle' | 'loading' | 'success' | 'error';
  canEnhance: boolean;
  onEnhance: () => void;
  onRetry: () => void;
}

export interface VoiceMemoSectionProps {
  isRecording: boolean;
  isLocked: boolean;
  hasVoiceMemo: boolean;
  onToggleRecording: () => void;
}

export interface FormFieldProps {
  id: string;
  label: string;
  type?: 'input' | 'textarea' | 'date';
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  rows?: number;
  min?: string;
  helpText?: string;
}

export interface EnhancementSectionProps {
  enhancement: ReturnType<typeof import('@/hooks/useSmartEnhancement').useSmartEnhancement>;
  canEnhance: boolean;
}