-- Add new columns to profiles table for comprehensive user settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS 
  avatar_url TEXT,
  default_send_date_offset INTEGER DEFAULT 180, -- days (6 months)
  default_letter_template TEXT,
  default_goal_format TEXT,
  ai_preferences JSONB DEFAULT '{"enabled": true, "tone": "motivational", "auto_apply": false}'::jsonb,
  language TEXT DEFAULT 'en',
  accessibility_preferences JSONB DEFAULT '{"high_contrast": false, "text_size": "normal"}'::jsonb,
  privacy_settings JSONB DEFAULT '{"letter_visibility": "private"}'::jsonb;

-- Add updated_at trigger for profiles table if it doesn't exist
CREATE TRIGGER IF NOT EXISTS update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();