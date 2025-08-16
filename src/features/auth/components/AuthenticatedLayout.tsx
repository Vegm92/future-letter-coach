import { useState, useEffect } from "react";
import { supabase } from "@/shared/config/client";
import { User } from "@supabase/supabase-js";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { CreateLetterForm } from "@/features/letters";

const AuthenticatedLayout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/');
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate('/');
      }
    });

    // Listen for custom create form events
    const handleOpenCreateForm = () => setShowCreateForm(true);
    window.addEventListener('openCreateForm', handleOpenCreateForm);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('openCreateForm', handleOpenCreateForm);
    };
  }, [navigate]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    navigate('/letters');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/letters':
        return 'Your Letters';
      case '/settings':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to home
  }

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
            <div className="flex-1 px-4">
              <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            <Outlet />
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
};

export default AuthenticatedLayout;