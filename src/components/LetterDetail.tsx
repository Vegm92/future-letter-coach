import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Calendar, Target, Clock, Edit, X, Save, Play } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MilestoneManager from "./MilestoneManager";

interface Letter {
  id: string;
  title: string;
  content: string;
  goal: string;
  send_date: string;
  status: 'draft' | 'scheduled' | 'sent' | 'archived';
  ai_enhanced_goal?: string;
  voice_memo_url?: string;
  is_locked: boolean;
  created_at: string;
  personal_comments?: string;
  milestones?: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  percentage: number;
  completed: boolean;
  target_date: string;
}

interface LetterDetailProps {
  letter: Letter;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (letter: Letter) => void;
  onUpdate: (updatedLetter: Letter) => void;
  onPlay?: (url: string) => void;
}

const LetterDetail = ({ letter, isOpen, onClose, onEdit, onUpdate, onPlay }: LetterDetailProps) => {
  const [personalComments, setPersonalComments] = useState(letter.personal_comments || "");
  const [isSavingComments, setIsSavingComments] = useState(false);
  const { toast } = useToast();

  const daysUntilSend = differenceInDays(parseISO(letter.send_date), new Date());
  const overallProgress = letter.milestones 
    ? Math.round((letter.milestones.filter(m => m.completed).length / letter.milestones.length) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'scheduled': return 'default';
      case 'sent': return 'success';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'scheduled': return `${daysUntilSend} days left`;
      case 'sent': return 'Delivered';
      case 'archived': return 'Archived';
      default: return status;
    }
  };

  const handleSaveComments = async () => {
    if (personalComments === letter.personal_comments) return;

    setIsSavingComments(true);
    try {
      const { data, error } = await supabase
        .from('letters')
        .update({ personal_comments: personalComments })
        .eq('id', letter.id)
        .select()
        .single();

      if (error) throw error;

      onUpdate({ ...letter, personal_comments: personalComments });
      toast({
        title: "Comments saved",
        description: "Your personal comments have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error saving comments",
        description: "Failed to save your comments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingComments(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl font-bold leading-tight pr-4">
              {letter.title}
            </DialogTitle>
            <div className="flex items-center space-x-2 shrink-0">
              <Badge variant={getStatusColor(letter.status) as any}>
                {getStatusLabel(letter.status)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Letter Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Send Date: {format(parseISO(letter.send_date), 'MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Created: {format(parseISO(letter.created_at), 'MMMM d, yyyy')}</span>
            </div>
            {letter.voice_memo_url && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onPlay?.(letter.voice_memo_url!)}
                className="h-8 px-2"
              >
                <Play className="h-3 w-3 mr-1" />
                Voice Memo
              </Button>
            )}
          </div>

          <Separator />

          {/* Goal Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Goal
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Original Goal:</h4>
                <p className="text-sm bg-muted/50 p-3 rounded-md">{letter.goal}</p>
              </div>
              {letter.ai_enhanced_goal && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">AI Enhanced Goal:</h4>
                  <p className="text-sm bg-primary/10 p-3 rounded-md border border-primary/20">
                    {letter.ai_enhanced_goal}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Section */}
          {letter.milestones && letter.milestones.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Progress Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{overallProgress}%</span>
                </div>
                <Progress 
                  value={overallProgress} 
                  variant={overallProgress === 100 ? "success" : "primary"}
                  className="h-3"
                />
              </div>
            </div>
          )}

          {/* Milestone Management */}
          <div>
            <MilestoneManager
              letterId={letter.id}
              milestones={letter.milestones || []}
              onUpdate={(updatedMilestones) => {
                onUpdate({ ...letter, milestones: updatedMilestones });
              }}
            />
          </div>

          {/* Letter Content */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Letter Content</h3>
            <div className="bg-muted/30 p-4 rounded-md">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{letter.content}</p>
            </div>
          </div>

          {/* Personal Comments */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Personal Comments & Reflections</h3>
            <div className="space-y-3">
              <Textarea
                placeholder="Add your personal thoughts, reflections, or updates about this goal..."
                value={personalComments}
                onChange={(e) => setPersonalComments(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveComments}
                  disabled={isSavingComments || personalComments === letter.personal_comments}
                  size="sm"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {isSavingComments ? "Saving..." : "Save Comments"}
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={() => onEdit(letter)}
              disabled={letter.is_locked}
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>{letter.is_locked ? 'Locked' : 'Edit Letter'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LetterDetail;