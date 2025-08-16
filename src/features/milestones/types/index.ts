import type { Milestone } from '@/shared/types';

// Extended milestone types for the feature
export interface MilestoneState extends Milestone {
  selected?: boolean;
  editing?: boolean;
}

export interface SuggestedMilestone {
  title: string;
  description: string;
  percentage: number;
  target_date: string;
}

export interface MilestoneSuggestionListProps {
  milestones: SuggestedMilestone[];
  isApplied: boolean;
  isApplying: boolean;
  onApply: () => void;
}

export interface CreateMilestoneRequest {
  letter_id: string;
  title: string;
  percentage: number;
  target_date: string;
  description?: string;
}

export interface UpdateMilestoneRequest {
  id: string;
  title?: string;
  percentage?: number;
  target_date?: string;
  description?: string;
  completed?: boolean;
}
