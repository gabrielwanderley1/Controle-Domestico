import { useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/authService';
import { AddItemForm } from '../components/AddItemForm';
import { FeedbackPopup, type FeedbackType } from '../components/FeedbackPopup';
import './HomePage.css';

interface FeedbackState {
  message: string;
  type: FeedbackType;
  visible: boolean;
}

/**
 * Página principal (Dashboard).
 * Integra o formulário de adição de itens com feedback visual.
 * A listagem de itens será implementada em tarefas futuras.
 */
export function HomePage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackState>({
    message: '',
    type: 'info',
    visible: false,
  });

  const showFeedback = useCallback((message: string, type: FeedbackType) => {
    setFeedback({ message, type, visible: true });
  }, []);

  function closeFeedback() {
    setFeedback((prev) => ({ ...prev, visible: false }));
  }

  function handleItemAdded() {
    // Futuramente: recarregar lista de itens aqui
  }

  async function handleLogout() {
    await signOutUser();
  }

  return (
    <div className="home-page">
      <FeedbackPopup
        message={feedback.message}
        type={feedback.type}
        visible={feedback.visible}
        onClose={closeFeedback}
      />

      <header className="home-header">
        <div className="home-header-left">
          <h1 className="home-title">Controle Doméstico</h1>
          <p className="home-greeting">
            Olá, <strong>{user?.email?.split('@')[0]}</strong>
          </p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Sair
        </button>
      </header>

      <main className="home-content">
        <AddItemForm
          onItemAdded={handleItemAdded}
          onFeedback={showFeedback}
        />
      </main>
    </div>
  );
}
