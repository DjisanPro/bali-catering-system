/**
 * Expenses API — Supabase backed.
 */
import { supabase } from '../lib/supabase';

export async function getAll(filters = {}) {
  try {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (filters.from) query = query.gte('expense_date', filters.from);
    if (filters.to) query = query.lte('expense_date', filters.to);
    if (filters.category) query = query.eq('category', filters.category);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function create(expense) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        description: expense.description,
        category: expense.category || 'Operacional',
        amount: Number(expense.amount) || 0,
        expense_date: expense.expenseDate || new Date().toISOString(),
        responsible: expense.responsible,
        notes: expense.notes,
        created_by: expense.createdBy,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function update(id, expense) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        description: expense.description,
        category: expense.category,
        amount: Number(expense.amount) || 0,
        expense_date: expense.expenseDate,
        responsible: expense.responsible,
        notes: expense.notes,
      })
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
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getTotals(filters = {}) {
  try {
    let query = supabase
      .from('expenses')
      .select('amount, expense_date');

    if (filters.from) query = query.gte('expense_date', filters.from);
    if (filters.to) query = query.lte('expense_date', filters.to);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };

    const total = (data || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return { success: true, data: { total, count: (data || []).length } };
  } catch (e) {
    return { success: false, error: e.message };
  }
}