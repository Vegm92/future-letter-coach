import { useState } from "react";
import { LettersView, CreateLetterForm, SuggestedMilestones } from "@/features/letters";
import { AuthenticatedLayout } from "@/features/auth";
import { supabase } from "@/shared/config/client";
import { useToast } from "@/shared/hooks/use-toast";

const Letters = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMilestoneSuggestions, setShowMilestoneSuggestions] = useState(false);
  const [suggestedMilestones, setSuggestedMilestones] = useState([]);
  const [currentLetterId, setCurrentLetterId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const handleCreateClick = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = async (letterData?: any) => {
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1); // Trigger LettersView refresh
    
    toast({
      title: "Letter created successfully!",
      description: "Your letter has been created. You can now edit it to enhance with AI and add milestones.",
    });
  };

  const handleMilestonesAdded = () => {
    setRefreshKey(prev => prev + 1); // Trigger LettersView refresh
  };

  return (
    <>
      <LettersView 
        onCreateClick={handleCreateClick} 
        refreshTrigger={refreshKey}
      />
      
      {showCreateForm && (
        <CreateLetterForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {showMilestoneSuggestions && currentLetterId && (
        <SuggestedMilestones
          isOpen={showMilestoneSuggestions}
          onClose={() => setShowMilestoneSuggestions(false)}
          letterId={currentLetterId}
          suggestedMilestones={suggestedMilestones}
          onMilestonesAdded={handleMilestonesAdded}
        />
      )}
    </>
  );
};

export default Letters;