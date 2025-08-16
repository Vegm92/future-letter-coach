import { supabase } from '../../config/client';
import type { Milestone, CreateMilestone } from '@/shared/types/database';
import type { TablesInsert, TablesUpdate } from '../../types/database';

export interface CreateMilestoneRequest extends CreateMilestone {
  letter_id: string;
}

export interface MilestoneRepository {
  findByLetterId(letterId: string): Promise<Milestone[]>;
  findById(id: string): Promise<Milestone | null>;
  create(milestone: CreateMilestoneRequest): Promise<Milestone>;
  update(id: string, updates: Partial<Milestone>): Promise<Milestone>;
  delete(id: string): Promise<void>;
  markCompleted(id: string): Promise<Milestone>;
  markIncomplete(id: string): Promise<Milestone>;
  bulkCreate(milestones: CreateMilestoneRequest[]): Promise<Milestone[]>;
  bulkDelete(milestoneIds: string[]): Promise<void>;
}

export class SupabaseMilestoneRepository implements MilestoneRepository {
  async findByLetterId(letterId: string): Promise<Milestone[]> {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('letter_id', letterId)
      .order('target_date', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Milestone[];
  }

  async findById(id: string): Promise<Milestone | null> {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data as Milestone;
  }

  async create(milestone: CreateMilestoneRequest): Promise<Milestone> {
    const milestoneData: TablesInsert<'milestones'> = {
      title: milestone.title,
      description: milestone.description,
      percentage: milestone.percentage,
      target_date: milestone.target_date,
      letter_id: milestone.letter_id,
      completed: false,
      reminder_sent: false
    };

    const { data, error } = await supabase
      .from('milestones')
      .insert(milestoneData)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as Milestone;
  }

  async update(id: string, updates: Partial<Milestone>): Promise<Milestone> {
    const updateData: TablesUpdate<'milestones'> = {
      title: updates.title,
      description: updates.description,
      percentage: updates.percentage,
      target_date: updates.target_date,
      completed: updates.completed,
      completed_at: updates.completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('milestones')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as Milestone;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async markCompleted(id: string): Promise<Milestone> {
    const { data, error } = await supabase
      .from('milestones')
      .update({ 
        completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as Milestone;
  }

  async markIncomplete(id: string): Promise<Milestone> {
    const { data, error } = await supabase
      .from('milestones')
      .update({ 
        completed: false,
        completed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) throw error;
    return data as Milestone;
  }

  async bulkCreate(milestones: CreateMilestoneRequest[]): Promise<Milestone[]> {
    const milestoneData = milestones.map(milestone => ({
      title: milestone.title,
      description: milestone.description,
      percentage: milestone.percentage,
      target_date: milestone.target_date,
      letter_id: milestone.letter_id,
      completed: false,
      reminder_sent: false
    }));

    const { data, error } = await supabase
      .from('milestones')
      .insert(milestoneData)
      .select('*');
    
    if (error) throw error;
    return (data || []) as Milestone[];
  }

  async bulkDelete(milestoneIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .in('id', milestoneIds);
    
    if (error) throw error;
  }
}
