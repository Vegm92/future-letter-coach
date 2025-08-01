import { useState } from "react";
import LettersView from "@/components/LettersView";
import CreateLetterForm from "@/components/CreateLetterForm";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";

const Letters = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateClick = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  return (
    <AuthenticatedLayout>
      <LettersView onCreateClick={handleCreateClick} />
      
      {showCreateForm && (
        <CreateLetterForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </AuthenticatedLayout>
  );
};

export default Letters;