/**
 * MILESTONES MANAGEMENT HOOK
 * 
 * Handles CRUD operations for milestones associated with letters.
 * Integrated with React Query for optimistic updates and caching.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUser } from '../lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { Milestone, CreateMilestoneData, UseMilestonesReturn } from '../lib/types';

const LETTERS_QUERY_KEY = 'letters';

interface CreateMilestoneWithLetterData extends CreateMilestoneData {
  letterId: string;
}

export function useMilestones(): UseMilestonesReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation: Create milestone
  const createMilestonesMutation = useMutation({
    mutationFn: async (milestones: CreateMilestoneWithLetterData[]): Promise<Milestone[]> => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      if (milestones.length === 0) return [];

      const { data, error } = await supabase
        .from('milestones')
        .insert(
          milestones.map(milestone => ({
            title: milestone.title,
            description: milestone.description,
            percentage: milestone.percentage,
            target_date: milestone.target_date,
            letter_id: milestone.letterId,
            completed: false,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (newMilestones) => {
      // Invalidate letters query to refresh milestones
      queryClient.invalidateQueries({ queryKey: [LETTERS_QUERY_KEY] });
      
      if (newMilestones.length > 0) {
        toast({
          title: 'Milestones saved',
          description: `${newMilestones.length} milestone${newMilestones.length !== 1 ? 's' : ''} created successfully.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to save milestones',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Update milestones (delete old ones and create new ones)
  const updateMilestonesMutation = useMutation({
    mutationFn: async ({ letterId, milestones }: { letterId: string; milestones: CreateMilestoneWithLetterData[] }): Promise<Milestone[]> => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      // First delete existing milestones for this letter
      const { error: deleteError } = await supabase
        .from('milestones')
        .delete()
        .eq('letter_id', letterId);

      if (deleteError) throw deleteError;

      if (milestones.length === 0) return [];

      // Then create new milestones
      const { data, error } = await supabase
        .from('milestones')
        .insert(
          milestones.map(milestone => ({
            title: milestone.title,
            description: milestone.description,
            percentage: milestone.percentage,
            target_date: milestone.target_date,
            letter_id: milestone.letterId,
            completed: false,
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedMilestones, { letterId }) => {
      // Invalidate letters query to refresh milestones
      queryClient.invalidateQueries({ queryKey: [LETTERS_QUERY_KEY] });
      
      toast({
        title: 'Milestones updated',
        description: `${updatedMilestones.length} milestone${updatedMilestones.length !== 1 ? 's' : ''} saved successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update milestones',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper functions
  const createMilestones = async (milestones: CreateMilestoneWithLetterData[]): Promise<Milestone[]> => {
    return createMilestonesMutation.mutateAsync(milestones);
  };

  const updateMilestones = async (letterId: string, milestones: CreateMilestoneWithLetterData[]): Promise<Milestone[]> => {
    return updateMilestonesMutation.mutateAsync({ letterId, milestones });
  };

  // Individual milestone operations (to match the interface)
  const createMilestone = async (data: CreateMilestoneData & { letterId: string }): Promise<Milestone> => {
    const result = await createMilestones([data]);
    return result[0];
  };

  const updateMilestone = async (id: string, data: Partial<CreateMilestoneData>): Promise<Milestone> => {
    // This is a simplified implementation - in reality you'd need to implement single milestone update
    throw new Error('Individual milestone update not yet implemented');
  };

  const deleteMilestone = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  };

  return {
    // Interface-compatible methods
    milestones: [], // This hook doesn't fetch milestones - they come via letters
    isLoading: createMilestonesMutation.isPending || updateMilestonesMutation.isPending || false,
    error: createMilestonesMutation.error?.message || updateMilestonesMutation.error?.message,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    
    // Additional methods for batch operations
    createMilestones,
    updateMilestones,
  };
}
