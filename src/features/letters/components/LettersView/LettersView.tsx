import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";
import { supabase } from "@/shared/config/client";
import type { Letter } from "@/shared/types/database";
import { useLetters } from "../../hooks/useLetters";
import LetterCard from "../LetterCard/LetterCard";

interface LettersViewProps {
  onCreateClick: () => void;
  autoViewLetter?: Letter | null;
  onEditLetter?: (letter: Letter) => void;
  onViewLetter?: (letter: Letter) => void;
  refreshTrigger?: number;
}

const LettersView = ({ 
  onCreateClick, 
  autoViewLetter,
  onEditLetter,
  onViewLetter,
  refreshTrigger
}: LettersViewProps) => {
  const [{ letters, loading, error }, {
    fetchLetters,
    deleteLetter,
    updateLetterStatus,
    triggerDelivery
  }] = useLetters();

  // Fetch letters on component mount and when refreshTrigger changes
  useEffect(() => {
    const loadLetters = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          await fetchLetters(user.user.id);
        }
      } catch (error) {
        console.error('Error loading letters:', error);
      }
    };

    loadLetters();
  }, [fetchLetters, refreshTrigger]);

  // Auto-open letter when coming from Dashboard
  useEffect(() => {
    if (autoViewLetter && onViewLetter) {
      onViewLetter(autoViewLetter);
    }
  }, [autoViewLetter, onViewLetter]);

  const handleEditLetter = (letter: Letter) => {
    if (onEditLetter) {
      onEditLetter(letter);
    }
  };

  const handleViewLetter = (letter: Letter) => {
    if (onViewLetter) {
      onViewLetter(letter);
    }
  };

  const handlePlayVoiceMemo = (url: string) => {
    console.log('Playing voice memo:', url);
    // Voice playback will be implemented in the voice-memo feature
  };

  const handleTriggerDelivery = async (letter: Letter) => {
    await triggerDelivery(letter);
  };

  const handleStatusChange = async (
    letter: Letter,
    newStatus: Letter["status"]
  ) => {
    await updateLetterStatus(letter.id, newStatus);
  };

  const handleDeleteLetter = async (letter: Letter) => {
    await deleteLetter(letter.id);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center py-12">
          <div className="space-y-4">
            <Target className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Error Loading Letters</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button 
              onClick={() => {
                // Retry loading
                const retryLoad = async () => {
                  try {
                    const { data: user } = await supabase.auth.getUser();
                    if (user.user) {
                      await fetchLetters(user.user.id);
                    }
                  } catch (error) {
                    console.error('Error retrying letters load:', error);
                  }
                };
                retryLoad();
              }}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Letters</h1>
          <p className="text-sm text-muted-foreground">
            Manage your future letters and track your progress
          </p>
        </div>
        <Button onClick={onCreateClick} variant="hero" size="lg">
          <Plus className="h-4 w-4 mr-2" />
          New Letter
        </Button>
      </div>

      {/* Letters Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            All Letters ({letters.length})
          </h2>
        </div>
        {letters.length === 0 ? (
          <div className="text-center py-12">
            <div className="space-y-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No letters yet</h3>
                <p className="text-muted-foreground">
                  Start your journey by writing your first future letter
                </p>
              </div>
              <Button onClick={onCreateClick} variant="hero" size="lg">
                Write Your First Letter
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {letters.map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                onEdit={handleEditLetter}
                onView={handleViewLetter}
                onPlay={handlePlayVoiceMemo}
                onTriggerDelivery={handleTriggerDelivery}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteLetter}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LettersView;
