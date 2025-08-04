import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Globe, Type, Contrast } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { LANGUAGES, TEXT_SIZES, DEFAULT_SETTINGS } from "@/lib/settings/constants";
import { mergeAccessibilityPreferences } from "@/lib/settings/utils";

const AccessibilitySettings = () => {
  const { profile, saving, updateProfile } = useProfile();
  const [localChanges, setLocalChanges] = useState<{
    language?: string;
    accessibility_preferences?: {
      high_contrast: boolean;
      text_size: 'small' | 'normal' | 'large';
    };
  }>({});

  const currentAccessibility = localChanges.accessibility_preferences ?? 
    mergeAccessibilityPreferences(profile?.accessibility_preferences as any);

  const currentLanguage = localChanges.language ?? profile?.language ?? 'en';

  const handleSave = async () => {
    const changes: any = {};
    if (localChanges.language) changes.language = localChanges.language;
    if (localChanges.accessibility_preferences) changes.accessibility_preferences = localChanges.accessibility_preferences;
    
    if (Object.keys(changes).length > 0) {
      await updateProfile(changes);
      setLocalChanges({});
    }
  };

  const updateAccessibilityPrefs = (updates: Partial<typeof currentAccessibility>) => {
    setLocalChanges(prev => ({
      ...prev,
      accessibility_preferences: { ...currentAccessibility, ...updates }
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
      {/* Language Settings */}
      <div className="space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Language
        </Label>
        <p className="text-sm text-muted-foreground">
          Select your preferred language for the interface.
        </p>
        <Select
          value={currentLanguage}
          onValueChange={(language) => setLocalChanges(prev => ({ ...prev, language }))}
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem 
                key={lang.value} 
                value={lang.value}
                disabled={'disabled' in lang ? lang.disabled : false}
              >
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Visual Accessibility */}
      <div className="space-y-4">
        <h4 className="text-base font-medium flex items-center gap-2">
          <Contrast className="h-4 w-4" />
          Visual Accessibility
        </h4>
        
        {/* High Contrast Mode */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">High Contrast Mode</Label>
            <p className="text-sm text-muted-foreground">
              Increase contrast for better visibility and readability.
            </p>
          </div>
          <Switch
            checked={currentAccessibility.high_contrast}
            onCheckedChange={(high_contrast) => updateAccessibilityPrefs({ high_contrast })}
          />
        </div>

        {/* Text Size */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4" />
            Text Size
          </Label>
          <p className="text-sm text-muted-foreground">
            Adjust the size of text throughout the application.
          </p>
          <RadioGroup
            value={currentAccessibility.text_size}
            onValueChange={(text_size: typeof currentAccessibility.text_size) => 
              updateAccessibilityPrefs({ text_size })
            }
            className="flex space-x-6"
          >
            {TEXT_SIZES.map((size) => (
              <div key={size.value} className="flex items-center space-x-2">
                <RadioGroupItem value={size.value} id={size.value} />
                <Label htmlFor={size.value} className={`cursor-pointer ${size.className}`}>
                  {size.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-medium mb-2">Accessibility Features</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• All interactive elements support keyboard navigation</li>
          <li>• Screen reader compatible with proper ARIA labels</li>
          <li>• Color-blind friendly design with high contrast options</li>
          <li>• Scalable text and UI elements</li>
        </ul>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving || (Object.keys(localChanges).length === 0)}
          className="flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default AccessibilitySettings;