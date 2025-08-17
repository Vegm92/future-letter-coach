/**
 * SIMPLIFIED LETTER CARD
 * 
 * Clean, focused component that displays letter info.
 * No complex state management, just pure presentation + callbacks.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Target,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Send,
  Clock,
  CheckCircle,
  Archive,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import type { Letter, LetterCardProps } from '../lib/types';

export function LetterCard({ 
  letter, 
  onView, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: LetterCardProps) {
  
  const daysUntilSend = differenceInDays(parseISO(letter.send_date), new Date());
  const isOverdue = daysUntilSend < 0 && letter.status === 'scheduled';
  
  // Calculate progress from milestones
  const totalMilestones = letter.milestones?.length || 0;
  const completedMilestones = letter.milestones?.filter(m => m.completed).length || 0;
  const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const getStatusInfo = () => {
    switch (letter.status) {
      case 'draft':
        return {
          color: 'secondary' as const,
          label: 'Draft',
          icon: <Edit className="h-3 w-3" />,
        };
      case 'scheduled':
        return {
          color: isOverdue ? 'destructive' as const : 'default' as const,
          label: isOverdue ? `${Math.abs(daysUntilSend)} days overdue` : `${daysUntilSend} days left`,
          icon: <Clock className="h-3 w-3" />,
        };
      case 'sent':
        return {
          color: 'default' as const,
          label: 'Delivered',
          icon: <CheckCircle className="h-3 w-3" />,
        };
      case 'archived':
        return {
          color: 'outline' as const,
          label: 'Archived',
          icon: <Archive className="h-3 w-3" />,
        };
      default:
        return {
          color: 'secondary' as const,
          label: letter.status,
          icon: <Target className="h-3 w-3" />,
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleStatusChange = (newStatus: Letter['status']) => {
    onStatusChange(letter, newStatus);
  };

  return (
    <Card className="transition-all hover:shadow-md cursor-pointer group">
      {/* Card Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle 
              className="text-base font-semibold truncate group-hover:text-primary transition-colors"
              onClick={() => onView(letter)}
            >
              {letter.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusInfo.color} className="text-xs">
                {statusInfo.icon}
                <span className="ml-1">{statusInfo.label}</span>
              </Badge>
              {letter.ai_enhanced && (
                <Badge variant="outline" className="text-xs">
                  ✨ Enhanced
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView(letter)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(letter)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Letter
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              {letter.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleStatusChange('scheduled')}>
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule
                </DropdownMenuItem>
              )}
              
              {letter.status === 'scheduled' && (
                <DropdownMenuItem onClick={() => handleStatusChange('sent')}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </DropdownMenuItem>
              )}
              
              {letter.status !== 'archived' && (
                <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(letter)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Card Content */}
      <CardContent className="space-y-4" onClick={() => onView(letter)}>
        {/* Goal Preview */}
        <div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {letter.goal}
          </p>
        </div>

        {/* Progress Section */}
        {totalMilestones > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center text-xs text-muted-foreground">
              <Target className="h-3 w-3 mr-1" />
              <span>{completedMilestones} of {totalMilestones} milestones</span>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Send: {format(parseISO(letter.send_date), 'MMM d, yyyy')}</span>
          </div>
          <div>
            Created: {format(parseISO(letter.created_at), 'MMM d')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * COMPARISON TO OLD LETTERCARD:
 * 
 * OLD: Complex prop handling, inline state management, scattered logic
 * NEW: Simple props, clear presentation logic, consistent styling
 * 
 * OLD: Multiple different action handling patterns
 * NEW: Clean callback pattern with dropdown menu
 * 
 * OLD: Inconsistent status handling across components
 * NEW: Centralized status logic with clear visual feedback
 * 
 * OLD: Mixed concerns (presentation + business logic)
 * NEW: Pure presentation component
 */
