import { Button } from "@/components/ui/button";
import { Pause, Play, StopCircle, Trash2 } from "lucide-react";

interface AudioPreviewProps {
  audioUrl: string;
  isRecording?: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onPlay?: () => void;
  onRemove?: () => void;
}

const AudioPreview: React.FC<AudioPreviewProps> = ({
  audioUrl,
  isRecording = false,
  isPaused = false,
  onPause,
  onResume,
  onStop,
  onPlay,
  onRemove,
}) => {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {!isRecording && <audio src={audioUrl} controls className="w-full" />}
      <div className="flex gap-2">
        {isRecording ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={isPaused ? onResume : onPause}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-1" /> Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" /> Pause
                </>
              )}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onStop}>
              <StopCircle className="h-4 w-4 mr-1" /> Stop
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="sm" variant="ghost" onClick={onPlay}>
              <Play className="h-4 w-4 mr-1" /> Play
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
              <Trash2 className="h-4 w-4 mr-1" /> Remove
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioPreview;
