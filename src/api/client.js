/**
 * API Client — now wraps Supabase directly.
 * All modules import from this or use supabase client directly.
 * Keeps the same { success, data, error } return shape.
 */

import { supabase } from '../lib/supabase';

export { supabase };

/**
 * Get current session user from Supabase Auth.
 */
export async function getCurrentUser() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return { success: false, error: sessionError.message };
    if (!session) return { success: false, error: 'Não autenticado' };

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Perfil não encontrado' };
    }

    return {
      success: true,
      data: {
        userId: profile.id,
        username: profile.username,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
      },
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Set auth token (for backwards compatibility — Supabase manages sessions internally).
 */
export function setToken(token) {
  // No-op: Supabase manages auth tokens via localStorage internally
}

export function getToken() {
  // No-op: Supabase manages auth tokens internally
  return null;
}

export function clearAuthAndRedirect() {
  window.dispatchEvent(new CustomEvent('bali:auth-expired'));
}
