/**
 * SINGLE SOURCE OF TRUTH FOR ALL TYPES
 * 
 * This file consolidates all types from the previous scattered type system.
 * No more hunting through multiple files for type definitions!
 */

// ============================================================================
// DATABASE ENTITIES - Direct mapping to Supabase tables
// ============================================================================

export interface Letter {
  id: string;
  user_id: string;
  title: string;
  content: string;
  goal: string;
  send_date: string;
  status: 'draft' | 'scheduled' | 'sent' | 'archived';
  created_at: string;
  updated_at: string;
  
  // AI Enhancement fields
  ai_enhanced: boolean;
  ai_enhanced_title?: string;
  ai_enhanced_goal?: string;
  ai_enhanced_content?: string;
  
  // Additional features
  voice_memo_url?: string;
  personal_comments?: string;
  is_locked: boolean;
  
  // Related data (populated by joins)
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  letter_id: string;
  title: string;
  description?: string;
  percentage: number;
  target_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FORM DATA TYPES - For creating and updating entities
// ============================================================================

export interface CreateLetterData {
  title: string;
  content: string;
  goal: string;
  send_date: string;
  voice_memo_url?: string;
}

export interface CreateMilestoneData {
  title: string;
  description?: string;
  percentage: number;
  target_date: string;
}

export interface UpdateLetterData {
  title?: string;
  content?: string;
  goal?: string;
  send_date?: string;
  status?: Letter['status'];
  personal_comments?: string;
  ai_enhanced_title?: string;
  ai_enhanced_goal?: string;
  ai_enhanced_content?: string;
}

// ============================================================================
// AI ENHANCEMENT TYPES
// ============================================================================

// Legacy bulk enhancement (keeping for backward compatibility)
export interface EnhancementRequest {
  title: string;
  goal: string;
  content: string;
  send_date: string;
}

export interface EnhancementResponse {
  enhancedTitle: string;
  enhancedGoal: string;
  enhancedContent: string;
  suggestedMilestones: SuggestedMilestone[];
}

// New progressive enhancement types
export interface FieldEnhancementRequest {
  field: 'title' | 'goal' | 'content';
  value: string;
  context?: {
    title?: string;
    goal?: string;
    content?: string;
  };
}

export interface FieldEnhancementResponse {
  suggestion: string;
  explanation: string;
}

export interface MilestoneInferenceRequest {
  goal: string;
  content: string;
  title?: string;
}

export interface MilestoneInferenceResponse {
  suggestedMilestones: InferredMilestone[];
}

export interface InferredMilestone {
  text: string;
  reasoning: string;
  dueDate?: string;
}

export interface SuggestedMilestone {
  title: string;
  description: string;
  percentage: number;
  target_date: string;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface LetterCardProps {
  letter: Letter;
  onView: (letter: Letter) => void;
  onEdit: (letter: Letter) => void;
  onDelete: (letter: Letter) => void;
  onStatusChange: (letter: Letter, status: Letter['status']) => void;
}

export interface LetterFormProps {
  letter?: Letter; // undefined for create, defined for edit
  onClose: () => void;
  onSuccess: (letter: Letter) => void;
}

export interface MilestoneListProps {
  milestones: Milestone[];
  onUpdate: (milestones: Milestone[]) => void;
  letterId: string;
}

export interface LetterDetailProps {
  letter: Letter;
  onEdit: (letter: Letter) => void;
  onDelete: (letter: Letter) => void;
  onUpdateComments: (letter: Letter, comments: string) => Promise<void>;
}

export interface HeaderProps {
  user?: any;
  onCreateClick?: () => void;
}

export interface LayoutProps {
  children: React.ReactNode;
}

export interface FieldEnhancerProps {
  field: 'title' | 'goal' | 'content';
  value: string;
  onApply: (enhancedValue: string) => void;
  context?: {
    title?: string;
    goal?: string;
    content?: string;
  };
  placeholder?: string;
}

export interface MilestoneManagerProps {
  goal: string;
  content: string;
  title?: string;
  initialMilestones?: MilestoneUIData[];
  onChange: (milestones: MilestoneUIData[]) => void;
}

export interface MilestoneUIData {
  id: string;
  text: string;
  dueDate: string;
  isInferred?: boolean;
  reasoning?: string;
}

// ============================================================================
// MODAL & UI STATE TYPES
// ============================================================================

export interface ModalState {
  isOpen: boolean;
  type: 'letter-form' | 'letter-detail' | 'delete-confirm' | null;
  data?: any;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  totalPages: number;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseLettersReturn {
  letters: Letter[];
  isLoading: boolean;
  error?: string;
  createLetter: (data: CreateLetterData) => Promise<Letter>;
  updateLetter: (id: string, data: UpdateLetterData) => Promise<Letter>;
  deleteLetter: (id: string) => Promise<void>;
  refetch: () => void;
}

export interface UseMilestonesReturn {
  milestones: Milestone[];
  isLoading: boolean;
  error?: string;
  createMilestone: (data: CreateMilestoneData & { letterId: string }) => Promise<Milestone>;
  updateMilestone: (id: string, data: Partial<CreateMilestoneData>) => Promise<Milestone>;
  deleteMilestone: (id: string) => Promise<void>;
}

export interface UseEnhancementReturn {
  enhanceField: (data: FieldEnhancementRequest) => Promise<FieldEnhancementResponse>;
  inferMilestones: (data: MilestoneInferenceRequest) => Promise<MilestoneInferenceResponse>;
  isEnhancingField: boolean;
  isInferringMilestones: boolean;
  isLoading: boolean;
  error?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type LetterStatus = Letter['status'];

export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: keyof Letter;
  direction: SortDirection;
}

export interface FilterOptions {
  status?: LetterStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}
