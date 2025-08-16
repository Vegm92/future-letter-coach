import { Letter, Milestone } from "./database";

// Dashboard component props
export interface DashboardProps {
  onCreateClick: () => void;
  onViewAllLetters: () => void;
  onViewLetter: (letter: Letter) => void;
}

// Create letter form props
export interface CreateLetterFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Edit letter form props
export interface EditLetterFormProps {
  letter: Letter;
  onClose: () => void;
  onSuccess: (letter: Letter) => void;
}

// Letter card props
export interface LetterCardProps {
  letter: Letter;
  onEdit: (letter: Letter) => void;
  onDelete?: (letter: Letter) => void;
  onView: (letter: Letter) => void;
  onPlay?: (url: string) => void;
  onTriggerDelivery?: (letter: Letter) => void;
  onStatusChange?: (letter: Letter, status: Letter["status"]) => void;
  onToggleLock?: (letter: Letter) => void;
}

// Letter detail props
export interface LetterDetailProps {
  letter: Letter;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (letter: Letter) => void;
  onUpdate: (letter: Letter) => void;
  onPlay?: (url: string) => void;
  onDelete?: (letter: Letter) => void;
}

// Letters view props
export interface LettersViewProps {
  onCreateClick: () => void;
  autoViewLetter?: Letter | null;
}

// Milestone manager props
export interface MilestoneManagerProps {
  letterId: string;
  milestones: Milestone[];
  onMilestoneUpdate: (milestone: Milestone) => void;
  onMilestoneDelete: (milestoneId: string) => void;
  onMilestoneAdd: (milestone: Omit<Milestone, "id" | "completed">) => void;
}

// Inline milestone suggestions props
export interface InlineMilestoneSuggestionsProps {
  letterId: string;
  goal: string;
  content?: string;
  sendDate: string;
  onMilestonesGenerated: (
    milestones: Omit<Milestone, "id" | "completed">[]
  ) => void;
}

// Suggested milestones props
export interface SuggestedMilestonesProps {
  letterId: string;
  goal: string;
  content?: string;
  sendDate: string;
  onMilestonesGenerated: (
    milestones: Omit<Milestone, "id" | "completed">[]
  ) => void;
}

// Vision vault props
export interface VisionVaultProps {
  onCreateClick: () => void;
  onViewLetter: (letter: Letter) => void;
}

// Settings layout props
export interface SettingsLayoutProps {
  children: React.ReactNode;
}

// Profile settings props
export interface ProfileSettingsProps {
  onSave: (data: Record<string, string>) => void;
  onCancel: () => void;
}

// AI preferences props
export interface AIPreferencesProps {
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

// Letter defaults props
export interface LetterDefaultsProps {
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

// Notification settings props
export interface NotificationSettingsProps {
  onSave: (data: Record<string, boolean>) => void;
  onCancel: () => void;
}

// Accessibility settings props
export interface AccessibilitySettingsProps {
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

// Security settings props
export interface SecuritySettingsProps {
  onSave: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

// Auth form props
export interface AuthFormProps {
  onBack: () => void;
}
