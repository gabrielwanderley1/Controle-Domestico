import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import {
  initPushNotifications,
  teardownPushNotifications,
} from '../services/pushNotificationService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
});

/**
 * Hook para acessar o estado de autenticação em qualquer componente.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider que escuta mudanças no estado de autenticação do Supabase
 * e disponibiliza session/user para toda a árvore de componentes.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Busca a sessão atual ao montar o componente
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    // 2. Escuta mudanças no estado de autenticação (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Registra o aparelho para push quando há usuário logado (apenas no Android)
  const userId = session?.user?.id;
  useEffect(() => {
    let isMounted = true;

    if (userId) {
      // Disparo assíncrono e não-bloqueante para garantir renderização fluida no cold start
      const timer = setTimeout(() => {
        if (isMounted) {
          initPushNotifications(userId).catch((err) => {
            console.error('[push] Falha ao inicializar push no login:', err);
          });
        }
      }, 100);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    } else {
      void teardownPushNotifications().catch((err) => {
        console.error('[push] Falha ao encerrar push no logout:', err);
      });
    }
  }, [userId]);

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
