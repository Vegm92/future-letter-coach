import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, X, Sparkles, Mic, MicOff, ChevronDown, ChevronUp, AlertCircle, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { useSmartEnhancement } from "@/hooks/useSmartEnhancement";

import type { Letter } from '@/types/database';
import type { EditLetterFormProps } from '@/types/components';

const EditLetterForm = ({ letter, onClose, onSuccess }: EditLetterFormProps) => {
  const [title, setTitle] = useState(letter.title);
  const [content, setContent] = useState(letter.content);
  const [goal, setGoal] = useState(letter.goal);
  const [sendDate, setSendDate] = useState(format(parseISO(letter.send_date), 'yyyy-MM-dd'));
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const enhancement = useSmartEnhancement({
    title,
    goal,
    content,
    send_date: sendDate,
    onApplyField: (field, value) => {
      switch (field) {
        case 'title':
          setTitle(value);
          break;
        case 'goal':
          setGoal(value);
          break;
        case 'content':
          setContent(value);
          break;
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !goal.trim() || !sendDate) {
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
        title: title.trim(),
        content: content.trim(),
        goal: goal.trim(),
        send_date: sendDate,
        ai_enhanced: letter.ai_enhanced || enhancement.state === 'success',
        ...(enhancement.state === 'success' && { ai_enhanced_goal: goal }),
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
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
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={letter.is_locked}
                className="resize-none h-32 mt-1"
              />
            </div>

            {/* AI Enhancement Section */}
            {canEnhance && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <Label className="text-base font-medium">AI Enhancement</Label>
                    {enhancement.state === 'success' && <Badge variant="secondary">Enhanced</Badge>}
                  </div>
                  <Button
                    type="button"
                    onClick={enhancement.enhance}
                    disabled={!enhancement.canEnhance}
                    variant="outline"
                    size="sm"
                  >
                    {enhancement.state === 'loading' ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                </div>

                {/* Enhancement Error */}
                {enhancement.state === 'error' && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <p className="text-sm text-destructive">Enhancement failed. Please try again.</p>
                      </div>
                      <Button onClick={enhancement.retry} size="sm" variant="outline">
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
                
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
                        
                        {/* Enhanced Title */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              Enhanced Title
                              {enhancement.appliedFields.has('title') && <Check className="h-3 w-3 text-green-500" />}
                            </Label>
                            <Button
                              onClick={() => enhancement.applyField('title')}
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              disabled={enhancement.appliedFields.has('title') || enhancement.loadingFields.has('title')}
                            >
                              {enhancement.loadingFields.has('title') ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Applying...
                                </>
                              ) : enhancement.appliedFields.has('title') ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Applied
                                </>
                              ) : (
                                'Apply'
                              )}
                            </Button>
                          </div>
                          <p className="text-sm bg-background p-2 rounded border">{enhancement.data.enhancedLetter.title}</p>
                        </div>

                        {/* Enhanced Goal */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              Enhanced Goal
                              {enhancement.appliedFields.has('goal') && <Check className="h-3 w-3 text-green-500" />}
                            </Label>
                            <Button
                              onClick={() => enhancement.applyField('goal')}
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              disabled={enhancement.appliedFields.has('goal') || enhancement.loadingFields.has('goal')}
                            >
                              {enhancement.loadingFields.has('goal') ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Applying...
                                </>
                              ) : enhancement.appliedFields.has('goal') ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Applied
                                </>
                              ) : (
                                'Apply'
                              )}
                            </Button>
                          </div>
                          <p className="text-sm bg-background p-2 rounded border">{enhancement.data.enhancedLetter.goal}</p>
                        </div>

                        {/* Enhanced Content */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              Enhanced Content
                              {enhancement.appliedFields.has('content') && <Check className="h-3 w-3 text-green-500" />}
                            </Label>
                            <Button
                              onClick={() => enhancement.applyField('content')}
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              disabled={enhancement.appliedFields.has('content') || enhancement.loadingFields.has('content')}
                            >
                              {enhancement.loadingFields.has('content') ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Applying...
                                </>
                              ) : enhancement.appliedFields.has('content') ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Applied
                                </>
                              ) : (
                                'Apply'
                              )}
                            </Button>
                          </div>
                          <div className="text-sm bg-background p-2 rounded border max-h-32 overflow-y-auto">
                            {enhancement.data.enhancedLetter.content}
                          </div>
                        </div>

                        {/* Suggested Milestones */}
                        {enhancement.data.suggestedMilestones && enhancement.data.suggestedMilestones.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                Suggested Milestones ({enhancement.data.suggestedMilestones.length})
                                {enhancement.milestonesApplied && <Check className="h-3 w-3 text-green-500" />}
                              </Label>
                              <Button
                                onClick={enhancement.applyMilestones}
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                disabled={enhancement.milestonesApplied || enhancement.isApplyingMilestones}
                              >
                                {enhancement.isApplyingMilestones ? (
                                  <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Applying...
                                  </>
                                ) : enhancement.milestonesApplied ? (
                                  <>
                                    <Check className="h-3 w-3 mr-1" />
                                    Applied
                                  </>
                                ) : (
                                  'Apply Milestones'
                                )}
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {enhancement.data.suggestedMilestones.map((milestone, index) => (
                                <div key={index} className="text-xs bg-background p-2 rounded border">
                                  <div className="font-medium">{milestone.title}</div>
                                  <div className="text-muted-foreground">{milestone.description}</div>
                                  <div className="text-muted-foreground">Target: {new Date(milestone.target_date).toLocaleDateString()}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
                  value={sendDate}
                  onChange={(e) => setSendDate(e.target.value)}
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
            <div>
              <div className="flex items-center justify-between">
                <Label>Voice Memo (Optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleRecording}
                  disabled={letter.is_locked}
                  className="h-8 px-2"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-3 w-3 mr-1" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3 mr-1" />
                      Record Voice Memo
                    </>
                  )}
                </Button>
              </div>
              {letter.voice_memo_url && (
                <p className="text-xs text-muted-foreground mt-1">
                  Voice memo attached to this letter
                </p>
              )}
            </div>

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