import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const LetterDefaults = () => {
  const { profile, saving, updateProfile } = useProfile();
  const [localChanges, setLocalChanges] = useState<{
    default_send_date_offset?: number;
    default_letter_template?: string;
    default_goal_format?: string;
  }>({});

  const handleSave = async () => {
    if (Object.keys(localChanges).length > 0) {
      await updateProfile(localChanges);
      setLocalChanges({});
    }
  };

  const getDisplayValue = <T extends keyof typeof localChanges>(field: T): any => {
    return localChanges[field] ?? profile?.[field] ?? '';
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Send Date Offset */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="send_date_offset">Default Send Date</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="send_date_offset"
              type="number"
              min="1"
              max="3650"
              value={getDisplayValue('default_send_date_offset') || 180}
              onChange={(e) => setLocalChanges(prev => ({ 
                ...prev, 
                default_send_date_offset: parseInt(e.target.value) || 180 
              }))}
              className="w-24"
            />
            <Select value="days" disabled>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">days</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">from today</span>
          </div>
          <p className="text-sm text-muted-foreground">
            How far in the future should new letters be scheduled by default?
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="letter_template">Default Letter Template</Label>
          <Textarea
            id="letter_template"
            rows={6}
            value={getDisplayValue('default_letter_template')}
            onChange={(e) => setLocalChanges(prev => ({ 
              ...prev, 
              default_letter_template: e.target.value 
            }))}
            placeholder="Dear Future Me,&#10;&#10;As I write this today...&#10;&#10;Looking back, I hope..."
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            This text will pre-fill the content field when creating new letters.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="goal_format">Default Goal Format</Label>
          <Textarea
            id="goal_format"
            rows={4}
            value={getDisplayValue('default_goal_format')}
            onChange={(e) => setLocalChanges(prev => ({ 
              ...prev, 
              default_goal_format: e.target.value 
            }))}
            placeholder="By the time you read this, I will have...&#10;&#10;My main focus areas are:&#10;1. &#10;2. &#10;3. "
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            This structure will help guide your goal-setting when creating letters.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving || Object.keys(localChanges).length === 0}
          className="flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default LetterDefaults;