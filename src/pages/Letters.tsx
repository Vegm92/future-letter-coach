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
    console.log('Letter created successfully:', letterData);
    setShowCreateForm(false);
    setRefreshKey(prev => prev + 1); // Trigger LettersView refresh
    
    if (letterData) {
      // Generate milestone suggestions
      try {
        console.log('Calling suggest-milestones function...');
        const { data, error } = await supabase.functions.invoke('suggest-milestones', {
          body: {
            letterId: letterData.id,
            goal: letterData.goal,
            content: letterData.content,
            sendDate: letterData.send_date,
          }
        });

        console.log('Suggest-milestones response:', { data, error });

        if (error) {
          console.error('Error getting milestone suggestions:', error);
          toast({
            title: "Letter created successfully!",
            description: "Milestone suggestions failed to load.",
          });
          return;
        }

        if (data?.suggestedMilestones && data.suggestedMilestones.length > 0) {
          console.log('Setting suggested milestones:', data.suggestedMilestones);
          setSuggestedMilestones(data.suggestedMilestones);
          setCurrentLetterId(letterData.id);
          setShowMilestoneSuggestions(true);
        } else {
          console.log('No milestone suggestions received');
          toast({
            title: "Letter created successfully!",
            description: "No milestone suggestions were generated.",
          });
        }
      } catch (error) {
        console.error('Error calling suggest-milestones function:', error);
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