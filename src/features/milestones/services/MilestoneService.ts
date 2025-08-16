import { supabase } from "@/shared/config/client";
import type { Milestone } from '@/shared/types';
import type { CreateMilestoneRequest, UpdateMilestoneRequest, SuggestedMilestone } from '../types';

export class MilestoneService {
  /**
   * Get all milestones for a letter
   */
  async getMilestones(letterId: string): Promise<Milestone[]> {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('letter_id', letterId)
      .order('percentage', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new milestone
   */
  async createMilestone(request: CreateMilestoneRequest): Promise<Milestone> {
    const { data, error } = await supabase
      .from('milestones')
      .insert({
        letter_id: request.letter_id,
        title: request.title.trim(),
        percentage: request.percentage,
        target_date: request.target_date,
        description: request.description?.trim() || null,
        completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing milestone
   */
  async updateMilestone(request: UpdateMilestoneRequest): Promise<Milestone> {
    const updateData: any = {};
    
    if (request.title !== undefined) updateData.title = request.title.trim();
    if (request.percentage !== undefined) updateData.percentage = request.percentage;
    if (request.target_date !== undefined) updateData.target_date = request.target_date;
    if (request.description !== undefined) updateData.description = request.description?.trim() || null;
    if (request.completed !== undefined) updateData.completed = request.completed;

    const { data, error } = await supabase
      .from('milestones')
      .update(updateData)
      .eq('id', request.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a milestone
   */
  async deleteMilestone(id: string): Promise<void> {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Create multiple milestones from suggestions
   */
  async createMilestones(letterId: string, milestones: SuggestedMilestone[]): Promise<Milestone[]> {
    const milestonesToInsert = milestones.map(milestone => ({
      letter_id: letterId,
      title: milestone.title,
      description: milestone.description,
      percentage: milestone.percentage,
      target_date: milestone.target_date,
      completed: false,
    }));

    const { data, error } = await supabase
      .from('milestones')
      .insert(milestonesToInsert)
      .select();

    if (error) throw error;
    return data || [];
  }

  /**
   * Generate milestone suggestions using AI
   */
  async generateMilestoneSuggestions(letterData: {
    title: string;
    goal: string;
    content: string;
    send_date: string;
  }): Promise<{ suggestedMilestones: SuggestedMilestone[] }> {
    const { data, error } = await supabase.functions.invoke('enhance-letter-complete', {
      body: letterData
    });

    if (error) throw error;
    return data;
  }
}
