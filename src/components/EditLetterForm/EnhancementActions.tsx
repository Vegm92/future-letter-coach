import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertCircle } from "lucide-react";

interface EnhancementActionsProps {
  state: 'idle' | 'loading' | 'success' | 'error';
  canEnhance: boolean;
  onEnhance: () => void;
  onRetry: () => void;
}

export const EnhancementActions = ({
  state,
  canEnhance,
  onEnhance,
  onRetry
}: EnhancementActionsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <Label className="text-base font-medium">AI Enhancement</Label>
          {state === 'success' && <Badge variant="secondary">Enhanced</Badge>}
        </div>
        <Button
          type="button"
          onClick={onEnhance}
          disabled={!canEnhance}
          variant="outline"
          size="sm"
        >
          {state === 'loading' ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Enhance with AI
            </>
          )}
        </Button>
      </div>

      {/* Enhancement Error */}
      {state === 'error' && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">Enhancement failed. Please try again.</p>
            </div>
            <Button onClick={onRetry} size="sm" variant="outline">
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};