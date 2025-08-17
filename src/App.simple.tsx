/**
 * SIMPLIFIED APP COMPONENT
 * 
 * No more CustomEvent anti-pattern!
 * No more wrapper components!
 * Clean, simple React patterns.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// Import our new simplified pages (we'll create these next)
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { LettersPage } from './pages/LettersPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Simple, predictable query client setup
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<AuthPage />} />
            
            {/* Protected routes - each page handles its own auth */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/letters" element={<LettersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* Catch all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        
        {/* Global UI components */}
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

/**
 * COMPARE THIS TO THE OLD APP.TSX:
 * 
 * OLD: 170+ lines with complex wrapper components, event bus, prop drilling
 * NEW: 50 lines of clean, readable React
 * 
 * OLD: Custom events: window.dispatchEvent(new CustomEvent(...))
 * NEW: Normal React patterns
 * 
 * OLD: Multiple state management systems
 * NEW: React Query handles everything
 * 
 * OLD: Tight coupling between components
 * NEW: Each page is independent
 */
