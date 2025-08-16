import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check, Edit, Lightbulb, Target, ChevronDown, ChevronUp, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/shared/config/client";
import { useToast } from "@/shared/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SuggestedMilestone, InlineMilestoneSuggestionsProps, MilestoneState } from "@/types";

const InlineMilestoneSuggestions = ({
  letterId,
  suggestedMilestones,
  onMilestonesAdded,
  onClose,
}: InlineMilestoneSuggestionsProps) => {
  const [milestones, setMilestones] = useState<MilestoneState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const { toast } = useToast();

  // Sync with props when suggestedMilestones change
  useEffect(() => {
    setMilestones(
      suggestedMilestones.map(m => ({ ...m, selected: true, editing: false }))
    );
  }, [suggestedMilestones]);

  const toggleSelection = (index: number) => {
    setMilestones(prev => prev.map((m, i) => 
      i === index ? { ...m, selected: !m.selected } : m
    ));
  };

  const toggleEditing = (index: number) => {
    setMilestones(prev => prev.map((m, i) => 
      i === index ? { ...m, editing: !m.editing } : m
    ));
  };

  const updateMilestone = (index: number, field: keyof SuggestedMilestone, value: string | number) => {
    setMilestones(prev => prev.map((m, i) => 
      i === index ? { ...m, [field]: value } : m
    ));
  };

  const selectAll = () => {
    setMilestones(prev => prev.map(m => ({ ...m, selected: true })));
  };

  const deselectAll = () => {
    setMilestones(prev => prev.map(m => ({ ...m, selected: false })));
  };

  const handleAddMilestones = async () => {
    const selectedMilestones = milestones.filter(m => m.selected);
    
    if (selectedMilestones.length === 0) {
      toast({
        title: "No milestones selected",
        description: "Please select at least one milestone to add.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const milestonesToInsert = selectedMilestones.map(milestone => ({
        letter_id: letterId,
        title: milestone.title,
        description: milestone.description,
        percentage: milestone.percentage,
        target_date: milestone.target_date,
        completed: false,
      }));

      const { error } = await supabase
        .from('milestones')
        .insert(milestonesToInsert);

      if (error) throw error;

      toast({
        title: "Milestones added!",
        description: `Successfully added ${selectedMilestones.length} milestone${selectedMilestones.length > 1 ? 's' : ''}.`,
      });

      onMilestonesAdded();
      onClose();
    } catch (error) {
      console.error('Error adding milestones:', error);
      toast({
        title: "Error adding milestones",
        description: "Failed to add milestones. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = milestones.filter(m => m.selected).length;

  if (milestones.length === 0) return null;

  return (
    <Card className="mt-6 border-dashed">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-base">AI Suggested Milestones</CardTitle>
              <Badge variant="secondary">{milestones.length} suggestions</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          <CardDescription>
            Based on your goal, here are milestone suggestions to help track progress.
          </CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Selection Controls */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {selectedCount} of {milestones.length} milestones selected
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            {/* Milestone Cards */}
            <div className="grid gap-3">
              {milestones.map((milestone, index) => (
                <Card key={index} className={`transition-all ${
                  milestone.selected ? 'ring-2 ring-primary' : 'opacity-70'
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={milestone.selected}
                          onCheckedChange={() => toggleSelection(index)}
                          className="mt-1"
                        />
                        <div className="space-y-1">
                          {milestone.editing ? (
                            <Input
                              value={milestone.title}
                              onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                              className="text-sm font-medium"
                            />
                          ) : (
                            <CardTitle className="text-sm">{milestone.title}</CardTitle>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {milestone.percentage}% Complete
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Target: {format(parseISO(milestone.target_date), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEditing(index)}
                        className="h-7 w-7 p-0"
                      >
                        {milestone.editing ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Edit className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {milestone.editing && (
                    <CardContent className="pt-0 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`percentage-${index}`} className="text-xs">Percentage</Label>
                          <Input
                            id={`percentage-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            value={milestone.percentage}
                            onChange={(e) => updateMilestone(index, 'percentage', parseInt(e.target.value))}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`date-${index}`} className="text-xs">Target Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full h-8 justify-start text-left font-normal text-xs">
                                <CalendarIcon className="mr-2 h-3 w-3" />
                                {format(parseISO(milestone.target_date), 'MMM dd, yyyy')}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={parseISO(milestone.target_date)}
                                onSelect={(date) => date && updateMilestone(index, 'target_date', format(date, 'yyyy-MM-dd'))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`description-${index}`} className="text-xs">Description</Label>
                        <Textarea
                          id={`description-${index}`}
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    </CardContent>
                  )}
                  {!milestone.editing && milestone.description && (
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs">{milestone.description}</CardDescription>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button variant="outline" size="sm" onClick={onClose}>
                Skip for Now
              </Button>
              <Button 
                size="sm"
                onClick={handleAddMilestones}
                disabled={selectedCount === 0 || isSubmitting}
              >
                {isSubmitting ? 'Adding...' : `Add ${selectedCount} Milestone${selectedCount > 1 ? 's' : ''}`}
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default InlineMilestoneSuggestions;