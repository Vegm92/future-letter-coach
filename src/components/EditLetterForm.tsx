import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { useSmartEnhancement } from "@/hooks/useSmartEnhancement";

// Sub-components
import { EnhancedField } from "./EditLetterForm/EnhancedField";
import { MilestoneSuggestionList } from "./EditLetterForm/MilestoneSuggestionList";
import { EnhancementActions } from "./EditLetterForm/EnhancementActions";
import { VoiceMemoSection } from "./EditLetterForm/VoiceMemoSection";

import type { Letter, EditLetterFormProps } from '@/types';

interface FormData {
  title: string;
  content: string;
  goal: string;
  sendDate: string;
}

const EditLetterForm = ({ letter, onClose, onSuccess }: EditLetterFormProps) => {
  // Grouped form data state
  const [formData, setFormData] = useState<FormData>({
    title: letter.title,
    content: letter.content,
    goal: letter.goal,
    sendDate: format(parseISO(letter.send_date), 'yyyy-MM-dd')
  });
  
  // Separate UI states
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Sync form data when letter prop changes
  useEffect(() => {
    if (!isSubmitting) { // Prevent sync during form submission
      setFormData({
        title: letter.title,
        content: letter.content,
        goal: letter.goal,
        sendDate: format(parseISO(letter.send_date), 'yyyy-MM-dd')
      });
    }
  }, [letter, isSubmitting]);

  // Helper function to update form data
  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const enhancement = useSmartEnhancement({
    title: formData.title,
    goal: formData.goal,
    content: formData.content,
    send_date: formData.sendDate,
    onApplyField: (field, value) => {
      updateFormData(field as keyof FormData, value);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.goal.trim() || !formData.sendDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        goal: formData.goal.trim(),
        send_date: formData.sendDate,
        ai_enhanced: letter.ai_enhanced || enhancement.state === 'success',
        ...(enhancement.state === 'success' && enhancement.appliedFields.has('goal') && { ai_enhanced_goal: formData.goal }),
        ...(enhancement.state === 'success' && enhancement.appliedFields.has('content') && { ai_enhanced_content: formData.content }),
      };

      const { data, error } = await supabase
        .from('letters')
        .update(updateData)
        .eq('id', letter.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Letter updated!",
        description: "Your letter has been successfully updated.",
      });

      onSuccess(data as Letter);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update your letter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Recording stopped" : "Recording started",
      description: isRecording ? "Voice memo recording has been stopped." : "Voice memo recording has started.",
    });
  };

  const canEditSendDate = !letter.is_locked && letter.status !== 'sent';
  const canEnhance = !letter.ai_enhanced && !letter.is_locked;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Edit Letter</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="edit-title">Letter Title *</Label>
              <Input
                id="edit-title"
                placeholder="Give your letter a meaningful title..."
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                disabled={letter.is_locked}
                className="mt-1"
              />
            </div>

            {/* Goal */}
            <div>
              <Label htmlFor="edit-goal">Your Goal *</Label>
              <Textarea
                id="edit-goal"
                placeholder="What do you want to achieve?"
                value={formData.goal}
                onChange={(e) => updateFormData('goal', e.target.value)}
                disabled={letter.is_locked}
                className="resize-none h-20 mt-1"
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="edit-content">Letter Content *</Label>
              <Textarea
                id="edit-content"
                placeholder="Write your letter to your future self..."
                value={formData.content}
                onChange={(e) => updateFormData('content', e.target.value)}
                disabled={letter.is_locked}
                className="resize-none h-32 mt-1"
              />
            </div>

            {/* AI Enhancement Section */}
            {canEnhance && (
              <div className="space-y-4">
                <EnhancementActions
                  state={enhancement.state}
                  canEnhance={enhancement.canEnhance}
                  onEnhance={enhancement.enhance}
                  onRetry={enhancement.retry}
                />
                
                {/* Enhancement Results */}
                {enhancement.hasEnhancementData && enhancement.data && (
                  <Collapsible open={enhancement.isExpanded} onOpenChange={enhancement.setIsExpanded}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                        <span className="text-sm font-medium">✨ View Enhanced Content</span>
                        {enhancement.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium text-sm">AI Suggestions</h4>
                          <Button
                            onClick={enhancement.applyAllRemaining}
                            size="sm"
                            className="h-7 px-3 text-xs"
                            disabled={enhancement.appliedFields.size === 3 && (!enhancement.data?.suggestedMilestones?.length || enhancement.milestonesApplied)}
                          >
                            {enhancement.appliedFields.size === 3 && (!enhancement.data?.suggestedMilestones?.length || enhancement.milestonesApplied)
                              ? "All Applied" 
                              : "Apply All Remaining"
                            }
                          </Button>
                        </div>
                        
                        <EnhancedField
                          label="Enhanced Title"
                          value={enhancement.data.enhancedLetter.title}
                          fieldKey="title"
                          isApplied={enhancement.appliedFields.has('title')}
                          isLoading={enhancement.loadingFields.has('title')}
                          onApply={() => enhancement.applyField('title')}
                        />

                        <EnhancedField
                          label="Enhanced Goal"
                          value={enhancement.data.enhancedLetter.goal}
                          fieldKey="goal"
                          isApplied={enhancement.appliedFields.has('goal')}
                          isLoading={enhancement.loadingFields.has('goal')}
                          onApply={() => enhancement.applyField('goal')}
                        />

                        <EnhancedField
                          label="Enhanced Content"
                          value={enhancement.data.enhancedLetter.content}
                          fieldKey="content"
                          isApplied={enhancement.appliedFields.has('content')}
                          isLoading={enhancement.loadingFields.has('content')}
                          onApply={() => enhancement.applyField('content')}
                          className="max-h-32 overflow-y-auto"
                        />

                        <MilestoneSuggestionList
                          milestones={enhancement.data.suggestedMilestones || []}
                          isApplied={enhancement.milestonesApplied}
                          isApplying={enhancement.isApplyingMilestones}
                          onApply={enhancement.applyMilestones}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}

            {/* Already Enhanced Notice */}
            {letter.ai_enhanced && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium">AI Enhancement</span>
                  <Badge variant="secondary">Already Enhanced</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This letter has been enhanced with AI. Each letter can only be enhanced once to maintain authenticity.
                </p>
              </div>
            )}

            {/* Send Date */}
            <div>
              <Label htmlFor="edit-send-date">Send Date *</Label>
              <div className="relative mt-1">
                <Input
                  id="edit-send-date"
                  type="date"
                  value={formData.sendDate}
                  onChange={(e) => updateFormData('sendDate', e.target.value)}
                  disabled={!canEditSendDate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {!canEditSendDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Send date cannot be changed (letter is locked or already sent)
                </p>
              )}
            </div>

            {/* Voice Memo */}
            <VoiceMemoSection
              isRecording={isRecording}
              isLocked={letter.is_locked}
              hasVoiceMemo={!!letter.voice_memo_url}
              onToggleRecording={toggleRecording}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
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
                disabled={isSubmitting || letter.is_locked}
                className="min-w-[120px]"
              >
                {isSubmitting ? "Updating..." : "Update Letter"}
              </Button>
            </div>

            {letter.is_locked && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                This letter is locked and cannot be edited (within 48 hours of send date)
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditLetterForm;