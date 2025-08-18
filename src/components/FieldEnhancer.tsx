import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle, X } from 'lucide-react';
import { useEnhancement } from '../hooks/useEnhancement';
import type { FieldEnhancerProps } from '../lib/types';

function FieldEnhancerComponent({ field, value, onApply, context, placeholder }: FieldEnhancerProps) {
  const { enhanceField, isEnhancingField } = useEnhancement();
  const [suggestion, setSuggestion] = useState<{ suggestion: string; explanation: string } | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const shouldShowEnhanceButton = () => {
    return value.trim().length > 0;
  };

  const handleGetSuggestion = async () => {
    if (!value.trim()) return;

    try {
      const response = await enhanceField({
        field,
        value,
        context,
      });
      
      setSuggestion(response);
      setShowSuggestion(true);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApply(suggestion.suggestion);
      setSuggestion(null);
      setShowSuggestion(false);
    }
  };

  const handleDismiss = () => {
    setSuggestion(null);
    setShowSuggestion(false);
  };

  if (!shouldShowEnhanceButton() && !showSuggestion) {
    return null;
  }

  return (
    <div className="mt-2">
      {shouldShowEnhanceButton() && !showSuggestion && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleGetSuggestion}
            disabled={isEnhancingField}
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
          >
            {isEnhancingField ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                Enhance
              </>
            )}
          </Button>
        </div>
      )}

      {showSuggestion && suggestion && (
        <Card className="mt-2 border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-emerald-900 text-sm">AI Suggestion</span>
                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                    {field}
                  </Badge>
                </div>
                <p className="text-xs text-emerald-700 mb-3">
                  {suggestion.explanation}
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded border border-emerald-200 mb-3">
              <p className={`text-sm text-gray-800 ${field === 'content' ? 'whitespace-pre-wrap' : ''}`}>
                {suggestion.suggestion}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-emerald-600">
                This will replace your current {field}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-gray-600 hover:text-gray-800"
                >
                  <X className="h-3 w-3 mr-1" />
                  Not now
                </Button>
                <Button
                  type="button"
                  onClick={handleApply}
                  size="sm"
                  className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Use this
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const FieldEnhancer = memo(FieldEnhancerComponent, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value && 
    prevProps.field === nextProps.field &&
    JSON.stringify(prevProps.context) === JSON.stringify(nextProps.context)
  );
});

FieldEnhancer.displayName = 'FieldEnhancer';
