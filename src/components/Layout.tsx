/**
 * LAYOUT COMPONENT WITH SIDEBAR
 * 
 * Wraps authenticated pages with consistent navigation
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import type { LayoutProps } from '../lib/types';

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from localStorage, default to false (expanded)
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      // If no user, redirect to auth page
      if (!user) {
        navigate('/', { replace: true });
      }
    };
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(prev => !prev);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - dynamic width based on collapse state */}
      <div className="hidden md:flex md:flex-col">
        <Sidebar 
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleSidebarToggle}
          user={user}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay - for future mobile support */}
      <div className="md:hidden">
        {/* This would be a mobile drawer/modal in a full implementation */}
      </div>
    </div>
  );
}
