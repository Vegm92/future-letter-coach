/**
 * SIMPLIFIED LETTER DETAIL
 * 
 * Clean modal component that displays full letter details.
 * No complex state management, just presentation + callbacks.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Target,
  Edit,
  Save,
  Loader2,
  Clock,
  CheckCircle,
  Archive,
  Trash2,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import type { Letter } from '../lib/types';

interface LetterDetailProps {
  letter: Letter;
  onEdit: (letter: Letter) => void;
  onDelete: (letter: Letter) => void;
  onUpdateComments: (letter: Letter, comments: string) => Promise<void>;
}

export function LetterDetail({ 
  letter, 
  onEdit, 
  onDelete, 
  onUpdateComments 
}: LetterDetailProps) {
  
  const [personalComments, setPersonalComments] = useState(letter.personal_comments || '');
  const [isSavingComments, setIsSavingComments] = useState(false);
  const [showOriginalTitle, setShowOriginalTitle] = useState(false);
  const [showOriginalGoal, setShowOriginalGoal] = useState(false);
  const [showOriginalContent, setShowOriginalContent] = useState(false);
  
  const daysUntilSend = differenceInDays(parseISO(letter.send_date), new Date());
  const totalMilestones = letter.milestones?.length || 0;
  const completedMilestones = letter.milestones?.filter(m => m.completed).length || 0;
  const overallProgress = totalMilestones > 0 
    ? Math.round((completedMilestones / totalMilestones) * 100) 
    : 0;

  const getStatusInfo = () => {
    const isOverdue = daysUntilSend < 0 && letter.status === 'scheduled';
    
    switch (letter.status) {
      case 'draft':
        return { color: 'secondary' as const, label: 'Draft', icon: <Edit className="h-4 w-4" /> };
      case 'scheduled':
        return { 
          color: isOverdue ? 'destructive' as const : 'default' as const,
          label: isOverdue ? `${Math.abs(daysUntilSend)} days overdue` : `${daysUntilSend} days left`,
          icon: <Clock className="h-4 w-4" />
        };
      case 'sent':
        return { color: 'default' as const, label: 'Delivered', icon: <CheckCircle className="h-4 w-4" /> };
      case 'archived':
        return { color: 'outline' as const, label: 'Archived', icon: <Archive className="h-4 w-4" /> };
      default:
        return { color: 'secondary' as const, label: letter.status, icon: <Target className="h-4 w-4" /> };
    }
  };

  const statusInfo = getStatusInfo();

  const handleSaveComments = async () => {
    if (personalComments === letter.personal_comments) return;
    
    setIsSavingComments(true);
    try {
      await onUpdateComments(letter, personalComments);
    } finally {
      setIsSavingComments(false);
    }
  };

  const hasEnhancement = letter.ai_enhanced && (
    letter.ai_enhanced_title || letter.ai_enhanced_goal || letter.ai_enhanced_content
  );

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold leading-tight">
                {hasEnhancement && letter.ai_enhanced_title && !showOriginalTitle
                  ? letter.ai_enhanced_title
                  : letter.title}
              </h1>
              {hasEnhancement && letter.ai_enhanced_title && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOriginalTitle(!showOriginalTitle)}
                  className="text-xs"
                >
                  {showOriginalTitle ? 'Enhanced' : 'Original'}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.color}>
                {statusInfo.icon}
                <span className="ml-1">{statusInfo.label}</span>
              </Badge>
              {letter.ai_enhanced && (
                <Badge variant="outline">✨ Enhanced</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => onEdit(letter)} disabled={letter.is_locked}>
              <Edit className="h-4 w-4 mr-2" />
              {letter.is_locked ? 'Locked' : 'Edit'}
            </Button>
            <Button 
              onClick={() => onDelete(letter)}
              variant="outline"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Send: {format(parseISO(letter.send_date), 'MMMM d, yyyy')}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Created: {format(parseISO(letter.created_at), 'MMMM d, yyyy')}
          </div>
        </div>
      </div>

      <Separator />

      {/* Goal Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Goal
          </h2>
          {hasEnhancement && letter.ai_enhanced_goal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOriginalGoal(!showOriginalGoal)}
              className="text-xs"
            >
              Show {showOriginalGoal ? 'Enhanced' : 'Original'}
            </Button>
          )}
        </div>
        
        <div className={`p-4 rounded-lg ${
          hasEnhancement && letter.ai_enhanced_goal && !showOriginalGoal
            ? 'bg-primary/10 border border-primary/20'
            : 'bg-muted/50'
        }`}>
          <p className="text-sm leading-relaxed">
            {hasEnhancement && letter.ai_enhanced_goal && !showOriginalGoal
              ? letter.ai_enhanced_goal
              : letter.goal}
          </p>
        </div>
      </div>

      {/* Progress Section */}
      {totalMilestones > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Progress Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="text-sm text-muted-foreground">
              {completedMilestones} of {totalMilestones} milestones completed
            </div>
          </div>
        </div>
      )}

      {/* Letter Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Letter Content</h2>
          {hasEnhancement && letter.ai_enhanced_content && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOriginalContent(!showOriginalContent)}
              className="text-xs"
            >
              Show {showOriginalContent ? 'Enhanced' : 'Original'}
            </Button>
          )}
        </div>
        
        <div className={`p-4 rounded-lg ${
          hasEnhancement && letter.ai_enhanced_content && !showOriginalContent
            ? 'bg-primary/10 border border-primary/20'
            : 'bg-muted/30'
        }`}>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {hasEnhancement && letter.ai_enhanced_content && !showOriginalContent
              ? letter.ai_enhanced_content
              : letter.content}
          </p>
        </div>
      </div>

      {/* Personal Comments */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Personal Comments & Reflections</h2>
        <div className="space-y-3">
          <Label htmlFor="comments" className="sr-only">Personal Comments</Label>
          <Textarea
            id="comments"
            placeholder="Add your personal thoughts, reflections, or updates about this goal..."
            value={personalComments}
            onChange={(e) => setPersonalComments(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSaveComments}
              disabled={
                isSavingComments ||
                personalComments === letter.personal_comments
              }
              size="sm"
            >
              {isSavingComments ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Save Comments
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * COMPARISON TO OLD LETTERDETAIL:
 * 
 * OLD: 470+ lines with complex modal management, inline milestone editing
 * NEW: 250 lines focused on presentation and core functionality
 * 
 * OLD: Mixed concerns (modal state + content display + milestone management)
 * NEW: Pure content display with clear callbacks for actions
 * 
 * OLD: Complex enhancement toggle logic scattered throughout
 * NEW: Simple, consistent enhancement display pattern
 * 
 * OLD: Inline milestone management with separate component imports
 * NEW: Will delegate milestone management to parent or separate modal
 */
