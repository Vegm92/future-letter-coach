-- Add ai_enhanced column to letters table to track if letter was ever AI enhanced
ALTER TABLE public.letters 
ADD COLUMN ai_enhanced boolean DEFAULT false;