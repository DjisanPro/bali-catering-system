/**
 * Audit API — Supabase backed.
 */
import { supabase } from '../lib/supabase';

export async function getAll(filters = {}) {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters.entity) query = query.eq('entity', filters.entity);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function create(entry) {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        action: entry.action,
        entity: entry.entity,
        entity_id: entry.entityId,
        description: entry.description,
        user: entry.user,
        user_id: entry.userId,
        user_role: entry.userRole,
        previous_value: entry.previousValue,
        new_value: entry.newValue,
        result: entry.result || 'SUCCESS',
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
