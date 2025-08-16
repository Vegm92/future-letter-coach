import { supabase } from '@/integrations/supabase/client';
import type { VoiceMemo } from '../types';

export class VoiceMemoService {
  /**
   * Upload audio file to storage
   */
  async uploadAudio(letterId: string, audioBlob: Blob): Promise<string> {
    const fileName = `${letterId}-${Date.now()}.wav`;
    const filePath = `voice-memos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(filePath, audioBlob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Create voice memo record
   */
  async createVoiceMemo(letterId: string, audioUrl: string, duration: number): Promise<VoiceMemo> {
    const { data, error } = await supabase
      .from('voice_memos')
      .insert({
        letter_id: letterId,
        audio_url: audioUrl,
        duration: duration,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get voice memo for a letter
   */
  async getVoiceMemo(letterId: string): Promise<VoiceMemo | null> {
    const { data, error } = await supabase
      .from('voice_memos')
      .select('*')
      .eq('letter_id', letterId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No record found
      throw error;
    }

    return data;
  }

  /**
   * Delete voice memo
   */
  async deleteVoiceMemo(id: string): Promise<void> {
    const { error } = await supabase
      .from('voice_memos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete audio file from storage
   */
  async deleteAudioFile(audioUrl: string): Promise<void> {
    // Extract file path from URL
    const urlParts = audioUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `voice-memos/${fileName}`;

    const { error } = await supabase.storage
      .from('audio')
      .remove([filePath]);

    if (error) throw error;
  }
}
