import { useState, useEffect } from "react";
import { supabase } from '@/shared/config/client';
import { useToast } from "@/shared/hooks/use-toast";
import { AuthService } from '../services';
import type { SignUpRequest, SignInRequest, AuthFormData } from '../types';
import type { User, Session } from '@supabase/supabase-js';

// Create auth service instance
const authService = new AuthService();

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    authService.getCurrentSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (formData: AuthFormData) => {
    setIsAuthenticating(true);
    
    const signUpData: SignUpRequest = {
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
    };

    const result = await authService.signUp(signUpData);

    if (result.success) {
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });
    } else {
      toast({
        title: "Sign up failed",
        description: result.error,
        variant: "destructive",
      });
    }

    setIsAuthenticating(false);
    return result;
  };

  const signIn = async (formData: AuthFormData) => {
    setIsAuthenticating(true);
    
    const signInData: SignInRequest = {
      email: formData.email,
      password: formData.password,
    };

    const result = await authService.signIn(signInData);

    if (result.success) {
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
    } else {
      toast({
        title: "Sign in failed",
        description: result.error,
        variant: "destructive",
      });
    }

    setIsAuthenticating(false);
    return result;
  };

  const signInWithGoogle = async () => {
    const result = await authService.signInWithGoogle();

    if (!result.success) {
      toast({
        title: "Google sign in failed",
        description: result.error,
        variant: "destructive",
      });
    }

    return result;
  };

  const signOut = async () => {
    const result = await authService.signOut();

    if (result.success) {
      toast({
        title: "Signed out",
        description: "You've been signed out successfully.",
      });
    } else {
      toast({
        title: "Sign out failed",
        description: result.error,
        variant: "destructive",
      });
    }

    return result;
  };

  return {
    user,
    session,
    isLoading,
    isAuthenticating,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
};
