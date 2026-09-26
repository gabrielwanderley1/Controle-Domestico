import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';

/**
 * Componente raiz da aplicação.
 * Configura o AuthProvider e as rotas (protegidas e públicas).
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota pública: Login / Cadastro */}
          <Route path="/login" element={<AuthPage />} />

          {/* Rota protegida: Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          {/* Qualquer rota desconhecida redireciona para "/" */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
