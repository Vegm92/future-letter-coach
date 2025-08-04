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
import { EnhancementSection } from "./EditLetterForm/EnhancementSection";
import { VoiceMemoSection } from "./EditLetterForm/VoiceMemoSection";
import { AlreadyEnhancedNotice } from "./EditLetterForm/AlreadyEnhancedNotice";
import { FormField } from "./EditLetterForm/FormField";

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

  // Helper render functions
  const renderFormFields = () => (
    <>
      <FormField
        id="edit-title"
        label="Letter Title"
        value={formData.title}
        placeholder="Give your letter a meaningful title..."
        disabled={letter.is_locked}
        onChange={(value) => updateFormData('title', value)}
        required
      />

      <FormField
        id="edit-goal"
        label="Your Goal"
        type="textarea"
        value={formData.goal}
        placeholder="What do you want to achieve?"
        disabled={letter.is_locked}
        onChange={(value) => updateFormData('goal', value)}
        required
        rows={3}
      />

      <FormField
        id="edit-content"
        label="Letter Content"
        type="textarea"
        value={formData.content}
        placeholder="Write your letter to your future self..."
        disabled={letter.is_locked}
        onChange={(value) => updateFormData('content', value)}
        required
        rows={5}
      />

      <FormField
        id="edit-send-date"
        label="Send Date"
        type="date"
        value={formData.sendDate}
        disabled={!canEditSendDate}
        onChange={(value) => updateFormData('sendDate', value)}
        required
        min={format(new Date(), 'yyyy-MM-dd')}
        helpText={!canEditSendDate ? "Send date cannot be changed (letter is locked or already sent)" : undefined}
      />
    </>
  );

  const renderEnhancementSection = () => (
    <>
      <EnhancementSection enhancement={enhancement} canEnhance={canEnhance} />
      {letter.ai_enhanced && <AlreadyEnhancedNotice />}
    </>
  );

  const renderFormActions = () => (
    <>
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
    </>
  );

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
            {renderFormFields()}
            
            {renderEnhancementSection()}

            <VoiceMemoSection
              isRecording={isRecording}
              isLocked={letter.is_locked}
              hasVoiceMemo={!!letter.voice_memo_url}
              onToggleRecording={toggleRecording}
            />

            {renderFormActions()}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditLetterForm;