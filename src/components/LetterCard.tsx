import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Target, Clock, Edit, Play, Pause, Send, Bell, Trash2 } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { useState } from "react";

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
  milestones?: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  percentage: number;
  completed: boolean;
  target_date: string;
}


interface LetterCardProps {
  letter: Letter;
  onEdit: (letter: Letter) => void;
  onPlay?: (url: string) => void;
  onView: (letter: Letter) => void;
  onTriggerDelivery?: (letter: Letter) => void;
  onStatusChange?: (letter: Letter, newStatus: string) => void;
  onDelete?: (letter: Letter) => void;
}

const LetterCard = ({ letter, onEdit, onPlay, onView, onTriggerDelivery, onStatusChange, onDelete }: LetterCardProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  const getDeliveryButtonText = (status: string) => {
    switch (status) {
      case 'draft': return 'Schedule';
      case 'scheduled': return 'Send Now';
      default: return null;
    }
  };

  const getDeliveryIcon = (status: string) => {
    switch (status) {
      case 'draft': return Bell;
      case 'scheduled': return Send;
      default: return Send;
    }
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 cursor-pointer animate-fade-in"
      onClick={() => onView(letter)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
            {letter.title}
          </CardTitle>
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogTrigger asChild>
              <Badge 
                variant={getStatusColor(letter.status) as any}
                className={`shrink-0 ml-2 ${letter.status === 'sent' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={(e) => {
                  if (letter.status === 'sent') {
                    e.stopPropagation();
                    setShowConfirmDialog(true);
                  }
                }}
              >
                {getStatusLabel(letter.status)}
              </Badge>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change Letter Status</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to change the status from "Delivered" to "Scheduled"? 
                  This will allow you to schedule the letter for delivery again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onStatusChange?.(letter, 'scheduled');
                    setShowConfirmDialog(false);
                  }}
                >
                  Change to Scheduled
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{format(parseISO(letter.send_date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Target className="h-4 w-4" />
            <span>Goal Progress</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2 text-foreground">Goal:</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {letter.ai_enhanced_goal || letter.goal}
          </p>
        </div>
        
        {letter.milestones && letter.milestones.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{overallProgress}%</span>
            </div>
            <Progress 
              value={overallProgress} 
              variant={overallProgress === 100 ? "success" : "primary"}
              className="h-2"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            {letter.voice_memo_url && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.(letter.voice_memo_url!);
                }}
                className="h-8 px-2"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              Created {format(parseISO(letter.created_at), 'MMM d')}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {getDeliveryButtonText(letter.status) && onTriggerDelivery && (
              <Button 
                variant={letter.status === 'draft' ? 'secondary' : 'default'} 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerDelivery(letter);
                }}
                className="h-8"
              >
                {(() => {
                  const IconComponent = getDeliveryIcon(letter.status);
                  return <IconComponent className="h-3 w-3 mr-1" />;
                })()}
                {getDeliveryButtonText(letter.status)}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(letter);
              }}
              disabled={letter.is_locked}
              className="h-8"
            >
              <Edit className="h-3 w-3 mr-1" />
              {letter.is_locked ? 'Locked' : 'Edit'}
            </Button>
            
            {onDelete && (
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="h-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Letter</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{letter.title}"? This action cannot be undone and will also delete all associated milestones and progress data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onDelete(letter);
                        setShowDeleteDialog(false);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Letter
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LetterCard;