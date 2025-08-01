import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, Target, Clock, Edit, Play, Pause } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

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
}

const LetterCard = ({ letter, onEdit, onPlay }: LetterCardProps) => {
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

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
            {letter.title}
          </CardTitle>
          <Badge 
            variant={getStatusColor(letter.status) as any}
            className="shrink-0 ml-2"
          >
            {getStatusLabel(letter.status)}
          </Badge>
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
                onClick={() => onPlay?.(letter.voice_memo_url!)}
                className="h-8 px-2"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              Created {format(parseISO(letter.created_at), 'MMM d')}
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(letter)}
            disabled={letter.is_locked}
            className="h-8"
          >
            <Edit className="h-3 w-3 mr-1" />
            {letter.is_locked ? 'Locked' : 'Edit'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LetterCard;