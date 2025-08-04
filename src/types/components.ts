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