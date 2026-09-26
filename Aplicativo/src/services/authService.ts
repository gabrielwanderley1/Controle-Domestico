import { supabase } from '../lib/supabaseClient';

/**
 * Expressão regular para validação de senha forte:
 * - Mínimo de 6 caracteres
 * - Pelo menos 1 letra maiúscula ([A-Z])
 * - Pelo menos 1 número ([0-9])
 * - Pelo menos 1 caractere especial do conjunto: !@#$%
 */
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%])[A-Za-z\d!@#$%]{6,}$/;

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validador de senha forte para o front-end
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('A senha deve ter no mínimo 6 caracteres.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos 1 letra maiúscula.');
  }
  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos 1 número.');
  }
  if (!/[!@#$%]/.test(password)) {
    errors.push('A senha deve conter pelo menos 1 caractere especial (!@#$%).');
  }
  if (/[^A-Za-z\d!@#$%]/.test(password)) {
    errors.push('A senha contém caracteres não permitidos. Use apenas letras, números e !@#$%.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validador de e-mail simples
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Cadastro com e-mail e senha
 */
export async function signUpUser(email: string, password: string) {
  const validation = validatePassword(password);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Login com e-mail e senha
 */
export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Logout
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Recuperação de Senha: Enviar OTP de 6 dígitos por e-mail
 */
export async function sendPasswordRecoveryOtp(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) throw error;
  return data;
}

/**
 * Recuperação de Senha: Validar código OTP de 6 dígitos
 */
export async function verifyRecoveryOtp(email: string, token: string) {
  const cleanToken = token.trim();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: cleanToken,
    type: 'recovery',
  });

  if (error) throw error;
  return data;
}

/**
 * Recuperação de Senha: Atualizar para a nova senha
 */
export async function updateUserPassword(newPassword: string) {
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}
