import { useState, useEffect, useCallback } from 'react';
import { LetterService } from '../services';
import { SupabaseLetterRepository } from '@/shared/services/repositories';

// Create letter service instance with repository dependency
const letterRepository = new SupabaseLetterRepository();
const letterService = new LetterService(letterRepository);
import type { Letter } from '@/shared/types/database';
import type { CreateLetterRequest } from '@/shared/services/repositories';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/shared/config/client';

interface UseLettersState {
  letters: Letter[];
  loading: boolean;
  error: string | null;
}

interface UseLettersActions {
  fetchLetters: (userId: string) => Promise<void>;
  createLetter: (request: CreateLetterRequest) => Promise<Letter | null>;
  updateLetter: (id: string, updates: Partial<Letter>) => Promise<Letter | null>;
  deleteLetter: (id: string) => Promise<void>;
  updateLetterStatus: (id: string, status: Letter['status']) => Promise<void>;
  lockLetter: (id: string) => Promise<void>;
  unlockLetter: (id: string) => Promise<void>;
  triggerDelivery: (letter: Letter) => Promise<void>;
}

export function useLetters(): [UseLettersState, UseLettersActions] {
  const [state, setState] = useState<UseLettersState>({
    letters: [],
    loading: false,
    error: null,
  });

  const { toast } = useToast();

  const fetchLetters = useCallback(async (userId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const letters = await letterService.getUserLetters(userId);
      setState(prev => ({ ...prev, letters, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch letters';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      toast({
        title: 'Failed to load letters',
        description: 'Please try refreshing the page.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const createLetter = useCallback(async (request: CreateLetterRequest): Promise<Letter | null> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const newLetter = await letterService.createLetter(request);
      setState(prev => ({ 
        ...prev, 
        letters: [newLetter, ...prev.letters] 
      }));
      
      toast({
        title: 'Letter created',
        description: 'Your letter has been saved successfully.',
      });
      
      return newLetter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create letter';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: 'Failed to create letter',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateLetter = useCallback(async (id: string, updates: Partial<Letter>): Promise<Letter | null> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const updatedLetter = await letterService.updateLetter(id, updates);
      setState(prev => ({
        ...prev,
        letters: prev.letters.map(l => l.id === id ? updatedLetter : l)
      }));
      
      toast({
        title: 'Letter updated',
        description: 'Your changes have been saved.',
      });
      
      return updatedLetter;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update letter';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: 'Failed to update letter',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const deleteLetter = useCallback(async (id: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await letterService.deleteLetter(id);
      setState(prev => ({
        ...prev,
        letters: prev.letters.filter(l => l.id !== id)
      }));
      
      toast({
        title: 'Letter deleted',
        description: 'The letter has been permanently removed.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete letter';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: 'Failed to delete letter',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const updateLetterStatus = useCallback(async (id: string, status: Letter['status']): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const updatedLetter = await letterService.updateLetterStatus(id, status);
      setState(prev => ({
        ...prev,
        letters: prev.letters.map(l => l.id === id ? updatedLetter : l)
      }));
      
      toast({
        title: 'Status updated',
        description: `Letter status changed to ${status}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: 'Failed to update status',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const lockLetter = useCallback(async (id: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const updatedLetter = await letterService.lockLetter(id);
      setState(prev => ({
        ...prev,
        letters: prev.letters.map(l => l.id === id ? updatedLetter : l)
      }));
      
      toast({
        title: 'Letter locked',
        description: 'Letter has been locked from editing.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to lock letter';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: 'Failed to lock letter',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const unlockLetter = useCallback(async (id: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const updatedLetter = await letterService.unlockLetter(id);
      setState(prev => ({
        ...prev,
        letters: prev.letters.map(l => l.id === id ? updatedLetter : l)
      }));
      
      toast({
        title: 'Letter unlocked',
        description: 'Letter is now available for editing.',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlock letter';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: 'Failed to unlock letter',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const triggerDelivery = useCallback(async (letter: Letter): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const action = letter.status === 'draft' ? 'schedule' : 'send';

      const { data, error } = await supabase.functions.invoke(
        'trigger-letter-delivery',
        {
          body: {
            letterId: letter.id,
            action: action,
          },
        }
      );

      if (error) throw error;

      const newStatus: Letter['status'] = action === 'schedule' ? 'scheduled' : 'sent';
      setState(prev => ({
        ...prev,
        letters: prev.letters.map(l =>
          l.id === letter.id ? { ...l, status: newStatus } : l
        )
      }));

      toast({
        title: action === 'schedule' ? 'Letter Scheduled' : 'Letter Sent',
        description:
          action === 'schedule'
            ? `"${letter.title}" has been scheduled for delivery`
            : `"${letter.title}" has been sent successfully`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast({
        title: 'Failed to process request',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const actions: UseLettersActions = {
    fetchLetters,
    createLetter,
    updateLetter,
    deleteLetter,
    updateLetterStatus,
    lockLetter,
    unlockLetter,
    triggerDelivery,
  };

  return [state, actions];
}
