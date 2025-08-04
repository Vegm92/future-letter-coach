import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Smartphone } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const NotificationSettings = () => {
  const { profile, saving, updateProfile } = useProfile();
  const [localChanges, setLocalChanges] = useState<{
    notification_preferences?: {
      email: boolean;
      push: boolean;
      draft_reminders?: boolean;
      delivery_alerts?: boolean;
      enhancement_notifications?: boolean;
      milestone_reminders?: boolean;
    };
  }>({});

  const currentPrefs = localChanges.notification_preferences ?? profile?.notification_preferences ?? {
    email: true,
    push: false,
    draft_reminders: true,
    delivery_alerts: true,
    enhancement_notifications: true,
    milestone_reminders: true,
  };

  const handleSave = async () => {
    if (localChanges.notification_preferences) {
      await updateProfile(localChanges);
      setLocalChanges({});
    }
  };

  const updateNotificationPrefs = (updates: Partial<typeof currentPrefs>) => {
    setLocalChanges(prev => ({
      ...prev,
      notification_preferences: { ...currentPrefs, ...updates }
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
      {/* Global Notification Toggles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email.
            </p>
          </div>
          <Switch
            checked={currentPrefs.email}
            onCheckedChange={(email) => updateNotificationPrefs({ email })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications in your browser.
            </p>
          </div>
          <Switch
            checked={currentPrefs.push}
            onCheckedChange={(push) => updateNotificationPrefs({ push })}
          />
        </div>
      </div>

      <Separator />

      {/* Specific Notification Types */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Notification Types</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Draft Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Reminders about unsaved or incomplete letter drafts.
              </p>
            </div>
            <Switch
              checked={(currentPrefs as any).draft_reminders ?? true}
              onCheckedChange={(draft_reminders) => updateNotificationPrefs({ draft_reminders })}
              disabled={!currentPrefs.email && !currentPrefs.push}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Delivery Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Notifications when your letters are about to be or have been delivered.
              </p>
            </div>
            <Switch
              checked={(currentPrefs as any).delivery_alerts ?? true}
              onCheckedChange={(delivery_alerts) => updateNotificationPrefs({ delivery_alerts })}
              disabled={!currentPrefs.email && !currentPrefs.push}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">AI Enhancement Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Alerts when AI has finished enhancing your letters.
              </p>
            </div>
            <Switch
              checked={(currentPrefs as any).enhancement_notifications ?? true}
              onCheckedChange={(enhancement_notifications) => updateNotificationPrefs({ enhancement_notifications })}
              disabled={!currentPrefs.email && !currentPrefs.push}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Milestone Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Reminders about upcoming milestone deadlines.
              </p>
            </div>
            <Switch
              checked={(currentPrefs as any).milestone_reminders ?? true}
              onCheckedChange={(milestone_reminders) => updateNotificationPrefs({ milestone_reminders })}
              disabled={!currentPrefs.email && !currentPrefs.push}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving || !localChanges.notification_preferences}
          className="flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;