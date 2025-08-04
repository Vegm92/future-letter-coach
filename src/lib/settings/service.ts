import { supabase } from '@/integrations/supabase/client';
import type { UserProfile } from '@/hooks/useProfile';
import type { SettingsFormData } from './types';

// Profile service for settings-specific operations
export class SettingsService {
  // Get user profile with settings
  static async getProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Create profile if it doesn't exist
          return await this.createProfile(user);
        }
        throw error;
      }

      return data as unknown as UserProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  // Create new profile with defaults
  static async createProfile(user: any): Promise<UserProfile> {
    const newProfile = {
      user_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      timezone: 'UTC',
      language: 'en',
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as UserProfile;
  }

  // Update profile settings
  static async updateSettings(
    userId: string, 
    updates: Partial<UserProfile>
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Batch update multiple settings
  static async batchUpdateSettings(
    userId: string,
    settingsData: SettingsFormData
  ): Promise<void> {
    const updates: Partial<UserProfile> = {};

    // Map form data to profile fields
    if (settingsData.profile) {
      Object.assign(updates, settingsData.profile);
    }

    if (settingsData.defaults) {
      Object.assign(updates, settingsData.defaults);
    }

    if (settingsData.ai_preferences) {
      updates.ai_preferences = settingsData.ai_preferences;
    }

    if (settingsData.notification_preferences) {
      updates.notification_preferences = settingsData.notification_preferences;
    }

    if (settingsData.accessibility_preferences) {
      updates.accessibility_preferences = settingsData.accessibility_preferences;
    }

    if (settingsData.privacy_settings) {
      updates.privacy_settings = settingsData.privacy_settings;
    }

    if (settingsData.language) {
      updates.language = settingsData.language;
    }

    await this.updateSettings(userId, updates);
  }

  // Upload avatar
  static async uploadAvatar(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  // Delete avatar
  static async deleteAvatar(userId: string): Promise<void> {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([`${userId}/avatar`]);

    if (error) throw error;
  }

  // Change password
  static async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }

  // Delete account
  static async deleteAccount(): Promise<void> {
    // First delete all user data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete letters, milestones, etc.
    await supabase.from('letters').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('user_id', user.id);

    // Finally delete the auth user (requires admin privileges)
    // This would typically be done through an edge function
    const { error } = await supabase.functions.invoke('delete-user-account');
    if (error) throw error;
  }

  // Reset settings to defaults
  static async resetToDefaults(userId: string): Promise<void> {
    const defaultSettings: Partial<UserProfile> = {
      default_send_date_offset: 180,
      default_letter_template: null,
      default_goal_format: null,
      ai_preferences: {
        enabled: true,
        tone: 'motivational' as const,
        auto_apply: false,
      },
      notification_preferences: {
        email: true,
        push: false,
      } as any,
      accessibility_preferences: {
        high_contrast: false,
        text_size: 'normal' as const,
      },
      privacy_settings: {
        letter_visibility: 'private' as const,
      },
      language: 'en',
    };

    await this.updateSettings(userId, defaultSettings);
  }

  // Export user data (GDPR compliance)
  static async exportUserData(userId: string): Promise<any> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: letters } = await supabase
      .from('letters')
      .select('*')
      .eq('user_id', userId);

    const { data: milestones } = await supabase
      .from('milestones')
      .select('*')
      .in('letter_id', letters?.map(l => l.id) || []);

    return {
      profile,
      letters,
      milestones,
      exported_at: new Date().toISOString(),
    };
  }
}