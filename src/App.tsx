import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthenticatedLayout } from "@/features/auth";
import { Dashboard } from "@/features/dashboard";
import { LettersView } from "@/features/letters";
import Settings from "./pages/Settings";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import type { Letter } from "@/shared/types";

const queryClient = new QueryClient();

// Create wrapper components to access hooks
const DashboardWrapper = () => {
  const navigate = useNavigate();

  return (
    <Dashboard
      onCreateClick={() => {
        // This will be handled by AuthenticatedLayout's context
        const event = new CustomEvent("openCreateForm");
        window.dispatchEvent(event);
      }}
      onViewAllLetters={() => navigate("/letters")}
      onViewLetter={(letter: Letter) => {
        // Navigate to letters page and trigger letter view
        navigate("/letters");
        setTimeout(() => {
          const event = new CustomEvent("viewLetter", { detail: letter });
          window.dispatchEvent(event);
        }, 100);
      }}
    />
  );
};

const LettersWrapper = () => {
  const [autoViewLetter, setAutoViewLetter] = useState<Letter | null>(null);

  useEffect(() => {
    const handleViewLetter = (event: CustomEvent<Letter>) => {
      setAutoViewLetter(event.detail);
    };

    window.addEventListener("viewLetter", handleViewLetter as EventListener);

    return () => {
      window.removeEventListener(
        "viewLetter",
        handleViewLetter as EventListener
      );
    };
  }, []);

  return (
    <LettersView
      onCreateClick={() => {
        // This will be handled by AuthenticatedLayout's context
        const event = new CustomEvent("openCreateForm");
        window.dispatchEvent(event);
      }}
      autoViewLetter={autoViewLetter}
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
