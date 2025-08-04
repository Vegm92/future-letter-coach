import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const AIPreferences = () => {
  const { profile, saving, updateProfile } = useProfile();
  const [localChanges, setLocalChanges] = useState<{
    ai_preferences?: {
      enabled: boolean;
      tone: 'casual' | 'motivational' | 'professional' | 'formal';
      auto_apply: boolean;
    };
  }>({});

  const currentPrefs = localChanges.ai_preferences ?? profile?.ai_preferences ?? {
    enabled: true,
    tone: 'motivational' as const,
    auto_apply: false,
  };

  const handleSave = async () => {
    if (localChanges.ai_preferences) {
      await updateProfile(localChanges);
      setLocalChanges({});
    }
  };

  const updateAIPrefs = (updates: Partial<typeof currentPrefs>) => {
    setLocalChanges(prev => ({
      ...prev,
      ai_preferences: { ...currentPrefs, ...updates }
    }));
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
      {/* AI Enhancement Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Enable AI Suggestions
          </Label>
          <p className="text-sm text-muted-foreground">
            Allow AI to enhance your letters with suggestions and improvements.
          </p>
        </div>
        <Switch
          checked={currentPrefs.enabled}
          onCheckedChange={(enabled) => updateAIPrefs({ enabled })}
        />
      </div>

      {/* AI Tone Settings */}
      <div className="space-y-3">
        <Label className="text-base font-medium">AI Tone & Style</Label>
        <p className="text-sm text-muted-foreground">
          Choose the tone that AI should use when enhancing your letters.
        </p>
        <RadioGroup
          value={currentPrefs.tone}
          onValueChange={(tone: typeof currentPrefs.tone) => updateAIPrefs({ tone })}
          disabled={!currentPrefs.enabled}
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="casual" id="casual" />
            <Label htmlFor="casual" className="cursor-pointer">
              <div>
                <div className="font-medium">Casual</div>
                <div className="text-sm text-muted-foreground">Friendly and relaxed</div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="motivational" id="motivational" />
            <Label htmlFor="motivational" className="cursor-pointer">
              <div>
                <div className="font-medium">Motivational</div>
                <div className="text-sm text-muted-foreground">Inspiring and uplifting</div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="professional" id="professional" />
            <Label htmlFor="professional" className="cursor-pointer">
              <div>
                <div className="font-medium">Professional</div>
                <div className="text-sm text-muted-foreground">Clear and focused</div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="formal" id="formal" />
            <Label htmlFor="formal" className="cursor-pointer">
              <div>
                <div className="font-medium">Formal</div>
                <div className="text-sm text-muted-foreground">Structured and formal</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Auto-apply Setting */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base font-medium">Auto-apply Enhanced Fields</Label>
          <p className="text-sm text-muted-foreground">
            Automatically apply AI suggestions without asking for confirmation.
          </p>
        </div>
        <Switch
          checked={currentPrefs.auto_apply}
          onCheckedChange={(auto_apply) => updateAIPrefs({ auto_apply })}
          disabled={!currentPrefs.enabled}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving || !localChanges.ai_preferences}
          className="flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default AIPreferences;