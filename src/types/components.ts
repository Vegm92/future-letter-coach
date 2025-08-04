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