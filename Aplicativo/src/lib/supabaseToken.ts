import { supabase } from './supabaseClient';

/**
 * Utilitário para extração do Access Token JWT e geração de headers HTTP.
 *
 * Uso principal: fornecer o Bearer Token para requisições direcionadas
 * ao back-end Node.js customizado (endpoints que validam o JWT do Supabase).
 *
 * Para operações CRUD diretas no Supabase via `supabase.from(...)`,
 * o client já injeta o token automaticamente — não é necessário usar este módulo.
 */

/**
 * Obtém o access_token (JWT) da sessão autenticada ativa.
 *
 * @returns O JWT string ou `null` se não houver sessão ativa.
 *
 * @example
 * ```ts
 * const token = await getAccessToken();
 * if (!token) {
 *   // Usuário não está logado
 * }
 * ```
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session.access_token;
}

/**
 * Gera os headers HTTP com o Bearer Token para requisições ao back-end.
 *
 * Retorna um objeto pronto para ser espalhado no `headers` de um `fetch()`
 * ou de qualquer client HTTP.
 *
 * @throws {Error} Se não houver sessão ativa (usuário não autenticado).
 *
 * @example
 * ```ts
 * const headers = await getAuthHeaders();
 *
 * const response = await fetch('http://localhost:3000/api/notificacoes', {
 *   method: 'GET',
 *   headers: {
 *     ...headers,
 *     'Content-Type': 'application/json',
 *   },
 * });
 * ```
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();

  if (!token) {
    throw new Error(
      'Sessão não encontrada. O usuário precisa estar autenticado para acessar este recurso.'
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Wrapper para `fetch()` que injeta automaticamente o Bearer Token.
 *
 * Simplifica chamadas ao back-end Node.js que requerem autenticação.
 * O Content-Type padrão é `application/json`.
 *
 * @param url URL do endpoint do back-end.
 * @param options Opções adicionais do fetch (method, body, etc).
 * @returns A Response do fetch.
 *
 * @example
 * ```ts
 * // GET autenticado
 * const res = await authenticatedFetch('/api/notificacoes');
 * const data = await res.json();
 *
 * // POST autenticado
 * const res = await authenticatedFetch('/api/configuracoes', {
 *   method: 'POST',
 *   body: JSON.stringify({ chave: 'valor' }),
 * });
 * ```
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const authHeaders = await getAuthHeaders();

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });
}
