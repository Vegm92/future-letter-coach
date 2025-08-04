-- Add ai_enhanced_content column to letters table for storing enhanced content
ALTER TABLE public.letters 
ADD COLUMN ai_enhanced_content TEXT;