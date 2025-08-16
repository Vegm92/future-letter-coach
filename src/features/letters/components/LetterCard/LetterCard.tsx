import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Target,
  Clock,
  Edit,
  Play,
  Pause,
  Send,
  Bell,
  Trash2,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { useState } from "react";

import type { Letter } from "@/shared/types/database";

interface LetterCardProps {
  letter: Letter;
  onEdit: (letter: Letter) => void;
  onDelete?: (letter: Letter) => void;
  onView: (letter: Letter) => void;
  onPlay?: (url: string) => void;
  onTriggerDelivery?: (letter: Letter) => void;
  onStatusChange?: (letter: Letter, status: Letter["status"]) => void;
}

const LetterCard = ({
  letter,
  onEdit,
  onPlay,
  onView,
  onTriggerDelivery,
  onStatusChange,
  onDelete,
}: LetterCardProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const daysUntilSend = differenceInDays(
    parseISO(letter.send_date),
    new Date()
  );
  const overallProgress = letter.milestones
    ? Math.round(
        (letter.milestones.filter((m) => m.completed).length /
          letter.milestones.length) *
          100
      )
    : 0;

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (status) {
      case "draft":
        return "secondary";
      case "scheduled":
        return "default";
      case "sent":
        return "success";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "scheduled":
        return `${daysUntilSend} days left`;
      case "sent":
        return "Delivered";
      case "archived":
        return "Archived";
      default:
        return status;
    }
  };

  const getDeliveryButtonText = (status: string) => {
    switch (status) {
      case "draft":
        return "Schedule";
      case "scheduled":
        return "Send Now";
      default:
        return null;
    }
  };

  const getDeliveryIcon = (status: string) => {
    switch (status) {
      case "draft":
        return Bell;
      case "scheduled":
        return Send;
      default:
        return Send;
    }
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 cursor-pointer animate-fade-in flex flex-col h-full"
      onClick={() => onView(letter)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
            {letter.title}
          </CardTitle>
          {letter.status === "sent" ? (
            <AlertDialog
              open={showConfirmDialog}
              onOpenChange={setShowConfirmDialog}
            >
              <AlertDialogTrigger asChild>
                <Badge
                  variant={getStatusColor(letter.status)}
                  className="shrink-0 ml-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConfirmDialog(true);
                  }}
                >
                  {getStatusLabel(letter.status)}
                </Badge>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change Letter Status</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to change the status from "Delivered" to
                    "Scheduled"? This will allow you to schedule the letter for
                    delivery again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onStatusChange?.(letter, "scheduled");
                      setShowConfirmDialog(false);
                    }}
                  >
                    Change to Scheduled
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Badge
              variant={getStatusColor(letter.status)}
              className="shrink-0 ml-2"
            >
              {getStatusLabel(letter.status)}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{format(parseISO(letter.send_date), "MMM d, yyyy")}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Target className="h-4 w-4" />
            <span>Goal Progress</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 flex flex-col flex-1">
        {/* Goal Section with better spacing */}
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-2 text-foreground">Goal:</h4>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {letter.ai_enhanced_goal || letter.goal}
          </p>
        </div>

        {/* Progress Section */}
        {letter.milestones && letter.milestones.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {overallProgress}%
              </span>
            </div>
            <Progress
              value={overallProgress}
              variant={overallProgress === 100 ? "success" : "primary"}
              className="h-2"
            />
          </div>
        )}

        {/* Primary Actions Row */}
        {getDeliveryButtonText(letter.status) && onTriggerDelivery && (
          <div className="flex justify-end">
            <Button
              variant={letter.status === "draft" ? "secondary" : "default"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onTriggerDelivery(letter);
              }}
              className="h-8"
            >
              {(() => {
                const IconComponent = getDeliveryIcon(letter.status);
                return <IconComponent className="h-3 w-3 mr-2" />;
              })()}
              {getDeliveryButtonText(letter.status)}
            </Button>
          </div>
        )}

        {/* Footer with metadata and secondary actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
          <div className="flex items-center space-x-3">
            {letter.voice_memo_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.(letter.voice_memo_url!);
                }}
                className="h-8 px-2 text-muted-foreground hover:text-primary"
                aria-label="Play voice memo"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              Created {format(parseISO(letter.created_at), "MMM d")}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(letter);
              }}
              disabled={letter.is_locked}
              className="h-8 px-2 text-muted-foreground hover:text-primary"
              aria-label="Edit letter"
            >
              <Edit className="h-3 w-3" />
            </Button>

            {onDelete && (
              <AlertDialog
                open={showDeleteDialog}
                onOpenChange={(open) => {
                  // Only allow closing the dialog, don't allow opening it again
                  if (!open) {
                    setShowDeleteDialog(false);
                  }
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="h-8 px-2 text-muted-foreground hover:text-destructive"
                    aria-label="Delete letter"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Letter</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{letter.title}"? This
                      action cannot be undone and will also delete all
                      associated milestones and progress data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.stopPropagation();
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
