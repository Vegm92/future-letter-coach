import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mic, MicOff } from "lucide-react";

interface VoiceMemoSectionProps {
  isRecording: boolean;
  isLocked: boolean;
  hasVoiceMemo: boolean;
  onToggleRecording: () => void;
}

export const VoiceMemoSection = ({
  isRecording,
  isLocked,
  hasVoiceMemo,
  onToggleRecording
}: VoiceMemoSectionProps) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>Voice Memo (Optional)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggleRecording}
          disabled={isLocked}
          className="h-8 px-2"
        >
          {isRecording ? (
            <>
              <MicOff className="h-3 w-3 mr-1" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-3 w-3 mr-1" />
              Record Voice Memo
            </>
          )}
        </Button>
      </div>
      {hasVoiceMemo && (
        <p className="text-xs text-muted-foreground mt-1">
          Voice memo attached to this letter
        </p>
      )}
    </div>
  );
};