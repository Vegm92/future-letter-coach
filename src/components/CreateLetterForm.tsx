import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Target, Mic, MicOff, Send, Plus, Trash2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEnhanceLetterComplete } from "@/hooks/useEnhanceLetterComplete";
import { addDays, format } from "date-fns";

interface CreateLetterFormProps {
  onClose: () => void;
  onSuccess: (letterData?: any) => void;
}

interface Milestone {
  title: string;
  percentage: number;
  target_date: string;
  description: string;
}

const CreateLetterForm = ({ onClose, onSuccess }: CreateLetterFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    goal: '',
    send_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showMilestones, setShowMilestones] = useState(false);
  const [showEnhancement, setShowEnhancement] = useState(false);
  const [hasTriggeredEnhancement, setHasTriggeredEnhancement] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  
  const { toast } = useToast();

  // AI Enhancement hook
  const {
    data: enhancementData,
    isLoading: isEnhancing,
    error: enhancementError,
    refetch: triggerEnhancement,
    isSuccess: enhancementSuccess
  } = useEnhanceLetterComplete({
    title: formData.title,
    goal: formData.goal,
    content: formData.content,
    send_date: formData.send_date,
    enabled: false // Only run when explicitly triggered
  });

  // Auto-expand enhancement section when AI enhancement completes successfully
  useEffect(() => {
    if (enhancementSuccess && enhancementData && hasTriggeredEnhancement && !showEnhancement) {
      setShowEnhancement(true);
      toast({
        title: "✨ Letter Enhanced!",
        description: "Your letter has been enhanced with AI. Review the suggestions below.",
      });
    }
  }, [enhancementSuccess, enhancementData, hasTriggeredEnhancement, showEnhancement, toast]);

  const addMilestone = () => {
    const newMilestone: Milestone = {
      title: '',
      percentage: 25,
      target_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      description: ''
    };
    setMilestones([...milestones, newMilestone]);
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    const updated = milestones.map((milestone, i) => 
      i === index ? { ...milestone, [field]: value } : milestone
    );
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleEnhanceLetter = () => {
    if (!formData.goal.trim()) {
      toast({
        title: "Goal Required",
        description: "Please enter a goal before enhancing your letter.",
        variant: "destructive",
      });
      return;
    }
    setHasTriggeredEnhancement(true);
    triggerEnhancement();
  };

  const applyEnhancement = (field: 'title' | 'goal' | 'content') => {
    if (!enhancementData?.enhancedLetter) return;
    
    setFormData(prev => ({
      ...prev,
      [field]: enhancementData.enhancedLetter[field]
    }));
  };

  const applyAllEnhancements = () => {
    if (!enhancementData?.enhancedLetter) return;
    
    setFormData(prev => ({
      ...prev,
      title: enhancementData.enhancedLetter.title,
      goal: enhancementData.enhancedLetter.goal,
      content: enhancementData.enhancedLetter.content
    }));

    // Add suggested milestones if any
    if (enhancementData.suggestedMilestones?.length > 0) {
      setMilestones(enhancementData.suggestedMilestones);
    }

    setAiEnhanced(true);
    setShowEnhancement(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.goal.trim()) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Create the letter first
      const { data: letterData, error: letterError } = await supabase.from('letters').insert({
        user_id: user.user.id,
        title: formData.title,
        content: formData.content,
        goal: formData.goal,
        send_date: formData.send_date,
        status: 'scheduled',
        ai_enhanced: aiEnhanced,
        ai_enhanced_goal: aiEnhanced ? formData.goal : null,
        voice_memo_url: isRecording ? 'placeholder-url' : null,
      }).select().single();

      if (letterError) throw letterError;

      // Create milestones if any exist
      if (milestones.length > 0) {
        const milestonesToInsert = milestones
          .filter(m => m.title.trim()) // Only insert milestones with titles
          .map(milestone => ({
            letter_id: letterData.id,
            title: milestone.title,
            percentage: milestone.percentage,
            target_date: milestone.target_date,
            description: milestone.description || null,
            completed: false
          }));

        if (milestonesToInsert.length > 0) {
          const { error: milestoneError } = await supabase
            .from('milestones')
            .insert(milestonesToInsert);

          if (milestoneError) {
            console.error('Error creating milestones:', milestoneError);
            // Don't fail the whole operation, just warn
            toast({
              title: "Letter created, but milestone creation failed",
              description: "You can add milestones later from the letter details.",
              variant: "destructive",
            });
          }
        }
      }

      toast({
        title: "Letter created successfully!",
        description: milestones.length > 0 ? 
          "Your letter and milestones have been created." : 
          "Your future self will receive this on the scheduled date.",
      });
      
      onSuccess(letterData);
      onClose();
    } catch (error) {
      console.error('Error creating letter:', error);
      toast({
        title: "Failed to create letter",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording functionality would be implemented here
    toast({
      title: isRecording ? "Recording stopped" : "Recording started",
      description: isRecording ? "Voice memo saved" : "Start speaking your motivation",
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Write Your Future Letter
          </CardTitle>
          <p className="text-muted-foreground">
            Create a letter to your future self with a meaningful goal
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Letter Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., My Fitness Transformation Journey"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="send_date">Send Date *</Label>
                <Input
                  id="send_date"
                  type="date"
                  value={formData.send_date}
                  onChange={(e) => setFormData({ ...formData, send_date: e.target.value })}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Your Goal *</Label>
              <Textarea
                id="goal"
                placeholder="Describe what you want to achieve..."
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                className="min-h-[80px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Letter Content *</Label>
              <Textarea
                id="content"
                placeholder="Dear Future Me,&#10;&#10;I'm writing this letter to you with excitement about what we're going to achieve..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-[150px]"
                required
              />
            </div>

            {/* AI Enhancement Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <Label className="text-base font-medium">AI Enhancement</Label>
                  {aiEnhanced && <Badge variant="secondary">Enhanced</Badge>}
                </div>
                {!aiEnhanced && (
                  <Button
                    type="button"
                    onClick={handleEnhanceLetter}
                    disabled={isEnhancing || !formData.goal.trim()}
                    variant="outline"
                    size="sm"
                  >
                    {isEnhancing ? "Enhancing..." : "✨ AI Enhance Letter + Generate Milestones"}
                  </Button>
                )}
              </div>

              {enhancementError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                  Error: {enhancementError.message}
                </div>
              )}

              {hasTriggeredEnhancement && enhancementData && (
                <Collapsible open={showEnhancement} onOpenChange={setShowEnhancement}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0">
                      <span className="text-sm font-medium">View Enhanced Content</span>
                      {showEnhancement ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <div className="grid gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Enhanced Title</Label>
                          <Button
                            type="button"
                            onClick={() => applyEnhancement('title')}
                            variant="outline"
                            size="sm"
                          >
                            Apply
                          </Button>
                        </div>
                        <div className="text-sm p-3 bg-background border rounded">
                          {enhancementData.enhancedLetter.title}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Enhanced Goal</Label>
                          <Button
                            type="button"
                            onClick={() => applyEnhancement('goal')}
                            variant="outline"
                            size="sm"
                          >
                            Apply
                          </Button>
                        </div>
                        <div className="text-sm p-3 bg-background border rounded">
                          {enhancementData.enhancedLetter.goal}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Enhanced Content</Label>
                          <Button
                            type="button"
                            onClick={() => applyEnhancement('content')}
                            variant="outline"
                            size="sm"
                          >
                            Apply
                          </Button>
                        </div>
                        <div className="text-sm p-3 bg-background border rounded max-h-32 overflow-y-auto">
                          {enhancementData.enhancedLetter.content}
                        </div>
                      </div>

                      {enhancementData.suggestedMilestones?.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Suggested Milestones ({enhancementData.suggestedMilestones.length})
                          </Label>
                          <div className="text-xs text-muted-foreground">
                            Will be added when you apply all enhancements
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={applyAllEnhancements}
                          className="w-full"
                        >
                          Apply All Enhancements
                          {enhancementData.suggestedMilestones?.length > 0 && 
                            ` + Add ${enhancementData.suggestedMilestones.length} Milestones`
                          }
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>

            {/* Milestones Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-medium">Milestones (Optional)</span>
                  {milestones.length > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {milestones.length}
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMilestones(!showMilestones)}
                >
                  {showMilestones ? 'Hide' : 'Add'} Milestones
                </Button>
              </div>

              {showMilestones && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                  <p className="text-sm text-muted-foreground">
                    Break down your goal into smaller, measurable milestones to track your progress.
                  </p>
                  
                  {milestones.map((milestone, index) => (
                    <div key={index} className="p-3 bg-background rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Milestone {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMilestone(index)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`milestone-title-${index}`}>Title</Label>
                          <Input
                            id={`milestone-title-${index}`}
                            placeholder="e.g., Lose first 10 lbs"
                            value={milestone.title}
                            onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`milestone-percentage-${index}`}>Progress %</Label>
                          <Input
                            id={`milestone-percentage-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            value={milestone.percentage}
                            onChange={(e) => updateMilestone(index, 'percentage', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`milestone-date-${index}`}>Target Date</Label>
                          <Input
                            id={`milestone-date-${index}`}
                            type="date"
                            value={milestone.target_date}
                            onChange={(e) => updateMilestone(index, 'target_date', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`milestone-description-${index}`}>Description</Label>
                          <Input
                            id={`milestone-description-${index}`}
                            placeholder="Optional details..."
                            value={milestone.description}
                            onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMilestone}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add voice memo (optional)</span>
              </div>
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={toggleRecording}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isRecording ? 'Stop' : 'Record'}
              </Button>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" disabled={isSubmitting}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Letter'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateLetterForm;