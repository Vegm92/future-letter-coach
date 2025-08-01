import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import HeroSection from "@/components/HeroSection";
import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";
import VisionVault from "@/components/VisionVault";
import CreateLetterForm from "@/components/CreateLetterForm";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
      setShowCreateForm(true);
    } else {
      setShowAuth(true);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    // Refresh the vault to show new letter
    window.location.reload();
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

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} onCreateClick={() => setShowCreateForm(true)} />
        <main className="container mx-auto px-4 py-8">
          <VisionVault onCreateClick={() => setShowCreateForm(true)} />
        </main>
        
        {showCreateForm && (
          <CreateLetterForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleCreateSuccess}
          />
        )}
      </div>
    );
  }

  return <HeroSection onGetStarted={handleGetStarted} />;
};

export default Index;
