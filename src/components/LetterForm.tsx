/**
 * UNIFIED LETTER FORM
 * 
 * Replaces both CreateLetterForm and EditLetterForm.
 * One component, clear logic, no duplication.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Plus, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

import { useLetters } from '../hooks/useLetters';
import { useMilestones } from '../hooks/useMilestones';
import type { Letter, CreateLetterData, UpdateLetterData } from '../lib/types';
import { FieldEnhancer } from './FieldEnhancer';
import { MilestoneManager } from './MilestoneManager';

interface LetterFormProps {
  letter?: Letter; // undefined = create mode, defined = edit mode
  onClose: () => void;
  onSuccess: (letter: Letter) => void;
}

export function LetterForm({ letter, onClose, onSuccess }: LetterFormProps) {
  const isEditMode = !!letter;
  const { createLetter, updateLetter } = useLetters();
  const { createMilestones, updateMilestones } = useMilestones();

  // Form state
  const [formData, setFormData] = useState({
    title: letter?.title || '',
    content: letter?.content || '',
    goal: letter?.goal || '',
    send_date: letter?.send_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    personal_comments: letter?.personal_comments || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [milestones, setMilestones] = useState<any[]>([]);

  // Update form when letter prop changes (for edit mode)
  useEffect(() => {
    if (letter) {
      setFormData({
        title: letter.title,
        content: letter.content,
        goal: letter.goal,
        send_date: letter.send_date,
        personal_comments: letter.personal_comments || '',
      });
      // Load existing milestones if in edit mode
      if (letter.milestones) {
        const existingMilestones = letter.milestones.map(m => ({
          id: m.id,
          text: m.title,
          dueDate: m.target_date,
          isInferred: false, // We don't track this in the database yet
          reasoning: m.description || '',
        }));
        setMilestones(existingMilestones);
      }
    }
  }, [letter]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFieldEnhancement = (field: keyof typeof formData, enhancedValue: string) => {
    setFormData(prev => ({ ...prev, [field]: enhancedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.goal.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let result: Letter;

      if (isEditMode && letter) {
        // Update existing letter
        const updateData: UpdateLetterData = {
          title: formData.title,
          content: formData.content,
          goal: formData.goal,
          send_date: formData.send_date,
          personal_comments: formData.personal_comments,
        };
        
        result = await updateLetter(letter.id, updateData);
        
        // Update milestones for existing letter
        if (milestones.length > 0) {
          const milestoneData = milestones.map(m => ({
            letterId: result.id,
            title: m.text,
            description: m.reasoning || '',
            percentage: 0, // Default percentage
            target_date: m.dueDate,
          }));
          await updateMilestones(result.id, milestoneData);
        } else {
          // If no milestones, clear existing ones
          await updateMilestones(result.id, []);
        }
      } else {
        // Create new letter
        const createData: CreateLetterData = {
          title: formData.title,
          content: formData.content,
          goal: formData.goal,
          send_date: formData.send_date,
        };
        
        result = await createLetter(createData);
        
        // Create milestones for new letter
        if (milestones.length > 0) {
          const milestoneData = milestones.map(m => ({
            letterId: result.id,
            title: m.text,
            description: m.reasoning || '',
            percentage: 0, // Default percentage
            target_date: m.dueDate,
          }));
          await createMilestones(milestoneData);
        }
      }

      onSuccess(result);
    } catch (error) {
      // Errors are already handled by the hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.title.trim() && formData.content.trim() && formData.goal.trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Letter Title *</Label>
          <Input
            id="title"
            placeholder="e.g., My Fitness Journey"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
          />
          <FieldEnhancer
            field="title"
            value={formData.title}
            onApply={(enhanced) => handleFieldEnhancement('title', enhanced)}
            context={{
              goal: formData.goal,
              content: formData.content,
            }}
          />
        </div>

          <div className="space-y-2">
            <Label htmlFor="send_date">Send Date *</Label>
            <Input
              id="send_date"
              type="date"
              value={formData.send_date}
              onChange={(e) => handleInputChange('send_date', e.target.value)}
              min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">Your Goal *</Label>
          <Textarea
            id="goal"
            placeholder="Describe what you want to achieve..."
            value={formData.goal}
            onChange={(e) => handleInputChange('goal', e.target.value)}
            className="min-h-[80px]"
          />
          <FieldEnhancer
            field="goal"
            value={formData.goal}
            onApply={(enhanced) => handleFieldEnhancement('goal', enhanced)}
            context={{
              title: formData.title,
              content: formData.content,
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Letter Content *</Label>
          <Textarea
            id="content"
            placeholder="Dear Future Me,&#10;&#10;I'm writing this letter to you with excitement about what we're going to achieve..."
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            className="min-h-[120px]"
          />
          <FieldEnhancer
            field="content"
            value={formData.content}
            onApply={(enhanced) => handleFieldEnhancement('content', enhanced)}
            context={{
              title: formData.title,
              goal: formData.goal,
            }}
          />
        </div>

        {/* Smart Milestones Section */}
        <MilestoneManager
          goal={formData.goal}
          content={formData.content}
          title={formData.title}
          initialMilestones={milestones}
          onChange={setMilestones}
        />

        {isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="comments">Personal Comments</Label>
            <Textarea
              id="comments"
              placeholder="Add your reflections, updates, or notes..."
              value={formData.personal_comments}
              onChange={(e) => handleInputChange('personal_comments', e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        )}


        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
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
    </div>
  );
}

/**
 * COMPARISON TO OLD FORMS:
 * 
 * OLD: CreateLetterForm (300+ lines) + EditLetterForm (250+ lines) = 550+ lines
 * NEW: Single LetterForm (250 lines) with unified logic
 * 
 * OLD: Duplicate enhancement logic, prop handling, validation
 * NEW: Shared logic, cleaner state management
 * 
 * OLD: Complex hook overloading and backward compatibility
 * NEW: Simple, direct hook usage
 * 
 * OLD: Separate milestone management inline
 * NEW: Will be handled separately (cleaner separation)
 */
