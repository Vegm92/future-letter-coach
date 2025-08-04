import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Calendar, Target, Mic, MicOff, Send, Plus, Trash2, Sparkles, ChevronDown, ChevronUp, AlertCircle, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSmartEnhancement } from "@/hooks/useSmartEnhancement";
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
  
  const { toast } = useToast();

  const enhancement = useSmartEnhancement({
    title: formData.title,
    goal: formData.goal,
    content: formData.content,
    send_date: formData.send_date,
    onApplyField: (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    },
    onApplyMilestones: (suggestedMilestones) => {
      setMilestones(suggestedMilestones.map(milestone => ({
        title: milestone.title,
        percentage: milestone.percentage,
        target_date: milestone.target_date,
        description: milestone.description
      })));
      setShowMilestones(true);
    }
  });

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
        ai_enhanced: enhancement.state === 'success',
        ai_enhanced_goal: enhancement.state === 'success' ? formData.goal : null,
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
              {enhancement.data && enhancement.hasEnhancementData && (
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
                            disabled={enhancement.appliedFields.size === 3 && enhancement.milestonesApplied}
                          >
                            {enhancement.appliedFields.size === 3 && enhancement.milestonesApplied 
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
                            placeholder="e.g., Complete first month"
                            value={milestone.title}
                            onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`milestone-percentage-${index}`}>Percentage</Label>
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
                      
                      <div className="space-y-2">
                        <Label htmlFor={`milestone-date-${index}`}>Target Date</Label>
                        <Input
                          id={`milestone-date-${index}`}
                          type="date"
                          value={milestone.target_date}
                          onChange={(e) => updateMilestone(index, 'target_date', e.target.value)}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`milestone-description-${index}`}>Description (Optional)</Label>
                        <Textarea
                          id={`milestone-description-${index}`}
                          placeholder="Describe what success looks like..."
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          className="min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMilestone}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>
              )}
            </div>

            {/* Voice Memo */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
              <div>
                <Label className="font-medium">Voice Memo (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Record a personal message to your future self
                </p>
              </div>
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
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
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create Letter
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateLetterForm;