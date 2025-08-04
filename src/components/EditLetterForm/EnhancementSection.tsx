import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { EnhancedField } from "./EnhancedField";
import { MilestoneSuggestionList } from "./MilestoneSuggestionList";
import { EnhancementActions } from "./EnhancementActions";
import type { EnhancementSectionProps } from "@/types/components";

export const EnhancementSection = ({ enhancement, canEnhance }: EnhancementSectionProps) => {
  if (!canEnhance) return null;

  const hasEnhancementData = enhancement.hasEnhancementData && enhancement.data;
  const allFieldsApplied = enhancement.appliedFields.size === 3;
  const noMilestones = !enhancement.data?.suggestedMilestones?.length;
  const allApplied = allFieldsApplied && (noMilestones || enhancement.milestonesApplied);

  return (
    <div className="space-y-4">
      <EnhancementActions
        state={enhancement.state}
        canEnhance={enhancement.canEnhance}
        onEnhance={enhancement.enhance}
        onRetry={enhancement.retry}
      />
      
      {hasEnhancementData && (
        <Collapsible open={enhancement.isExpanded} onOpenChange={enhancement.setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
              <span className="text-sm font-medium">✨ View Enhanced Content</span>
              {enhancement.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="space-y-4 rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-sm">AI Suggestions</h4>
                <Button
                  onClick={enhancement.applyAllRemaining}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  disabled={allApplied}
                >
                  {allApplied ? "All Applied" : "Apply All Remaining"}
                </Button>
              </div>
              
              <EnhancedField
                label="Enhanced Title"
                value={enhancement.data.enhancedLetter.title}
                fieldKey="title"
                isApplied={enhancement.appliedFields.has('title')}
                isLoading={enhancement.loadingFields.has('title')}
                onApply={() => enhancement.applyField('title')}
              />

              <EnhancedField
                label="Enhanced Goal"
                value={enhancement.data.enhancedLetter.goal}
                fieldKey="goal"
                isApplied={enhancement.appliedFields.has('goal')}
                isLoading={enhancement.loadingFields.has('goal')}
                onApply={() => enhancement.applyField('goal')}
              />

              <EnhancedField
                label="Enhanced Content"
                value={enhancement.data.enhancedLetter.content}
                fieldKey="content"
                isApplied={enhancement.appliedFields.has('content')}
                isLoading={enhancement.loadingFields.has('content')}
                onApply={() => enhancement.applyField('content')}
                className="max-h-32 overflow-y-auto"
              />

              <MilestoneSuggestionList
                milestones={enhancement.data.suggestedMilestones || []}
                isApplied={enhancement.milestonesApplied}
                isApplying={enhancement.isApplyingMilestones}
                onApply={enhancement.applyMilestones}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};