import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInUser, signUpUser, validateEmail, validatePassword } from '../services/authService';
import { FeedbackPopup, type FeedbackType } from '../components/FeedbackPopup';
import './AuthPage.css';

type AuthTab = 'login' | 'cadastro';

interface FeedbackState {
  message: string;
  type: FeedbackType;
  visible: boolean;
}

/**
 * Tela de Autenticação com abas alternáveis entre Login e Cadastro.
 * Redireciona para "/" caso o usuário já esteja logado.
 */
export function AuthPage() {
  const { session, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({
    message: '',
    type: 'info',
    visible: false,
  });

  // Mostra spinner enquanto verifica sessão
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  // Redireciona se já logado
  if (session) {
    return <Navigate to="/" replace />;
  }

  function showFeedback(message: string, type: FeedbackType) {
    setFeedback({ message, type, visible: true });
  }

  function closeFeedback() {
    setFeedback((prev) => ({ ...prev, visible: false }));
  }

  function switchTab(tab: AuthTab) {
    setActiveTab(tab);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFeedback({ message: '', type: 'info', visible: false });
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    if (!validateEmail(email)) {
      showFeedback('Por favor, insira um e-mail válido.', 'error');
      return;
    }

    if (!password) {
      showFeedback('Por favor, insira sua senha.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInUser(email, password);
      // O onAuthStateChange do AuthContext cuidará do redirecionamento
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login.';
      showFeedback(translateSupabaseError(message), 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();

    if (!validateEmail(email)) {
      showFeedback('Por favor, insira um e-mail válido.', 'error');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      showFeedback(validation.errors[0], 'error');
      return;
    }

    if (password !== confirmPassword) {
      showFeedback('As senhas não coincidem.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await signUpUser(email, password);

      // Supabase pode retornar user sem sessão se confirmação por e-mail estiver ativa
      if (data.session) {
        showFeedback('Conta criada com sucesso!', 'success');
      } else {
        showFeedback(
          'Conta criada! Verifique seu e-mail para confirmar o cadastro.',
          'success',
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta.';
      showFeedback(translateSupabaseError(message), 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-container">
      <FeedbackPopup
        message={feedback.message}
        type={feedback.type}
        visible={feedback.visible}
        onClose={closeFeedback}
      />

      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Controle Doméstico</h1>
          <p className="auth-subtitle">Gerencie seu estoque de forma simples</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === 'login' ? 'auth-tab-active' : ''}`}
            onClick={() => switchTab('login')}
            type="button"
          >
            Entrar
          </button>
          <button
            className={`auth-tab ${activeTab === 'cadastro' ? 'auth-tab-active' : ''}`}
            onClick={() => switchTab('cadastro')}
            type="button"
          >
            Criar Conta
          </button>
        </div>

        {activeTab === 'login' ? (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Senha</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? <span className="spinner-small" /> : 'Entrar'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleSignUp}>
            <div className="form-group">
              <label htmlFor="signup-email">E-mail</label>
              <input
                id="signup-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Senha</label>
              <input
                id="signup-password"
                type="password"
                placeholder="Mín. 6 chars, 1 maiúsc., 1 núm., 1 especial"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <PasswordStrength password={password} />
            </div>

            <div className="form-group">
              <label htmlFor="signup-confirm">Confirmar Senha</label>
              <input
                id="signup-confirm"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? <span className="spinner-small" /> : 'Criar Conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Indicador visual de força da senha em tempo real.
 */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const checks = [
    { label: '6+ caracteres', ok: password.length >= 6 },
    { label: '1 maiúscula', ok: /[A-Z]/.test(password) },
    { label: '1 número', ok: /\d/.test(password) },
    { label: '1 especial (!@#$%)', ok: /[!@#$%]/.test(password) },
  ];

  return (
    <ul className="password-checks">
      {checks.map((check) => (
        <li key={check.label} className={check.ok ? 'check-ok' : 'check-fail'}>
          {check.ok ? '✓' : '○'} {check.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Traduz erros comuns do Supabase para português.
 */
function translateSupabaseError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (message.includes('User already registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (message.includes('Email not confirmed')) {
    return 'E-mail não confirmado. Verifique sua caixa de entrada.';
  }
  if (message.includes('Password should be at least')) {
    return 'A senha deve ter no mínimo 6 caracteres.';
  }
  if (message.includes('Unable to validate email address')) {
    return 'Endereço de e-mail inválido.';
  }
  return message;
}
