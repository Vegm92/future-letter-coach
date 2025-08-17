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
import { Sparkles, Save, Plus, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';

import { useLetters } from '../hooks/useLetters';
import { useEnhancement } from '../hooks/useEnhancement';
import type { Letter, CreateLetterData, UpdateLetterData } from '../lib/types';

interface LetterFormProps {
  letter?: Letter; // undefined = create mode, defined = edit mode
  onClose: () => void;
  onSuccess: (letter: Letter) => void;
}

export function LetterForm({ letter, onClose, onSuccess }: LetterFormProps) {
  const isEditMode = !!letter;
  const { createLetter, updateLetter } = useLetters();
  const { enhance, isLoading: enhancing } = useEnhancement();

  // Form state
  const [formData, setFormData] = useState({
    title: letter?.title || '',
    content: letter?.content || '',
    goal: letter?.goal || '',
    send_date: letter?.send_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    personal_comments: letter?.personal_comments || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [showEnhanced, setShowEnhanced] = useState(false);

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
    }
  }, [letter]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEnhance = async () => {
    if (!formData.title.trim() || !formData.goal.trim() || !formData.content.trim()) {
      return; // Need basic content to enhance
    }

    try {
      const response = await enhance({
        title: formData.title,
        goal: formData.goal,
        content: formData.content,
        send_date: formData.send_date,
      });
      
      setEnhancedData(response);
      setShowEnhanced(true);
    } catch (error) {
      // Error already handled by the hook
    }
  };

  const applyEnhancement = (field: 'title' | 'goal' | 'content') => {
    if (!enhancedData) return;
    
    const enhancedValue = 
      field === 'title' ? enhancedData.enhancedTitle :
      field === 'goal' ? enhancedData.enhancedGoal :
      enhancedData.enhancedContent;

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
        
        // Add enhanced data if we have it
        if (enhancedData) {
          updateData.ai_enhanced_title = enhancedData.enhancedTitle;
          updateData.ai_enhanced_goal = enhancedData.enhancedGoal;
          updateData.ai_enhanced_content = enhancedData.enhancedContent;
        }
        
        result = await updateLetter(letter.id, updateData);
      } else {
        // Create new letter
        const createData: CreateLetterData = {
          title: formData.title,
          content: formData.content,
          goal: formData.goal,
          send_date: formData.send_date,
        };
        
        result = await createLetter(createData);
      }

      onSuccess(result);
    } catch (error) {
      // Errors are already handled by the hooks
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEnhance = formData.title.trim() && formData.goal.trim() && formData.content.trim();
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
        </div>

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

        {/* AI Enhancement Section */}
        <Separator />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium">AI Enhancement</span>
              {enhancedData && <Badge variant="secondary">Enhanced</Badge>}
            </div>
            <Button
              type="button"
              onClick={handleEnhance}
              disabled={!canEnhance || enhancing}
              variant="outline"
              size="sm"
            >
              {enhancing ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-2" />
                  Enhance with AI
                </>
              )}
            </Button>
          </div>

          {/* Enhanced Content Display */}
          {enhancedData && showEnhanced && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium text-sm">AI Suggestions:</h4>
              
              {/* Enhanced Title */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Enhanced Title</Label>
                  <Button
                    type="button"
                    onClick={() => applyEnhancement('title')}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-sm bg-background p-2 rounded border">
                  {enhancedData.enhancedTitle}
                </p>
              </div>

              {/* Enhanced Goal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Enhanced Goal</Label>
                  <Button
                    type="button"
                    onClick={() => applyEnhancement('goal')}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-sm bg-background p-2 rounded border">
                  {enhancedData.enhancedGoal}
                </p>
              </div>

              {/* Enhanced Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Enhanced Content</Label>
                  <Button
                    type="button"
                    onClick={() => applyEnhancement('content')}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-sm bg-background p-2 rounded border whitespace-pre-wrap">
                  {enhancedData.enhancedContent}
                </p>
              </div>
            </div>
          )}
        </div>

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
