import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";

interface EnhancedFieldProps {
  label: string;
  value: string;
  fieldKey: string;
  isApplied: boolean;
  isLoading: boolean;
  onApply: () => void;
  className?: string;
}

export const EnhancedField = ({ 
  label, 
  value, 
  fieldKey, 
  isApplied, 
  isLoading, 
  onApply,
  className = ""
}: EnhancedFieldProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          {label}
          {isApplied && <Check className="h-3 w-3 text-green-500" />}
        </Label>
        <Button
          onClick={onApply}
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
          disabled={isApplied || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Applying...
            </>
          ) : isApplied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Applied
            </>
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      <div className={`text-sm bg-background p-2 rounded border ${className}`}>
        {value}
      </div>
    </div>
  );
};