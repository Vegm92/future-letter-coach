import { useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { MilestoneService } from '../services';

// Create milestone service instance
const milestoneService = new MilestoneService();
import type { Milestone } from '@/shared/types';
import type { CreateMilestoneRequest, UpdateMilestoneRequest, SuggestedMilestone } from '../types';

export const useMilestones = (letterId?: string) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const { toast } = useToast();

  const fetchMilestones = async (id?: string) => {
    if (!id && !letterId) return;
    
    setIsLoading(true);
    try {
      const fetchedMilestones = await milestoneService.getMilestones(id || letterId!);
      setMilestones(fetchedMilestones);
    } catch (error) {
      toast({
        title: "Failed to load milestones",
        description: "Could not fetch milestones. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createMilestone = async (request: CreateMilestoneRequest) => {
    setIsCreating(true);
    try {
      const newMilestone = await milestoneService.createMilestone(request);
      setMilestones(prev => [...prev, newMilestone]);
      toast({
        title: "Milestone created!",
        description: "New milestone has been added to your goal.",
      });
      return newMilestone;
    } catch (error) {
      toast({
        title: "Failed to create milestone",
        description: "Could not create milestone. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const updateMilestone = async (request: UpdateMilestoneRequest) => {
    setIsUpdating(true);
    try {
      const updatedMilestone = await milestoneService.updateMilestone(request);
      setMilestones(prev => prev.map(m => m.id === request.id ? updatedMilestone : m));
      toast({
        title: "Milestone updated!",
        description: "Milestone has been successfully updated.",
      });
      return updatedMilestone;
    } catch (error) {
      toast({
        title: "Failed to update milestone",
        description: "Could not update milestone. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteMilestone = async (id: string) => {
    setIsDeleting(true);
    try {
      await milestoneService.deleteMilestone(id);
      setMilestones(prev => prev.filter(m => m.id !== id));
      toast({
        title: "Milestone deleted",
        description: "Milestone has been removed from your goal.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete milestone",
        description: "Could not delete milestone. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  const createMilestonesFromSuggestions = async (id: string, suggestions: SuggestedMilestone[]) => {
    try {
      const newMilestones = await milestoneService.createMilestones(id, suggestions);
      setMilestones(prev => [...prev, ...newMilestones]);
      toast({
        title: "Milestones added!",
        description: `Successfully added ${newMilestones.length} milestone${newMilestones.length > 1 ? 's' : ''}.`,
      });
      return newMilestones;
    } catch (error) {
      toast({
        title: "Failed to add milestones",
        description: "Could not add suggested milestones. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const generateSuggestions = async (letterData: {
    title: string;
    goal: string;
    content: string;
    send_date: string;
  }) => {
    setIsGeneratingSuggestions(true);
    try {
      const result = await milestoneService.generateMilestoneSuggestions(letterData);
      toast({
        title: "Milestones suggested!",
        description: "AI has generated milestone suggestions for your goal.",
      });
      return result;
    } catch (error) {
      toast({
        title: "Failed to generate suggestions",
        description: "Unable to generate milestone suggestions. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  return {
    milestones,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isGeneratingSuggestions,
    fetchMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    createMilestonesFromSuggestions,
    generateSuggestions,
    setMilestones,
  };
};
