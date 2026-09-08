/**
 * Categories API — Supabase backed.
 */
import { supabase } from '../lib/supabase';

export async function getAll() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order')
      .order('name');

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function create(category) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: category.name,
        slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        icon_name: category.iconName || 'UtensilsCrossed',
        description: category.description,
        display_order: category.displayOrder || 0,
        status: category.status || 'ACTIVE',
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
    if (updates.slug !== undefined) mapped.slug = updates.slug;
    if (updates.iconName !== undefined) mapped.icon_name = updates.iconName;
    if (updates.description !== undefined) mapped.description = updates.description;
    if (updates.displayOrder !== undefined) mapped.display_order = updates.displayOrder;
    if (updates.status !== undefined) mapped.status = updates.status;
    mapped.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('categories')
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
    const { error } = await supabase
      .from('categories')
      .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
