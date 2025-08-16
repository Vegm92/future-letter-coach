import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";
import type { MilestoneSuggestionListProps } from "@/types/components";

export const MilestoneSuggestionList = ({
  milestones,
  isApplied,
  isApplying,
  onApply
}: MilestoneSuggestionListProps) => {
  if (!milestones?.length) return null;

  const buttonText = isApplying ? 'Applying...' : isApplied ? 'Applied' : 'Apply Milestones';
  const isDisabled = isApplied || isApplying;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          Suggested Milestones ({milestones.length})
          {isApplied && <Check className="h-3 w-3 text-green-500" />}
        </Label>
        <Button
          onClick={onApply}
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
          disabled={isDisabled}
        >
          {isApplying && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {isApplied && <Check className="h-3 w-3 mr-1" />}
          {buttonText}
        </Button>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {milestones.map((milestone, index) => (
          <div key={index} className="text-xs bg-background p-2 rounded border">
            <div className="font-medium">{milestone.title}</div>
            <div className="text-muted-foreground">{milestone.description}</div>
            <div className="text-muted-foreground">
              Target: {new Date(milestone.target_date).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};