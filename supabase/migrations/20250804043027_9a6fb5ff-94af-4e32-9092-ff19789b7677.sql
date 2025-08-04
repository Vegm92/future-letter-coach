-- Add new columns to profiles table for comprehensive user settings
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS default_send_date_offset INTEGER DEFAULT 180, -- days (6 months)
ADD COLUMN IF NOT EXISTS default_letter_template TEXT,
ADD COLUMN IF NOT EXISTS default_goal_format TEXT,
ADD COLUMN IF NOT EXISTS ai_preferences JSONB DEFAULT '{"enabled": true, "tone": "motivational", "auto_apply": false}'::jsonb,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS accessibility_preferences JSONB DEFAULT '{"high_contrast": false, "text_size": "normal"}'::jsonb,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"letter_visibility": "private"}'::jsonb;