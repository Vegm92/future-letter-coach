import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import Dashboard from "@/components/Dashboard";
import LettersView from "@/components/LettersView";
import Settings from "./pages/Settings";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Create wrapper components to access hooks
const DashboardWrapper = () => {
  const navigate = useNavigate();
  
  return (
    <Dashboard 
      onCreateClick={() => {
        // This will be handled by AuthenticatedLayout's context
        const event = new CustomEvent('openCreateForm');
        window.dispatchEvent(event);
      }} 
      onViewAllLetters={() => navigate('/letters')} 
    />
  );
};

const LettersWrapper = () => {
  return (
    <LettersView 
      onCreateClick={() => {
        // This will be handled by AuthenticatedLayout's context
        const event = new CustomEvent('openCreateForm');
        window.dispatchEvent(event);
      }} 
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<DashboardWrapper />} />
            <Route path="/letters" element={<LettersWrapper />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
