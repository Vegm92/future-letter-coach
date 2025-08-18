/**
 * SMART MILESTONE MANAGER
 * 
 * Infers milestones from user's goal and content, then allows
 * manual refinement and addition of custom milestones.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Plus, 
  Loader2, 
  CheckCircle, 
  X, 
  Calendar,
  Lightbulb,
  Edit2,
  Trash2
} from 'lucide-react';
import { format, addDays, addMonths } from 'date-fns';
import { useEnhancement } from '../hooks/useEnhancement';

interface Milestone {
  id: string;
  text: string;
  dueDate: string;
  isInferred?: boolean;
  reasoning?: string;
}

interface MilestoneManagerProps {
  goal: string;
  content: string;
  title?: string;
  initialMilestones?: Milestone[];
  onChange: (milestones: Milestone[]) => void;
}

export function MilestoneManager({ 
  goal, 
  content, 
  title, 
  initialMilestones = [], 
  onChange 
}: MilestoneManagerProps) {
  const { inferMilestones, isInferringMilestones } = useEnhancement();
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [inferredSuggestions, setInferredSuggestions] = useState<any[]>([]);
  const [showInferred, setShowInferred] = useState(false);
  const [newMilestoneText, setNewMilestoneText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Auto-infer milestones when goal and content are substantial
  useEffect(() => {
    const shouldInfer = goal.trim().length > 20 && content.trim().length > 50;
    
    // Only suggest if:
    // 1. Content is substantial enough
    // 2. No existing milestones
    // 3. No previous suggestions shown
    // 4. Haven't already attempted inference
    if (shouldInfer && 
        milestones.length === 0 && 
        inferredSuggestions.length === 0 && 
        !showInferred) {
      handleInferMilestones();
    }
  }, [goal, content]);

  // Notify parent of changes
  useEffect(() => {
    onChange(milestones);
  }, [milestones, onChange]);

  const handleInferMilestones = async () => {
    if (!goal.trim() || !content.trim()) return;

    try {
      const response = await inferMilestones({ goal, content, title });
      setInferredSuggestions(response.suggestedMilestones);
      setShowInferred(true);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const addInferredMilestone = (suggestion: any) => {
    // Calculate a logical due date if not provided
    let dueDate = suggestion.dueDate;
    if (!dueDate) {
      // If no due date provided, spread milestones over time based on existing ones
      const existingDates = milestones.map(m => new Date(m.dueDate)).sort((a, b) => a.getTime() - b.getTime());
      const baseDate = existingDates.length > 0 ? existingDates[existingDates.length - 1] : new Date();
      const nextDate = addMonths(baseDate, Math.max(1, Math.floor(3 + milestones.length * 0.5)));
      dueDate = format(nextDate, 'yyyy-MM-dd');
    }
    
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      text: suggestion.text,
      dueDate,
      isInferred: true,
      reasoning: suggestion.reasoning,
    };

    setMilestones(prev => [...prev, newMilestone]);
    
    // Remove from suggestions
    setInferredSuggestions(prev => 
      prev.filter(s => s.text !== suggestion.text)
    );
  };

  const addManualMilestone = () => {
    if (!newMilestoneText.trim()) return;

    // Calculate a logical due date for manual milestones
    const existingDates = milestones.map(m => new Date(m.dueDate)).sort((a, b) => a.getTime() - b.getTime());
    const baseDate = existingDates.length > 0 ? existingDates[existingDates.length - 1] : new Date();
    const nextDate = addMonths(baseDate, Math.max(1, Math.floor(1 + milestones.length * 0.3)));
    
    const newMilestone: Milestone = {
      id: Date.now().toString(),
      text: newMilestoneText,
      dueDate: format(nextDate, 'yyyy-MM-dd'),
      isInferred: false,
    };

    setMilestones(prev => [...prev, newMilestone]);
    setNewMilestoneText('');
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones(prev =>
      prev.map(m => m.id === id ? { ...m, ...updates } : m)
    );
  };

  const deleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const startEditing = (milestone: Milestone) => {
    setEditingId(milestone.id);
    setEditingText(milestone.text);
  };

  const saveEdit = () => {
    if (editingId && editingText.trim()) {
      updateMilestone(editingId, { text: editingText.trim() });
    }
    setEditingId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const canInfer = goal.trim().length > 10 && content.trim().length > 20;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="font-medium">Milestones</span>
          {milestones.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Infer button - only show if no milestones exist and no suggestions pending */}
        {canInfer && milestones.length === 0 && !showInferred && (
          <Button
            type="button"
            onClick={handleInferMilestones}
            disabled={isInferringMilestones}
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
          >
            {isInferringMilestones ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Finding milestones...
              </>
            ) : (
              <>
                <Lightbulb className="h-3 w-3 mr-1" />
                Suggest milestones
              </>
            )}
          </Button>
        )}
        
        {/* Show re-suggest button if milestones exist but user wants new suggestions */}
        {canInfer && (milestones.length > 0 || (showInferred && inferredSuggestions.length === 0)) && (
          <Button
            type="button"
            onClick={() => {
              setInferredSuggestions([]);
              setShowInferred(false);
              handleInferMilestones();
            }}
            disabled={isInferringMilestones}
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs text-muted-foreground"
          >
            {isInferringMilestones ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Finding milestones...
              </>
            ) : (
              <>
                <Lightbulb className="h-3 w-3 mr-1" />
                Re-suggest
              </>
            )}
          </Button>
        )}
      </div>

      {/* Inferred Suggestions */}
      {showInferred && inferredSuggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 text-sm">
                Suggested Milestones
              </span>
              <Badge className="text-xs bg-blue-100 text-blue-700">
                AI Generated
              </Badge>
            </div>
            
            <div className="space-y-2">
              {inferredSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border border-blue-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {suggestion.text}
                    </p>
                    {suggestion.reasoning && (
                      <p className="text-xs text-gray-600 mt-1">
                        {suggestion.reasoning}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => addInferredMilestone(suggestion)}
                    size="sm"
                    className="h-6 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>

            {inferredSuggestions.length === 0 && (
              <p className="text-sm text-blue-700">
                All suggestions have been added! 🎯
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Milestones */}
      {milestones.length > 0 && (
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              <CheckCircle className="h-4 w-4 text-gray-400" />
              
              <div className="flex-1">
                {editingId === milestone.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="h-7 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                    />
                    <Button
                      type="button"
                      onClick={saveEdit}
                      size="sm"
                      className="h-6 px-2"
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      onClick={cancelEdit}
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      {milestone.text}
                      {milestone.isInferred && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          AI
                        </Badge>
                      )}
                    </p>
                    {milestone.reasoning && (
                      <p className="text-xs text-gray-500 mt-1">
                        {milestone.reasoning}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={milestone.dueDate}
                  onChange={(e) => updateMilestone(milestone.id, { dueDate: e.target.value })}
                  className="h-7 text-xs w-32"
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                />
                
                {editingId !== milestone.id && (
                  <>
                    <Button
                      type="button"
                      onClick={() => startEditing(milestone)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => deleteMilestone(milestone.id)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Manual Milestone */}
      <div className="flex items-center gap-2 p-3 border border-dashed rounded-lg">
        <Plus className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Add a custom milestone..."
          value={newMilestoneText}
          onChange={(e) => setNewMilestoneText(e.target.value)}
          className="h-8 text-sm border-0 bg-transparent"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addManualMilestone();
            }
          }}
        />
        {newMilestoneText.trim() && (
          <Button
            type="button"
            onClick={addManualMilestone}
            size="sm"
            className="h-7 px-3 text-xs"
          >
            Add
          </Button>
        )}
      </div>

      {milestones.length === 0 && !canInfer && (
        <div className="text-center py-4 text-sm text-gray-500">
          <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          Add some goals and content above to get milestone suggestions,
          <br />
          or create custom milestones manually.
        </div>
      )}
    </div>
  );
}
