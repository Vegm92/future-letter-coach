import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar, Target, Mic, MicOff, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";

interface CreateLetterFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateLetterForm = ({ onClose, onSuccess }: CreateLetterFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    goal: '',
    send_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  });
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);
  const [enhancedFormData, setEnhancedFormData] = useState<typeof formData | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleEnhanceLetter = async () => {
    const hasContent = formData.title.trim() || formData.goal.trim() || formData.content.trim();
    if (!hasContent) {
      toast({
        title: "Please enter some content first",
        description: "Fill in at least one field to enhance your letter.",
        variant: "destructive",
      });
      return;
    }

    // Store original content before enhancement
    setOriginalFormData({ ...formData });
    setIsEnhancing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('enhance-letter', {
        body: { 
          title: formData.title,
          goal: formData.goal,
          content: formData.content,
          send_date: formData.send_date
        }
      });

      if (error) throw error;
      
      // Auto-apply enhanced content
      if (data.enhancedLetter) {
        const enhanced = {
          ...formData,
          title: data.enhancedLetter.title,
          goal: data.enhancedLetter.goal,
          content: data.enhancedLetter.content,
        };
        setEnhancedFormData(enhanced);
        setFormData(enhanced);
        setIsEnhanced(true);
        
        toast({
          title: "Letter enhanced and applied!",
          description: "AI has improved your letter. Use 'Show Original' to revert if needed.",
        });
      }
    } catch (error) {
      console.error('Error enhancing letter:', error);
      toast({
        title: "Enhancement failed",
        description: "Please try again or continue without enhancement.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const toggleContent = () => {
    if (isEnhanced && originalFormData) {
      // Currently showing enhanced, switch to original
      setFormData({ ...originalFormData });
      setIsEnhanced(false);
      toast({
        title: "Showing original content",
        description: "Switched to your original version.",
      });
    } else if (!isEnhanced && enhancedFormData) {
      // Currently showing original, switch to enhanced
      setFormData({ ...enhancedFormData });
      setIsEnhanced(true);
      toast({
        title: "Showing enhanced content",
        description: "Switched to AI-enhanced version.",
      });
    }
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

      const { error } = await supabase.from('letters').insert({
        user_id: user.user.id,
        title: formData.title,
        content: formData.content,
        goal: formData.goal,
        ai_enhanced_goal: isEnhanced ? 'true' : null,
        send_date: formData.send_date,
        status: 'scheduled'
      });

      if (error) throw error;

      toast({
        title: "Letter created successfully!",
        description: "Your future self will receive this on the scheduled date.",
      });
      
      onSuccess();
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
            <div className="p-4 bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium">AI Enhancement</span>
                  {isEnhanced && (
                    <Badge variant="secondary" className="bg-success/10 text-success ml-2">
                      Enhanced
                    </Badge>
                  )}
                </div>
                <div className="flex space-x-2">
                  {originalFormData && enhancedFormData && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleContent}
                    >
                      Show {isEnhanced ? 'Original' : 'Enhanced'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEnhanceLetter}
                    disabled={isEnhancing}
                    className="shrink-0"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isEnhancing ? 'Enhancing...' : isEnhanced ? 'Re-enhance' : 'Enhance Letter'}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {isEnhanced 
                  ? "Your letter has been enhanced by AI. You can re-enhance or show the original version."
                  : "Let AI improve your letter's clarity, structure, and emotional impact."
                }
              </p>
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