import { useState, useEffect, useCallback } from "react";
import { supabase } from '@/shared/config/client';
import { useToast } from "@/shared/hooks/use-toast";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  timezone?: string;
  default_send_date_offset?: number;
  default_letter_template?: string;
  default_goal_format?: string;
  ai_preferences?: {
    enabled: boolean;
    tone: 'casual' | 'motivational' | 'professional' | 'formal';
    auto_apply: boolean;
  };
  language?: string;
  accessibility_preferences?: {
    high_contrast: boolean;
    text_size: 'small' | 'normal' | 'large';
  };
  privacy_settings?: {
    letter_visibility: 'private' | 'shared' | 'public';
  };
  notification_preferences?: {
    email: boolean;
    push: boolean;
  };
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no profile exists, create one
        if (error.code === 'PGRST116') {
          const newProfile = {
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) throw createError;
          setProfile(createdProfile as unknown as UserProfile);
        } else {
          throw error;
        }
      } else {
        setProfile(data as unknown as UserProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load profile settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    saving,
    updateProfile,
    refetch: fetchProfile,
  };
};
