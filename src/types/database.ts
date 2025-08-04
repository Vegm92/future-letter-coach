// Core database entity types

export interface Letter {
  id: string;
  user_id: string;
  title: string;
  content: string;
  goal: string;
  send_date: string;
  status: 'draft' | 'scheduled' | 'sent' | 'archived';
  ai_enhanced_goal?: string;
  ai_enhanced?: boolean;
  voice_memo_url?: string;
  is_locked: boolean;
  created_at: string;
  personal_comments?: string;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  percentage: number;
  completed: boolean;
  target_date: string;
}

// Form-specific variations
export type CreateMilestone = Omit<Milestone, 'id' | 'completed'>;
export type SuggestedMilestone = Omit<Milestone, 'id' | 'completed'>;

// Cached item wrapper
export interface CachedItem<T> {
  data: T;
  timestamp: number;
  expirationHours: number;
}