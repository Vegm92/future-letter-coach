import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mic, MicOff } from "lucide-react";
import type { VoiceMemoSectionProps } from "@/types/components";

export const VoiceMemoSection = ({
  isRecording,
  isLocked,
  hasVoiceMemo,
  onToggleRecording
}: VoiceMemoSectionProps) => {
  const buttonIcon = isRecording ? MicOff : Mic;
  const buttonText = isRecording ? "Stop Recording" : "Record Voice Memo";
  const IconComponent = buttonIcon;
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
          <IconComponent className="h-3 w-3 mr-1" />
          {buttonText}
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