import { useState } from "react";
import LettersView from "@/components/LettersView";
import CreateLetterForm from "@/components/CreateLetterForm";
import SuggestedMilestones from "@/components/SuggestedMilestones";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
    
    if (letterData) {
      // Generate milestone suggestions
      try {
        const { data, error } = await supabase.functions.invoke('suggest-milestones', {
          body: {
            letterId: letterData.id,
            goal: letterData.goal,
            content: letterData.content,
            sendDate: letterData.send_date,
          }
        });

        if (error) throw error;

        if (data.suggestedMilestones && data.suggestedMilestones.length > 0) {
          setSuggestedMilestones(data.suggestedMilestones);
          setCurrentLetterId(letterData.id);
          setShowMilestoneSuggestions(true);
        }
      } catch (error) {
        console.error('Error getting milestone suggestions:', error);
        toast({
          title: "Letter created successfully!",
          description: "Milestone suggestions are temporarily unavailable.",
        });
      }
    }
  };

  const handleMilestonesAdded = () => {
    setRefreshKey(prev => prev + 1); // Trigger LettersView refresh
  };

  return (
    <>
      <LettersView 
        onCreateClick={handleCreateClick} 
        key={refreshKey} 
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