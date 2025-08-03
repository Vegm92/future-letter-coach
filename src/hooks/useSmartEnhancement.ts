import { useState, useCallback } from 'react';
import { useEnhanceLetterComplete } from './useEnhanceLetterComplete';
import { useToast } from '@/hooks/use-toast';

type EnhancementState = 'idle' | 'loading' | 'success' | 'error';

interface EnhancementData {
  enhancedLetter: {
    title: string;
    goal: string;
    content: string;
  };
  suggestedMilestones: Array<{
    title: string;
    percentage: number;
    target_date: string;
    description: string;
  }>;
}

interface UseSmartEnhancementProps {
  title: string;
  goal: string;
  content: string;
  send_date: string;
  onApplyField: (field: 'title' | 'goal' | 'content', value: string) => void;
  onApplyMilestones?: (milestones: any[]) => void;
}

export const useSmartEnhancement = ({
  title,
  goal,
  content,
  send_date,
  onApplyField,
  onApplyMilestones
}: UseSmartEnhancementProps) => {
  const [state, setState] = useState<EnhancementState>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const {
    data: enhancementData,
    isLoading,
    isSuccess,
    isError,
    refetch
  } = useEnhanceLetterComplete({
    title,
    goal,
    content,
    send_date,
    enabled: state === 'loading'
  });

  // Update state based on query status
  if (isLoading && state !== 'loading') {
    setState('loading');
  } else if (isSuccess && state !== 'success') {
    setState('success');
    setIsExpanded(true);
    toast({
      title: "✨ Letter Enhanced!",
      description: "Your letter has been enhanced with AI. Review the suggestions below.",
    });
  } else if (isError && state !== 'error') {
    setState('error');
    toast({
      title: "Enhancement Failed",
      description: "Unable to enhance your letter. Please try again.",
      variant: "destructive"
    });
  }

  const enhance = useCallback(() => {
    if (state === 'loading') return;
    setState('loading');
    setIsExpanded(false);
  }, [state]);

  const applyField = useCallback((field: 'title' | 'goal' | 'content') => {
    if (!enhancementData?.enhancedLetter) return;
    const value = enhancementData.enhancedLetter[field];
    onApplyField(field, value);
    toast({
      title: "Applied Enhancement",
      description: `Updated ${field} with AI suggestion.`,
    });
  }, [enhancementData, onApplyField, toast]);

  const applyAll = useCallback(() => {
    if (!enhancementData?.enhancedLetter) return;
    
    onApplyField('title', enhancementData.enhancedLetter.title);
    onApplyField('goal', enhancementData.enhancedLetter.goal);
    onApplyField('content', enhancementData.enhancedLetter.content);
    
    if (onApplyMilestones && enhancementData.suggestedMilestones?.length > 0) {
      onApplyMilestones(enhancementData.suggestedMilestones);
    }
    
    toast({
      title: "All Enhancements Applied",
      description: "Your letter has been updated with all AI suggestions.",
    });
  }, [enhancementData, onApplyField, onApplyMilestones, toast]);

  const retry = useCallback(() => {
    setState('idle');
    enhance();
  }, [enhance]);

  return {
    state,
    data: enhancementData,
    isExpanded,
    setIsExpanded,
    enhance,
    applyField,
    applyAll,
    retry,
    canEnhance: Boolean(goal?.trim()) && state !== 'loading'
  };
};