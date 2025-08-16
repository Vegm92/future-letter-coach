import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles } from "lucide-react";
import { useProfile } from "@/features/settings/hooks/useProfile";
import { AI_TONES, DEFAULT_SETTINGS } from "@/features/settings/constants";
import { mergeAIPreferences } from "@/features/settings/utils";

const AIPreferences = () => {
  const { profile, saving, updateProfile } = useProfile();
  const [localChanges, setLocalChanges] = useState<{
    ai_preferences?: {
      enabled: boolean;
      tone: 'casual' | 'motivational' | 'professional' | 'formal';
      auto_apply: boolean;
    };
  }>({});

  const currentPrefs = localChanges.ai_preferences ?? 
    mergeAIPreferences(profile?.ai_preferences as any);

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
          {AI_TONES.map((tone) => (
            <div key={tone.value} className="flex items-center space-x-2">
              <RadioGroupItem value={tone.value} id={tone.value} />
              <Label htmlFor={tone.value} className="cursor-pointer">
                <div>
                  <div className="font-medium">{tone.label}</div>
                  <div className="text-sm text-muted-foreground">{tone.description}</div>
                </div>
              </Label>
            </div>
          ))}
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
