import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar, Target, X, Lightbulb } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/shared/config/client";
import { useToast } from "@/shared/hooks/use-toast";
import { Milestone, MilestoneManagerProps } from "@/types";
import InlineMilestoneSuggestions from "./InlineMilestoneSuggestions";

const MilestoneManager = ({ letterId, milestones, onUpdate, letter }: MilestoneManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [percentage, setPercentage] = useState(25);
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [enhancementData, setEnhancementData] = useState<any>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  const openCreateForm = () => {
    setEditingMilestone(null);
    setIsCreating(true);
    setTitle("");
    setPercentage(25);
    setTargetDate("");
    setDescription("");
    setIsOpen(true);
  };

  const openEditForm = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setIsCreating(false);
    setTitle(milestone.title);
    setPercentage(milestone.percentage);
    setTargetDate(format(parseISO(milestone.target_date), 'yyyy-MM-dd'));
    setDescription(milestone.description || "");
    setIsOpen(true);
  };

  const closeForm = () => {
    setIsOpen(false);
    setEditingMilestone(null);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !targetDate) {
      toast({
        title: "Missing information",
        description: "Please fill in title and target date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreating) {
        // Create new milestone
        const { data, error } = await supabase
          .from('milestones')
          .insert({
            letter_id: letterId,
            title: title.trim(),
            percentage,
            target_date: targetDate,
            description: description.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;

        const newMilestones = [...milestones, data];
        onUpdate(newMilestones);
        
        toast({
          title: "Milestone created!",
          description: "New milestone has been added to your goal.",
        });
      } else if (editingMilestone) {
        // Update existing milestone
        const { data, error } = await supabase
          .from('milestones')
          .update({
            title: title.trim(),
            percentage,
            target_date: targetDate,
            description: description.trim() || null,
          })
          .eq('id', editingMilestone.id)
          .select()
          .single();

        if (error) throw error;

        const updatedMilestones = milestones.map(m => 
          m.id === editingMilestone.id ? data : m
        );
        onUpdate(updatedMilestones);
        
        toast({
          title: "Milestone updated!",
          description: "Milestone has been successfully updated.",
        });
      }

      closeForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save milestone. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (milestoneId: string) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;

    try {
      const { error } = await supabase
        .from('milestones')
        .delete()
        .eq('id', milestoneId);

      if (error) throw error;

      const updatedMilestones = milestones.filter(m => m.id !== milestoneId);
      onUpdate(updatedMilestones);
      
      toast({
        title: "Milestone deleted",
        description: "Milestone has been removed from your goal.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete milestone. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSuggestMilestones = async () => {
    if (!letter) {
      toast({
        title: "Cannot suggest milestones",
        description: "Letter data is not available.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingSuggestions(true);

    try {
      const { data, error } = await supabase.functions.invoke('enhance-letter-complete', {
        body: { 
          title: letter.title, 
          goal: letter.goal, 
          content: letter.content, 
          send_date: letter.send_date 
        }
      });

      if (error) throw error;

      setEnhancementData(data);
      setShowSuggestions(true);
      toast({
        title: "Milestones suggested!",
        description: "AI has generated milestone suggestions for your goal.",
      });
    } catch (error) {
      console.error('Error suggesting milestones:', error);
      toast({
        title: "Failed to generate suggestions",
        description: "Unable to generate milestone suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleMilestonesAdded = () => {
    // Refresh milestones by calling onUpdate with current milestones
    // This will trigger a re-fetch in the parent component
    setShowSuggestions(false);
    // In a real app, you'd typically refresh from the parent component
    // For now, we'll just close the dialog and let the parent handle refresh
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Milestones</h3>
        <div className="flex items-center gap-2">
          <Button onClick={openCreateForm} size="sm" className="h-8">
            <Plus className="h-3 w-3 mr-1" />
            Add Milestone
          </Button>
          {letter && (
            <Button 
              onClick={handleSuggestMilestones} 
              size="sm" 
              variant="outline" 
              className="h-8"
              disabled={isLoadingSuggestions}
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              {isLoadingSuggestions ? "AI Suggest" : "AI Suggest"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {milestones.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                No milestones yet. Break down your goal into smaller, achievable steps.
              </p>
              <Button onClick={openCreateForm} variant="outline" size="sm">
                <Plus className="h-3 w-3 mr-1" />
                Create First Milestone
              </Button>
            </CardContent>
          </Card>
        ) : (
          milestones
            .sort((a, b) => a.percentage - b.percentage)
            .map((milestone) => (
              <Card key={milestone.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className={`font-medium ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {milestone.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {milestone.percentage}%
                        </Badge>
                        {milestone.completed && (
                          <Badge variant="success" className="text-xs">
                            Completed
                          </Badge>
                        )}
                      </div>
                      
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {milestone.description}
                        </p>
                      )}
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Target: {format(parseISO(milestone.target_date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditForm(milestone)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(milestone.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Create/Edit Milestone Dialog */}
      <Dialog open={isOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Create New Milestone" : "Edit Milestone"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="milestone-title">Title *</Label>
              <Input
                id="milestone-title"
                placeholder="e.g., Complete first draft"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="milestone-percentage">Progress Percentage *</Label>
              <div className="flex items-center space-x-3 mt-1">
                <Input
                  id="milestone-percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  % of overall goal completion
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="milestone-date">Target Date *</Label>
              <Input
                id="milestone-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="milestone-description">Description (Optional)</Label>
              <Input
                id="milestone-description"
                placeholder="Additional details about this milestone..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? "Saving..." 
                  : isCreating 
                    ? "Create Milestone" 
                    : "Update Milestone"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Suggested Milestones Inline */}
      {showSuggestions && enhancementData?.suggestedMilestones && enhancementData.suggestedMilestones.length > 0 && (
        <InlineMilestoneSuggestions
          letterId={letterId}
          suggestedMilestones={enhancementData.suggestedMilestones}
          onMilestonesAdded={() => {
            onUpdate(milestones);
            setShowSuggestions(false);
          }}
          onClose={() => {
            setShowSuggestions(false);
          }}
        />
      )}
    </div>
  );
};

export default MilestoneManager;