import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, X, Sparkles, Mic, MicOff, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { useEnhanceLetterComplete } from "@/hooks/useEnhanceLetterComplete";

interface Letter {
  id: string;
  title: string;
  content: string;
  goal: string;
  send_date: string;
  status: 'draft' | 'scheduled' | 'sent' | 'archived';
  ai_enhanced_goal?: string;
  ai_enhanced?: boolean;
  voice_memo_url?: string;
  is_locked: boolean;
  created_at: string;
  personal_comments?: string;
}

interface EditLetterFormProps {
  letter: Letter;
  onClose: () => void;
  onSuccess: (updatedLetter: Letter) => void;
}

const EditLetterForm = ({ letter, onClose, onSuccess }: EditLetterFormProps) => {
  const [title, setTitle] = useState(letter.title);
  const [content, setContent] = useState(letter.content);
  const [goal, setGoal] = useState(letter.goal);
  const [sendDate, setSendDate] = useState(format(parseISO(letter.send_date), 'yyyy-MM-dd'));
  const [enhancedGoal, setEnhancedGoal] = useState(letter.ai_enhanced_goal || "");
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableEnhancement, setEnableEnhancement] = useState(false);
  const [showEnhancedLetter, setShowEnhancedLetter] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(letter.ai_enhanced || false);
  const { toast } = useToast();

  // Use the unified enhancement hook
  const { 
    data: enhancementData, 
    isLoading: isEnhancing, 
    error: enhancementError 
  } = useEnhanceLetterComplete({
    title,
    goal,
    content,
    send_date: sendDate,
    enabled: enableEnhancement && Boolean(goal?.trim())
  });

  // Update enhanced goal when data is received and show the enhanced letter section
  useEffect(() => {
    if (enhancementData?.enhancedLetter?.goal) {
      setEnhancedGoal(enhancementData.enhancedLetter.goal);
      setShowEnhancedLetter(true);
    }
  }, [enhancementData]);

  const handleEnhanceLetter = () => {
    if (!goal.trim() || !title.trim() || !content.trim()) {
      toast({
        title: "Complete letter required",
        description: "Please fill in title, goal, and content before enhancing.",
        variant: "destructive",
      });
      return;
    }

    setEnableEnhancement(true);
    toast({
      title: "Enhancing your letter...",
      description: "AI is creating an enhanced version with milestone suggestions.",
    });
  };

  const applyEnhancement = (field: 'title' | 'goal' | 'content') => {
    if (!enhancementData?.enhancedLetter) return;
    
    switch (field) {
      case 'title':
        setTitle(enhancementData.enhancedLetter.title);
        break;
      case 'goal':
        setGoal(enhancementData.enhancedLetter.goal);
        break;
      case 'content':
        setContent(enhancementData.enhancedLetter.content);
        break;
    }
    
    toast({
      title: "Enhancement applied",
      description: `Enhanced ${field} has been applied to your letter.`,
    });
  };

  const applyAllEnhancements = () => {
    if (!enhancementData?.enhancedLetter) return;
    
    setTitle(enhancementData.enhancedLetter.title);
    setGoal(enhancementData.enhancedLetter.goal);
    setContent(enhancementData.enhancedLetter.content);
    setAiEnhanced(true);
    
    toast({
      title: "All enhancements applied",
      description: "Your entire letter has been enhanced!",
    });
  };

  // Show enhancement error if it occurs
  useEffect(() => {
    if (enhancementError) {
      toast({
        title: "Enhancement failed",
        description: "Failed to enhance your goal. Please try again.",
        variant: "destructive",
      });
    }
  }, [enhancementError, toast]);

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
        ai_enhanced: aiEnhanced,
        ...(enhancedGoal && { ai_enhanced_goal: enhancedGoal }),
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

            {/* AI Enhancement Section */}
            {!aiEnhanced && (
              <div className="p-4 bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-medium">✨ AI Enhance Letter + Generate Milestones</span>
                    {enhancementData && (
                      <Badge variant="secondary" className="bg-success/10 text-success">
                        Enhanced
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="hero"
                    onClick={handleEnhanceLetter}
                    disabled={isEnhancing || !goal.trim() || !title.trim() || !content.trim() || letter.is_locked}
                    className="shrink-0"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isEnhancing ? 'Enhancing...' : enhancementData ? 'Re-enhance' : 'Enhance & Suggest'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {enhancementData 
                    ? `Letter enhanced with ${enhancementData.suggestedMilestones?.length || 0} milestone suggestions. Review and apply changes below.`
                    : "Get AI-powered improvements to your letter's clarity, structure, and emotional impact, plus personalized milestone suggestions."
                  }
                </p>
              </div>
            )}

            {aiEnhanced && (
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium">AI Enhancement</span>
                  <Badge variant="secondary">Letter Already Enhanced</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This letter has been enhanced with AI. Each letter can only be enhanced once to maintain authenticity.
                </p>
              </div>
            )}
              
              {!aiEnhanced && enhancementData?.enhancedLetter && (
                <Collapsible open={showEnhancedLetter} onOpenChange={setShowEnhancedLetter}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                      <span className="font-medium">View Enhanced Letter & Suggestions</span>
                      {showEnhancedLetter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-3">
                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={applyAllEnhancements}
                        className="mb-3"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Apply All Enhancements
                      </Button>
                    </div>
                    
                    {/* Enhanced Title */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground">ENHANCED TITLE</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => applyEnhancement('title')}
                          className="h-6 px-2 text-xs"
                        >
                          Apply
                        </Button>
                      </div>
                      <div className="p-2 bg-background border rounded text-sm">
                        {enhancementData.enhancedLetter.title}
                      </div>
                    </div>

                    {/* Enhanced Goal */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground">ENHANCED GOAL</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => applyEnhancement('goal')}
                          className="h-6 px-2 text-xs"
                        >
                          Apply
                        </Button>
                      </div>
                      <div className="p-2 bg-background border rounded text-sm">
                        {enhancementData.enhancedLetter.goal}
                      </div>
                    </div>

                    {/* Enhanced Content */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-muted-foreground">ENHANCED CONTENT</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => applyEnhancement('content')}
                          className="h-6 px-2 text-xs"
                        >
                          Apply
                        </Button>
                      </div>
                      <div className="p-2 bg-background border rounded text-sm max-h-32 overflow-y-auto">
                        {enhancementData.enhancedLetter.content}
                      </div>
                    </div>

                    {/* Milestone Count */}
                    {enhancementData.suggestedMilestones && enhancementData.suggestedMilestones.length > 0 && (
                      <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                        ✨ {enhancementData.suggestedMilestones.length} milestone suggestions generated and ready to view
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

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