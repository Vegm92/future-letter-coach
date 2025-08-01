import { Construction } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

const Settings = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <CardTitle>Under Construction</CardTitle>
          <CardDescription>
            Settings page is currently being developed. Check back soon for configuration options.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Coming soon: Profile settings, notification preferences, and more.
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;