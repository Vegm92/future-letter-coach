/**
 * AUTH PAGE STUB
 * 
 * This is a temporary stub to make the app loadable.
 */

import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export function AuthPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8">Future Letter Coach</h1>
      <p className="text-center mb-8 max-w-md">
        Write letters to your future self and track your progress towards your goals.
      </p>
      <Button 
        size="lg"
        onClick={async () => {
          await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin + '/dashboard'
            }
          });
        }}
      >
        Sign in with Google
      </Button>
    </div>
  );
}
