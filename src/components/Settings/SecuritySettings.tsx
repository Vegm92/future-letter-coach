import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Shield, Key, Trash2, Eye, EyeOff, Users } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const SecuritySettings = () => {
  const { profile, saving, updateProfile } = useProfile();
  const [localChanges, setLocalChanges] = useState<{
    privacy_settings?: {
      letter_visibility: 'private' | 'shared' | 'public';
    };
  }>({});

  const currentPrivacy = localChanges.privacy_settings ?? profile?.privacy_settings ?? {
    letter_visibility: 'private' as const,
  };

  const handleSave = async () => {
    if (localChanges.privacy_settings) {
      await updateProfile(localChanges);
      setLocalChanges({});
    }
  };

  const updatePrivacySettings = (updates: Partial<typeof currentPrivacy>) => {
    setLocalChanges(prev => ({
      ...prev,
      privacy_settings: { ...currentPrivacy, ...updates }
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
      {/* Letter Visibility Settings */}
      <div className="space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Letter Visibility
        </Label>
        <p className="text-sm text-muted-foreground">
          Control who can see your letters and milestones.
        </p>
        <RadioGroup
          value={currentPrivacy.letter_visibility}
          onValueChange={(letter_visibility: typeof currentPrivacy.letter_visibility) => 
            updatePrivacySettings({ letter_visibility })
          }
          className="space-y-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private" id="private" />
            <Label htmlFor="private" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                <div>
                  <div className="font-medium">Private</div>
                  <div className="text-sm text-muted-foreground">Only you can see your letters</div>
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="shared" id="shared" />
            <Label htmlFor="shared" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <div>
                  <div className="font-medium">Shared</div>
                  <div className="text-sm text-muted-foreground">Visible to selected mentors or family</div>
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="public" />
            <Label htmlFor="public" className="cursor-pointer">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <div>
                  <div className="font-medium">Public</div>
                  <div className="text-sm text-muted-foreground">Anyone with link can view (anonymized)</div>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Security Actions */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Security Actions
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Change Password
              </Label>
              <p className="text-sm text-muted-foreground">
                Update your account password for better security.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
        
        <div className="border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-destructive flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your letters, milestones, and personal data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving || !localChanges.privacy_settings}
          className="flex items-center gap-2"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default SecuritySettings;