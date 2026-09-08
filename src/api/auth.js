/**
 * Auth API — Supabase Auth integration.
 * Login via email+password through Supabase Auth, then fetch user profile.
 */

import { supabase } from '../lib/supabase';

/**
 * Login with email/username and password.
 * @param {string} identifier — username or email
 * @param {string} password
 */
export async function authenticateUser(identifier, password) {
  try {
    // If it looks like an email, use it directly. Otherwise, look up the email from the username.
    let email = identifier;
    if (!identifier.includes('@')) {
      // Look up user email by username
      const { data: profile, error: lookupError } = await supabase
        .from('users')
        .select('email, id')
        .eq('username', identifier)
        .single();

      if (lookupError || !profile || !profile.email) {
        return { success: false, error: 'Utilizador não encontrado' };
      }
      email = profile.email;
    }

    // Sign in via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { success: false, error: 'Credenciais inválidas' };
    }

    if (!authData.user) {
      return { success: false, error: 'Falha na autenticação' };
    }

    // Fetch user profile from our users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Perfil de utilizador não encontrado' };
    }

    if (profile.status !== 'ACTIVE') {
      return { success: false, error: 'Conta desativada. Contacte o administrador.' };
    }

    // Update last_activity
    await supabase
      .from('users')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', profile.id);

    return {
      success: true,
      data: {
        token: authData.session.access_token,
        user: {
          userId: profile.id,
          username: profile.username,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          status: profile.status,
        },
      },
    };
  } catch (e) {
    return { success: false, error: 'Erro no login: ' + e.message };
  }
}

/**
 * Get current authenticated user.
 */
export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, error: 'Não autenticado' };

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();

    if (error || !profile) {
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
 * Logout.
 */
export async function logout() {
  await supabase.auth.signOut();
  return { success: true };
}

// Aliases for AppContext compatibility
export const login = authenticateUser;
export const getMe = getCurrentUser;
