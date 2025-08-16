import { supabase } from '@/shared/config/client';
import type { 
  Profile, 
  ProfileUpdateRequest, 
  AIPreferences, 
  NotificationSettings, 
  SecuritySettings, 
  AccessibilitySettings, 
  LetterDefaults 
} from '../types';

export class SettingsService {
  /**
   * Get user profile
   */
  async getProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: ProfileUpdateRequest): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get AI preferences
   */
  async getAIPreferences(): Promise<AIPreferences> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .select('ai_preferences')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data?.ai_preferences || {
      enhancement_style: 'professional',
      auto_enhancement: false,
      milestone_suggestions: true,
      content_analysis: true,
    };
  }

  /**
   * Update AI preferences
   */
  async updateAIPreferences(preferences: AIPreferences): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ai_preferences: preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<NotificationSettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .select('notification_settings')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data?.notification_settings || {
      email_reminders: true,
      push_notifications: true,
      letter_delivery: true,
      milestone_updates: true,
      weekly_summary: false,
    };
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        notification_settings: settings,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  /**
   * Get security settings
   */
  async getSecuritySettings(): Promise<SecuritySettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .select('security_settings')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data?.security_settings || {
      two_factor_enabled: false,
      login_notifications: true,
      data_export_enabled: true,
    };
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(settings: SecuritySettings): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        security_settings: settings,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  /**
   * Get accessibility settings
   */
  async getAccessibilitySettings(): Promise<AccessibilitySettings> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .select('accessibility_settings')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data?.accessibility_settings || {
      theme: 'system',
      font_size: 'medium',
      high_contrast: false,
      reduced_motion: false,
      language: 'en',
    };
  }

  /**
   * Update accessibility settings
   */
  async updateAccessibilitySettings(settings: AccessibilitySettings): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        accessibility_settings: settings,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  /**
   * Get letter defaults
   */
  async getLetterDefaults(): Promise<LetterDefaults> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_preferences')
      .select('letter_defaults')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data?.letter_defaults || {
      default_send_time: '09:00',
      default_privacy: 'private',
      include_milestones: true,
      auto_enhance: false,
    };
  }

  /**
   * Update letter defaults
   */
  async updateLetterDefaults(defaults: LetterDefaults): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        letter_defaults: defaults,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }
}
