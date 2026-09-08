/**
 * Users API — Supabase backed. Admin management of staff users.
 * Passwords handled via Supabase Auth (reset/invite). Here we manage profiles.
 */
import { supabase } from '../lib/supabase';

export async function getAll() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function create(user) {
  try {
    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (authError) return { success: false, error: authError.message };

    // Create profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role || 'SELLER',
        status: user.status || 'ACTIVE',
        phone: user.phone,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function update(id, updates) {
  try {
    const mapped = {};
    if (updates.name !== undefined) mapped.name = updates.name;
    if (updates.username !== undefined) mapped.username = updates.username;
    if (updates.email !== undefined) mapped.email = updates.email;
    if (updates.role !== undefined) mapped.role = updates.role;
    if (updates.status !== undefined) mapped.status = updates.status;
    if (updates.phone !== undefined) mapped.phone = updates.phone;
    mapped.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(mapped)
      .eq('id', id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function remove(id) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('auth_user_id')
      .eq('id', id)
      .single();

    if (user?.auth_user_id) {
      await supabase.auth.admin.deleteUser(user.auth_user_id);
    }

    const { error } = await supabase
      .from('users')
      .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
