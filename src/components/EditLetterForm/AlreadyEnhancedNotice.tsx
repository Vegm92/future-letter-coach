import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export const AlreadyEnhancedNotice = () => {
  return (
    <div className="p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-medium">AI Enhancement</span>
        <Badge variant="secondary">Already Enhanced</Badge>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        This letter has been enhanced with AI. Each letter can only be enhanced once to maintain authenticity.
      </p>
    </div>
  );
};