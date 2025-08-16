import { useState, useEffect } from "react";
import { supabase } from "@/shared/config/client";
import { User } from "@supabase/supabase-js";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import { AuthForm } from "@/features/auth";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/features/dashboard";
import { CreateLetterForm } from "@/features/letters";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setShowAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setShowAuth(true);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    navigate('/letters');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showAuth && !user) {
    return <AuthForm onBack={() => setShowAuth(false)} />;
  }

  // If user is logged in, redirect to dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }

  return <HeroSection onGetStarted={handleGetStarted} />;
};

export default Index;
