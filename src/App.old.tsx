import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthenticatedLayout } from "@/features/auth";
import { Dashboard } from "@/features/dashboard";
import { LettersView, LetterDetail, EditLetterForm } from "@/features/letters";
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [showLetterDetail, setShowLetterDetail] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    const handleViewLetter = (event: CustomEvent<Letter>) => {
      try {
        setAutoViewLetter(event.detail);
      } catch (error) {
        console.error('Failed to handle viewLetter event:', error);
      }
    };

    const handleRefreshLetters = () => {
      try {
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        console.error('Failed to handle refreshLetters event:', error);
        // Fallback could be to reload the page or show error message
      }
    };

    window.addEventListener("viewLetter", handleViewLetter as EventListener);
    window.addEventListener("refreshLetters", handleRefreshLetters);

    return () => {
      window.removeEventListener(
        "viewLetter",
        handleViewLetter as EventListener
      );
      window.removeEventListener("refreshLetters", handleRefreshLetters);
    };
  }, []);

  const handleViewLetter = (letter: Letter) => {
    setSelectedLetter(letter);
    setShowLetterDetail(true);
  };

  const handleEditLetter = (letter: Letter) => {
    setSelectedLetter(letter);
    setShowEditForm(true);
  };

  const handleLetterUpdate = (updatedLetter: Letter) => {
    setSelectedLetter(updatedLetter);
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  return (
    <>
      <LettersView
        onCreateClick={() => {
          // This will be handled by AuthenticatedLayout's context
          const event = new CustomEvent("openCreateForm");
          window.dispatchEvent(event);
        }}
        autoViewLetter={autoViewLetter}
        refreshTrigger={refreshKey}
        onViewLetter={handleViewLetter}
        onEditLetter={handleEditLetter}
      />
      
      {/* Letter Detail Modal */}
      {showLetterDetail && selectedLetter && (
        <LetterDetail
          letter={selectedLetter}
          isOpen={showLetterDetail}
          onClose={() => {
            setShowLetterDetail(false);
            setSelectedLetter(null);
          }}
          onEdit={(letter) => {
            setShowLetterDetail(false);
            setShowEditForm(true);
          }}
          onUpdate={handleLetterUpdate}
          onPlay={(url) => console.log('Playing voice memo:', url)}
          onDelete={(letter) => {
            setShowLetterDetail(false);
            setSelectedLetter(null);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
      
      {/* Edit Letter Modal */}
      {showEditForm && selectedLetter && (
        <EditLetterForm
          letter={selectedLetter}
          onClose={() => {
            setShowEditForm(false);
            setSelectedLetter(null);
          }}
          onSuccess={(updatedLetter) => {
            setShowEditForm(false);
            setSelectedLetter(null);
            handleLetterUpdate(updatedLetter);
          }}
        />
      )}
    </>
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
