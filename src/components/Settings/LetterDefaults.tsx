import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { DEFAULT_SETTINGS } from "@/lib/settings/constants";
import { formatSendDateOffset, createLocalChangeTracker } from "@/lib/settings/utils";

const LetterDefaults = () => {
  const { profile, saving, updateProfile } = useProfile();
  const [localChanges, setLocalChanges] = useState<{
    default_send_date_offset?: number;
    default_letter_template?: string;
    default_goal_format?: string;
  }>({});
  
  const tracker = createLocalChangeTracker<typeof localChanges>();

  const handleSave = async () => {
    if (tracker.hasChanges(localChanges as any)) {
      await updateProfile(localChanges);
      setLocalChanges({});
    }
  };

  const getDisplayValue = <T extends keyof typeof localChanges>(field: T): any => {
    return tracker.getDisplayValue(field, localChanges, profile, 
      field === 'default_send_date_offset' ? DEFAULT_SETTINGS.SEND_DATE_OFFSET : '');
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
              value={getDisplayValue('default_send_date_offset') || DEFAULT_SETTINGS.SEND_DATE_OFFSET}
              onChange={(e) => setLocalChanges(prev => ({ 
                ...prev, 
                default_send_date_offset: parseInt(e.target.value) || DEFAULT_SETTINGS.SEND_DATE_OFFSET
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
            placeholder={DEFAULT_SETTINGS.LETTER_TEMPLATE}
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
            placeholder={DEFAULT_SETTINGS.GOAL_FORMAT}
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
          disabled={saving || !tracker.hasChanges(localChanges as any)}
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