import { useState, useCallback } from 'react';
import { useEnhanceLetterComplete } from './useEnhanceLetterComplete';
import { useToast } from '@/hooks/use-toast';

type EnhancementState = 'idle' | 'loading' | 'success' | 'error';
type FieldType = 'title' | 'goal' | 'content';

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
  onApplyField: (field: FieldType, value: string) => void;
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
  const [appliedFields, setAppliedFields] = useState<Set<FieldType>>(new Set());
  const [loadingFields, setLoadingFields] = useState<Set<FieldType>>(new Set());
  const [milestonesApplied, setMilestonesApplied] = useState(false);
  const [isApplyingMilestones, setIsApplyingMilestones] = useState(false);
  const [hasEnhancementData, setHasEnhancementData] = useState(false);
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
    setHasEnhancementData(true);
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
    setHasEnhancementData(false);
    setIsExpanded(false);
  }, [state]);

  const applyField = useCallback(async (field: FieldType) => {
    if (!enhancementData?.enhancedLetter) return;
    
    setLoadingFields(prev => new Set([...prev, field]));
    
    try {
      const value = enhancementData.enhancedLetter[field];
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief loading state
      onApplyField(field, value);
      
      setAppliedFields(prev => new Set([...prev, field]));
      
      toast({
        title: "✅ Enhancement Applied",
        description: `Updated ${field} with AI suggestion.`,
      });
    } catch (error) {
      toast({
        title: "Failed to Apply",
        description: `Could not apply ${field} enhancement.`,
        variant: "destructive"
      });
    } finally {
      setLoadingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(field);
        return newSet;
      });
    }
  }, [enhancementData, onApplyField, toast]);

  const applyMilestones = useCallback(async () => {
    if (!enhancementData?.suggestedMilestones?.length || !onApplyMilestones || milestonesApplied) return;
    
    setIsApplyingMilestones(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief loading state
      onApplyMilestones(enhancementData.suggestedMilestones);
      setMilestonesApplied(true);
      
      toast({
        title: "✅ Milestones Applied",
        description: `Added ${enhancementData.suggestedMilestones.length} suggested milestones.`,
      });
    } catch (error) {
      toast({
        title: "Failed to Apply Milestones",
        description: "Could not apply suggested milestones.",
        variant: "destructive"
      });
    } finally {
      setIsApplyingMilestones(false);
    }
  }, [enhancementData, onApplyMilestones, toast, milestonesApplied]);

  const applyAllRemaining = useCallback(async () => {
    if (!enhancementData?.enhancedLetter) return;
    
    const fieldsToApply: FieldType[] = (['title', 'goal', 'content'] as FieldType[])
      .filter(field => !appliedFields.has(field) && enhancementData.enhancedLetter[field] !== '');
    
    if (fieldsToApply.length === 0 && (milestonesApplied || !enhancementData.suggestedMilestones?.length)) {
      toast({
        title: "Nothing to Apply",
        description: "All enhancements have already been applied.",
      });
      return;
    }

    // Apply remaining fields
    for (const field of fieldsToApply) {
      await applyField(field);
    }
    
    // Apply milestones if not applied yet
    if (!milestonesApplied && enhancementData.suggestedMilestones?.length && onApplyMilestones) {
      await applyMilestones();
    }
    
    toast({
      title: "✅ All Enhancements Applied",
      description: "Your letter has been updated with all remaining AI suggestions.",
    });
  }, [enhancementData, onApplyField, onApplyMilestones, toast, appliedFields, milestonesApplied, applyField, applyMilestones]);

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
    applyMilestones,
    applyAllRemaining,
    retry,
    canEnhance: Boolean(goal?.trim()) && state !== 'loading',
    appliedFields,
    loadingFields,
    milestonesApplied,
    isApplyingMilestones,
    hasEnhancementData
  };
};