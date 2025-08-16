import { supabase } from '../../config/client';
import type { Letter } from '@/shared/types/database';
import type { TablesInsert, TablesUpdate } from '../../types/database';

export interface CreateLetterRequest {
  title: string;
  content: string;
  goal: string;
  send_date: string;
  user_id: string;
  ai_enhanced_content?: string;
  ai_enhanced_goal?: string;
  ai_enhanced?: boolean;
  voice_memo_url?: string;
  personal_comments?: string;
}

export interface LetterRepository {
  findAll(userId: string): Promise<Letter[]>;
  findById(id: string): Promise<Letter | null>;
  create(letter: CreateLetterRequest): Promise<Letter>;
  update(id: string, updates: Partial<Letter>): Promise<Letter>;
  delete(id: string): Promise<void>;
  findByStatus(userId: string, status: Letter['status']): Promise<Letter[]>;
  updateStatus(id: string, status: Letter['status']): Promise<Letter>;
  lock(id: string): Promise<Letter>;
  unlock(id: string): Promise<Letter>;
}

export class SupabaseLetterRepository implements LetterRepository {
  async findAll(userId: string): Promise<Letter[]> {
    const { data, error } = await supabase
      .from('letters')
      .select(`
        *,
        milestones(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Letter[];
  }

  async findById(id: string): Promise<Letter | null> {
    const { data, error } = await supabase
      .from('letters')
      .select(`
        *,
        milestones(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data as Letter;
  }

  async create(letter: CreateLetterRequest): Promise<Letter> {
    const letterData: TablesInsert<'letters'> = {
      title: letter.title,
      content: letter.content,
      goal: letter.goal,
      send_date: letter.send_date,
      user_id: letter.user_id,
      ai_enhanced_content: letter.ai_enhanced_content,
      ai_enhanced_goal: letter.ai_enhanced_goal,
      ai_enhanced: letter.ai_enhanced || false,
      voice_memo_url: letter.voice_memo_url,
      personal_comments: letter.personal_comments,
      status: 'draft',
      is_locked: false
    };

    const { data, error } = await supabase
      .from('letters')
      .insert(letterData)
      .select(`
        *,
        milestones(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Letter;
  }

  async update(id: string, updates: Partial<Letter>): Promise<Letter> {
    // Convert Letter type to Supabase update format
    const updateData: TablesUpdate<'letters'> = {
      title: updates.title,
      content: updates.content,
      goal: updates.goal,
      send_date: updates.send_date,
      ai_enhanced_content: updates.ai_enhanced_content,
      ai_enhanced_goal: updates.ai_enhanced_goal,
      ai_enhanced: updates.ai_enhanced,
      voice_memo_url: updates.voice_memo_url,
      personal_comments: updates.personal_comments,
      status: updates.status,
      is_locked: updates.is_locked,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('letters')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        milestones(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Letter;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('letters')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async findByStatus(userId: string, status: Letter['status']): Promise<Letter[]> {
    const { data, error } = await supabase
      .from('letters')
      .select(`
        *,
        milestones(*)
      `)
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Letter[];
  }

  async updateStatus(id: string, status: Letter['status']): Promise<Letter> {
    const { data, error } = await supabase
      .from('letters')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        milestones(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Letter;
  }

  async lock(id: string): Promise<Letter> {
    const { data, error } = await supabase
      .from('letters')
      .update({ 
        is_locked: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        milestones(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Letter;
  }

  async unlock(id: string): Promise<Letter> {
    const { data, error } = await supabase
      .from('letters')
      .update({ 
        is_locked: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        milestones(*)
      `)
      .single();
    
    if (error) throw error;
    return data as Letter;
  }
}
