import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertCircle } from "lucide-react";
import type { EnhancementActionsProps } from "@/types/components";

export const EnhancementActions = ({
  state,
  canEnhance,
  onEnhance,
  onRetry
}: EnhancementActionsProps) => {
  const isLoading = state === 'loading';
  const isSuccess = state === 'success';
  const isError = state === 'error';
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <Label className="text-base font-medium">AI Enhancement</Label>
          {isSuccess && <Badge variant="secondary">Enhanced</Badge>}
        </div>
        <Button
          type="button"
          onClick={onEnhance}
          disabled={!canEnhance}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
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

      {isError && (
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