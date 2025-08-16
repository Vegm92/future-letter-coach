import { Button } from "@/components/ui/button";
import { User, PenTool, LogOut } from "lucide-react";
import { supabase } from "@/shared/config/client";
import { useToast } from "@/shared/hooks/use-toast";
import { HeaderProps } from "@/types";

const Header = ({ user, onCreateClick }: HeaderProps) => {
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "See you next time!",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PenTool className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            FutureLetter AI
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button onClick={onCreateClick} variant="hero" size="sm">
            Write Future Letter
          </Button>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user?.email}</span>
          </div>
          
          <Button onClick={handleSignOut} variant="ghost" size="sm">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;