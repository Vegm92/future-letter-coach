/**
 * SIMPLIFIED LETTERS PAGE
 * 
 * Combines functionality from:
 * - LettersView
 * - VisionVault  
 * - Modal management
 * - Form handling
 * 
 * One page, clear responsibilities, no prop drilling.
 */

import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Target, Loader2 } from 'lucide-react';

import { useLetters } from '../hooks/useLetters';
import { useEnhancement } from '../hooks/useEnhancement';
import { supabase } from '../lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import type { Letter, CreateLetterData } from '../lib/types';

// Import our new simplified components
import { LetterCard } from '../components/LetterCard';
import { LetterForm } from '../components/LetterForm';
import { LetterDetail } from '../components/LetterDetail';

export function LettersPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal state - simple and clear
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [showLetterDetail, setShowLetterDetail] = useState(false);
  
  // Data hooks
  const { letters, isLoading: lettersLoading, createLetter, updateLetter, deleteLetter } = useLetters();
  const { enhance, isLoading: enhanceLoading } = useEnhancement();

  // Check authentication
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

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Event handlers - simple and direct
  const handleCreateClick = () => {
    setEditingLetter(null); // Clear any editing state
    setShowCreateForm(true);
  };

  const handleViewLetter = (letter: Letter) => {
    setSelectedLetter(letter);
    setShowLetterDetail(true);
  };

  const handleEditLetter = (letter: Letter) => {
    setEditingLetter(letter);
    setShowCreateForm(true); // Use same form for create/edit
    setShowLetterDetail(false); // Close detail if open
  };

  const handleDeleteLetter = async (letter: Letter) => {
    if (!confirm(`Are you sure you want to delete "${letter.title}"?`)) return;
    await deleteLetter(letter.id);
    // Close detail modal if this letter was open
    if (selectedLetter?.id === letter.id) {
      setShowLetterDetail(false);
      setSelectedLetter(null);
    }
  };

  const handleStatusChange = async (letter: Letter, newStatus: Letter['status']) => {
    await updateLetter(letter.id, { status: newStatus });
    // Update selected letter if it's the same one
    if (selectedLetter?.id === letter.id) {
      setSelectedLetter({ ...selectedLetter, status: newStatus });
    }
  };

  const handleFormSuccess = (letter: Letter) => {
    setShowCreateForm(false);
    setEditingLetter(null);
    // If we were editing, update the selected letter for detail view
    if (selectedLetter?.id === letter.id) {
      setSelectedLetter(letter);
    }
  };

  const handleUpdateComments = async (letter: Letter, comments: string) => {
    await updateLetter(letter.id, { personal_comments: comments });
    // Update the selected letter
    if (selectedLetter?.id === letter.id) {
      setSelectedLetter({ ...selectedLetter, personal_comments: comments });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Letters</h1>
              <p className="text-muted-foreground">
                Manage your future letters and track your progress
              </p>
            </div>
            <Button onClick={handleCreateClick} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              New Letter
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {lettersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No letters yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your journey by writing your first future letter
            </p>
            <Button onClick={handleCreateClick} size="lg">
              Write Your First Letter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {letters.map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                onView={handleViewLetter}
                onEdit={handleEditLetter}
                onDelete={handleDeleteLetter}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Letter Form Modal (Create/Edit) */}
      <Dialog open={showCreateForm} onOpenChange={() => {
        setShowCreateForm(false);
        setEditingLetter(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <LetterForm
            letter={editingLetter || undefined}
            onClose={() => {
              setShowCreateForm(false);
              setEditingLetter(null);
            }}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Letter Detail Modal */}
      {selectedLetter && (
        <Dialog open={showLetterDetail} onOpenChange={setShowLetterDetail}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <LetterDetail
              letter={selectedLetter}
              onEdit={handleEditLetter}
              onDelete={handleDeleteLetter}
              onUpdateComments={handleUpdateComments}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/**
 * COMPARISON TO OLD ARCHITECTURE:
 * 
 * OLD: 3 separate components (LettersView, VisionVault, Wrappers) + event bus
 * NEW: 1 component with clear responsibilities
 * 
 * OLD: Complex prop drilling and state management
 * NEW: Local state for UI, React Query for data
 * 
 * OLD: CustomEvent communication between components  
 * NEW: Direct function calls
 * 
 * OLD: 500+ lines across multiple files
 * NEW: 150 lines in one file (and we can add more features easily)
 */
