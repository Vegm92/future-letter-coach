-- Add delete policy for milestones
CREATE POLICY "Users can delete milestones for their letters" 
ON public.milestones 
FOR DELETE 
USING (EXISTS (
  SELECT 1 
  FROM letters 
  WHERE letters.id = milestones.letter_id 
    AND letters.user_id = auth.uid()
));