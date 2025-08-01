import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import HeroSection from "@/components/HeroSection";
import AuthForm from "@/components/AuthForm";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/components/Dashboard";
import LettersView from "@/components/LettersView";
import CreateLetterForm from "@/components/CreateLetterForm";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'letters'>('dashboard');

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
    setCurrentView('letters');
    // Refresh will happen automatically in the LettersView component
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
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar 
            user={user} 
            onCreateClick={() => setShowCreateForm(true)} 
          />
          
          <div className="flex-1 flex flex-col">
            <header className="h-12 flex items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
              <SidebarTrigger className="ml-4" />
              <div className="flex-1" />
            </header>
            
            <main className="flex-1 overflow-auto">
              {currentView === 'dashboard' ? (
                <Dashboard 
                  onCreateClick={() => setShowCreateForm(true)}
                  onViewAllLetters={() => setCurrentView('letters')}
                />
              ) : (
                <LettersView onCreateClick={() => setShowCreateForm(true)} />
              )}
            </main>
          </div>
          
          {showCreateForm && (
            <CreateLetterForm
              onClose={() => setShowCreateForm(false)}
              onSuccess={handleCreateSuccess}
            />
          )}
        </div>
      </SidebarProvider>
    );
  }

  return <HeroSection onGetStarted={handleGetStarted} />;
};

export default Index;
