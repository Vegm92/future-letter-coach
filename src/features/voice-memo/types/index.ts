// Voice memo feature types

export interface VoiceMemo {
  id: string;
  letter_id: string;
  audio_url: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

export interface AudioPreviewProps {
  audioUrl: string;
  isRecording?: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onPlay?: () => void;
  onRemove?: () => void;
}

export interface VoiceMemoSectionProps {
  isRecording: boolean;
  isLocked: boolean;
  hasVoiceMemo: boolean;
  onToggleRecording: () => void;
}
