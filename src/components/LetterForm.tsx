import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, Loader2 } from 'lucide-react';

import { useLetters } from '../hooks/useLetters';
import { useMilestones } from '../hooks/useMilestones';
import type { Letter, CreateLetterData, UpdateLetterData, LetterFormProps } from '../lib/types';
import { FieldEnhancer } from './FieldEnhancer';
import { MilestoneManager } from './MilestoneManager';

const letterFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content must be less than 5000 characters'),
  goal: z
    .string()
    .min(5, 'Goal must be at least 5 characters')
    .max(500, 'Goal must be less than 500 characters'),
  send_date: z
    .string()
    .refine(
      (date) => new Date(date) > new Date(),
      'Send date must be in the future'
    ),
  personal_comments: z.string().max(1000).optional().default(''),
});

type LetterFormValues = z.infer<typeof letterFormSchema>;

export function LetterForm({ letter, onClose, onSuccess }: LetterFormProps) {
  const isEditMode = !!letter;
  const { createLetter, updateLetter } = useLetters();
  const { createMilestones, updateMilestones } = useMilestones();
  
  const [milestones, setMilestones] = useState(letter?.milestones || []);

  const form = useForm<LetterFormValues>({
    resolver: zodResolver(letterFormSchema),
    defaultValues: {
      title: letter?.title || '',
      content: letter?.content || '',
      goal: letter?.goal || '',
      send_date: letter?.send_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      personal_comments: letter?.personal_comments || '',
    },
  });

  const formValues = form.watch();
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (letter) {
      form.reset({
        title: letter.title,
        content: letter.content,
        goal: letter.goal,
        send_date: letter.send_date,
        personal_comments: letter.personal_comments || '',
      });
    }
  }, [letter, form]);

  const handleFieldEnhancement = (field: keyof LetterFormValues, enhancedValue: string) => {
    form.setValue(field, enhancedValue, { 
      shouldValidate: true,
      shouldDirty: true 
    });
  };
  const onSubmit = async (data: LetterFormValues) => {
    try {
      let result: Letter;

      if (isEditMode && letter) {
        const updateData: UpdateLetterData = {
          title: data.title,
          content: data.content,
          goal: data.goal,
          send_date: data.send_date,
        };
        // Only include personal_comments if it's not empty
        if (data.personal_comments && data.personal_comments.trim() !== '') {
          updateData.personal_comments = data.personal_comments;
        }
        result = await updateLetter(letter.id, updateData);
        
        // Update milestones if there are any changes
        if (milestones.length > 0) {
          const milestonesWithLetterId = milestones.map(milestone => ({
            letterId: letter.id,
            title: milestone.text || milestone.title,
            description: milestone.reasoning || milestone.description || '',
            percentage: milestone.percentage || 0,
            target_date: milestone.dueDate || milestone.target_date,
          }));
          await updateMilestones(letter.id, milestonesWithLetterId);
        }
      } else {
        const createData: CreateLetterData = {
          title: data.title,
          content: data.content,
          goal: data.goal,
          send_date: data.send_date,
        };
        result = await createLetter(createData);
        
        // Create milestones if there are any
        if (milestones.length > 0) {
          const milestonesWithLetterId = milestones.map(milestone => ({
            letterId: result.id,
            title: milestone.text || milestone.title,
            description: milestone.reasoning || milestone.description || '',
            percentage: milestone.percentage || 0,
            target_date: milestone.dueDate || milestone.target_date,
          }));
          await createMilestones(milestonesWithLetterId);
        }
      }

      onSuccess(result);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };


  return (
    <div className="space-y-6">
      <div data-section="header">
        <h2 className="text-xl font-semibold">
          {isEditMode ? `Edit "${letter.title}"` : 'Create New Letter'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isEditMode 
            ? 'Update your letter content and goals' 
            : 'Write a letter to your future self'
          }
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div data-section="basic-fields" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Letter Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., My Fitness Journey" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <FieldEnhancer
                    field="title"
                    value={field.value}
                    onApply={(enhanced) => handleFieldEnhancement('title', enhanced)}
                    context={{
                      goal: formValues.goal,
                      content: formValues.content,
                    }}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="send_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    When should this letter be delivered?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div data-section="goal-field">
            <FormField
              control={form.control}
              name="goal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Goal *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what you want to achieve..."
                    className="min-h-[80px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  What do you hope to accomplish by the time you receive this letter?
                </FormDescription>
                <FormMessage />
                <FieldEnhancer
                  field="goal"
                  value={field.value}
                  onApply={(enhanced) => handleFieldEnhancement('goal', enhanced)}
                  context={{
                    title: formValues.title,
                    content: formValues.content,
                  }}
                />
              </FormItem>
            )}
          />
          </div>

          <div data-section="content-field">
            <FormField
              control={form.control}
              name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Letter Content *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Dear Future Me,&#10;&#10;I'm writing this letter to you with excitement about what we're going to achieve..."
                    className="min-h-[150px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Write your message to your future self. Be specific about your hopes, dreams, and current situation.
                </FormDescription>
                <FormMessage />
                <FieldEnhancer
                  field="content"
                  value={field.value}
                  onApply={(enhanced) => handleFieldEnhancement('content', enhanced)}
                  context={{
                    title: formValues.title,
                    goal: formValues.goal,
                  }}
                />
              </FormItem>
            )}
          />
          </div>

          <div data-section="milestones" className="border-t pt-6">
            <MilestoneManager
              goal={formValues.goal}
              content={formValues.content}
              title={formValues.title}
              initialMilestones={milestones}
              onChange={setMilestones}
            />
          </div>

          <div data-section="personal-comments">
            {isEditMode && (
              <FormField
              control={form.control}
              name="personal_comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Comments</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add your reflections, updates, or notes..."
                      className="min-h-[80px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional reflections or updates since creating this letter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}
          </div>

          <div data-section="form-actions" className="flex items-center justify-between pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !form.formState.isValid}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <Save className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {isEditMode ? 'Save Changes' : 'Create Letter'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

