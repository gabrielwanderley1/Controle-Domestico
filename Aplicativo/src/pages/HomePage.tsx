import { useAuth } from '../contexts/AuthContext';
import { signOutUser } from '../services/authService';

/**
 * Página placeholder para o Dashboard/Estoque.
 * Será implementada em tarefas futuras.
 */
export function HomePage() {
  const { user } = useAuth();

  async function handleLogout() {
    await signOutUser();
  }

  return (
    <div className="home-container">
      <h1>Controle Doméstico</h1>
      <p>Bem-vindo(a), <strong>{user?.email}</strong>!</p>
      <p style={{ color: '#888', fontSize: '0.9rem' }}>
        O módulo de estoque será implementado em breve.
      </p>
      <button className="logout-button" onClick={handleLogout}>
        Sair
      </button>
    </div>
  );
}
