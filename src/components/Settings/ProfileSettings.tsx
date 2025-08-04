import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const ProfileSettings = () => {
  const { profile, saving, updateProfile } = useProfile();
  const [localChanges, setLocalChanges] = useState<{
    full_name?: string;
    timezone?: string;
  }>({});

  const timezones = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "British Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
  ];

  const handleSave = async () => {
    if (Object.keys(localChanges).length > 0) {
      await updateProfile(localChanges);
      setLocalChanges({});
    }
  };

  const getDisplayValue = (field: keyof typeof localChanges) => {
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
      {/* Avatar Section */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="text-lg">
            {profile.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
          </AvatarFallback>
        </Avatar>
        <div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Change Avatar
          </Button>
          <p className="text-sm text-muted-foreground mt-1">
            JPG, PNG or GIF. Max size 5MB.
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            value={getDisplayValue('full_name')}
            onChange={(e) => setLocalChanges(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Enter your full name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            Email cannot be changed here. Contact support if needed.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            value={getDisplayValue('timezone') || 'UTC'}
            onValueChange={(value) => setLocalChanges(prev => ({ ...prev, timezone: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

export default ProfileSettings;