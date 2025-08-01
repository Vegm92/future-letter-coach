-- Add personal comments column to letters table
ALTER TABLE public.letters 
ADD COLUMN personal_comments TEXT;