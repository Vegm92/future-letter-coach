/**
 * SIMPLIFIED LETTERS HOOK
 * 
 * Direct React Query + Supabase integration.
 * No service layers, no repositories, no complexity.
 * Just clean, simple data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getCurrentUser } from '../lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { Letter, CreateLetterData, UpdateLetterData, UseLettersReturn } from '../lib/types';

const LETTERS_QUERY_KEY = 'letters';

export function useLetters(): UseLettersReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query: Fetch all letters for current user
  const { data: letters = [], isLoading, error, refetch } = useQuery({
    queryKey: [LETTERS_QUERY_KEY],
    queryFn: async (): Promise<Letter[]> => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('letters')
        .select(`
          *,
          milestones (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Mutation: Create new letter
  const createLetterMutation = useMutation({
    mutationFn: async (data: CreateLetterData): Promise<Letter> => {
      const user = await getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const { data: letter, error } = await supabase
        .from('letters')
        .insert({
          ...data,
          user_id: user.id,
          status: 'draft' as const,
          ai_enhanced: false,
          is_locked: false,
        })
        .select(`
          *,
          milestones (*)
        `)
        .single();

      if (error) throw error;
      return letter;
    },
    onSuccess: (newLetter) => {
      // Update cache with new letter
      queryClient.setQueryData<Letter[]>([LETTERS_QUERY_KEY], (old = []) => [
        newLetter,
        ...old,
      ]);
      
      toast({
        title: 'Letter created',
        description: 'Your letter has been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create letter',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Update existing letter
  const updateLetterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLetterData }): Promise<Letter> => {
      const { data: letter, error } = await supabase
        .from('letters')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          milestones (*)
        `)
        .single();

      if (error) throw error;
      return letter;
    },
    onSuccess: (updatedLetter) => {
      // Update cache with updated letter
      queryClient.setQueryData<Letter[]>([LETTERS_QUERY_KEY], (old = []) =>
        old.map((letter) => 
          letter.id === updatedLetter.id ? updatedLetter : letter
        )
      );
      
      toast({
        title: 'Letter updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update letter',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation: Delete letter
  const deleteLetterMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('letters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData<Letter[]>([LETTERS_QUERY_KEY], (old = []) =>
        old.filter((letter) => letter.id !== deletedId)
      );
      
      toast({
        title: 'Letter deleted',
        description: 'The letter has been permanently removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete letter',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Helper functions that use the mutations
  const createLetter = async (data: CreateLetterData): Promise<Letter> => {
    return createLetterMutation.mutateAsync(data);
  };

  const updateLetter = async (id: string, data: UpdateLetterData): Promise<Letter> => {
    return updateLetterMutation.mutateAsync({ id, data });
  };

  const deleteLetter = async (id: string): Promise<void> => {
    return deleteLetterMutation.mutateAsync(id);
  };

  return {
    letters,
    isLoading,
    error: error?.message,
    createLetter,
    updateLetter,
    deleteLetter,
    refetch,
  };
}
