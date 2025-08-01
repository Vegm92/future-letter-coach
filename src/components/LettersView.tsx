import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Target, 
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LetterCard from "./LetterCard";
import LetterDetail from "./LetterDetail";
import EditLetterForm from "./EditLetterForm";

interface LettersViewProps {
  onCreateClick: () => void;
}

const LettersView = ({ onCreateClick }: LettersViewProps) => {
  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState<any | null>(null);
  const [editingLetter, setEditingLetter] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: lettersData, error: lettersError } = await supabase
        .from('letters')
        .select(`
          *,
          milestones (
            id,
            title,
            percentage,
            completed,
            target_date
          )
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (lettersError) throw lettersError;

      setLetters(lettersData || []);
    } catch (error) {
      console.error('Error fetching letters:', error);
      toast({
        title: "Failed to load letters",
        description: "Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditLetter = (letter: any) => {
    setEditingLetter(letter);
    setShowDetail(false);
  };

  const handleViewLetter = (letter: any) => {
    setSelectedLetter(letter);
    setShowDetail(true);
  };

  const handleUpdateLetter = (updatedLetter: any) => {
    setLetters(letters.map(l => l.id === updatedLetter.id ? updatedLetter : l));
    setSelectedLetter(updatedLetter);
  };

  const handleEditSuccess = (updatedLetter: any) => {
    setLetters(letters.map(l => l.id === updatedLetter.id ? updatedLetter : l));
    setEditingLetter(null);
    setSelectedLetter(updatedLetter);
    setShowDetail(true);
  };

  const handlePlayVoiceMemo = (url: string) => {
    toast({
      title: "Playing voice memo",
      description: "Voice playback feature coming soon.",
    });
  };

  const handleTriggerDelivery = async (letter: any) => {
    try {
      const action = letter.status === 'draft' ? 'schedule' : 'send';
      
      const { data, error } = await supabase.functions.invoke('trigger-letter-delivery', {
        body: {
          letterId: letter.id,
          action: action
        }
      });

      if (error) throw error;

      const newStatus = action === 'schedule' ? 'scheduled' : 'sent';
      setLetters(letters.map(l => 
        l.id === letter.id ? { ...l, status: newStatus } : l
      ));

      toast({
        title: action === 'schedule' ? "Letter Scheduled" : "Letter Sent",
        description: action === 'schedule' 
          ? `"${letter.title}" has been scheduled for delivery`
          : `"${letter.title}" has been sent successfully`,
      });

      fetchLetters();
    } catch (error) {
      console.error('Error triggering delivery:', error);
      toast({
        title: "Failed to process request",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (letter: any, newStatus: string) => {
    try {
      const { error: updateError } = await supabase
        .from('letters')
        .update({ status: newStatus })
        .eq('id', letter.id);

      if (updateError) throw updateError;

      setLetters(letters.map(l => 
        l.id === letter.id ? { ...l, status: newStatus } : l
      ));

      toast({
        title: "Status Updated",
        description: `Letter status changed to ${newStatus}`,
      });

      fetchLetters();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Failed to update status",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const filterLetters = (status?: string) => {
    if (!status) return letters;
    return letters.filter(letter => letter.status === status);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Your Letters</h1>
          <p className="text-muted-foreground">
            Manage and track all your future letters
          </p>
        </div>
        <Button onClick={onCreateClick} variant="hero">
          <Plus className="h-4 w-4 mr-2" />
          New Letter
        </Button>
      </div>

      {/* Letters Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Letters ({letters.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({filterLetters('scheduled').length})</TabsTrigger>
          <TabsTrigger value="sent">Delivered ({filterLetters('sent').length})</TabsTrigger>
          <TabsTrigger value="draft">Drafts ({filterLetters('draft').length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {letters.length === 0 ? (
            <Card className="p-12 text-center">
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
            </Card>
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
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="scheduled" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterLetters('scheduled').map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                onEdit={handleEditLetter}
                onView={handleViewLetter}
                onPlay={handlePlayVoiceMemo}
                onTriggerDelivery={handleTriggerDelivery}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="sent" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterLetters('sent').map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                onEdit={handleEditLetter}
                onView={handleViewLetter}
                onPlay={handlePlayVoiceMemo}
                onTriggerDelivery={handleTriggerDelivery}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="draft" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filterLetters('draft').map((letter) => (
              <LetterCard
                key={letter.id}
                letter={letter}
                onEdit={handleEditLetter}
                onView={handleViewLetter}
                onPlay={handlePlayVoiceMemo}
                onTriggerDelivery={handleTriggerDelivery}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Letter Detail Modal */}
      {selectedLetter && (
        <LetterDetail
          letter={selectedLetter}
          isOpen={showDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedLetter(null);
          }}
          onEdit={handleEditLetter}
          onUpdate={handleUpdateLetter}
          onPlay={handlePlayVoiceMemo}
        />
      )}

      {/* Edit Letter Modal */}
      {editingLetter && (
        <EditLetterForm
          letter={editingLetter}
          onClose={() => setEditingLetter(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default LettersView;