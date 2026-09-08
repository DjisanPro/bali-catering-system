/**
 * Cash API — Supabase backed. Cash shifts and movements.
 */
import { supabase } from '../lib/supabase';

export async function getOpenShift() {
  try {
    const { data, error } = await supabase
      .from('cash_shifts')
      .select('*')
      .in('status', ['OPEN', 'IN_OPERATION'])
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function openShift(shift) {
  try {
    // Get next shift number
    const { count } = await supabase
      .from('cash_shifts')
      .select('*', { count: 'exact', head: true });

    const { data, error } = await supabase
      .from('cash_shifts')
      .insert({
        shift_number: (count || 0) + 1,
        status: 'OPEN',
        opened_by: shift.openedBy || 'Admin',
        opened_by_user_id: shift.openedByUserId,
        opened_by_role: shift.openedByRole || 'ADMIN',
        initial_cash_float: shift.initialCashFloat || 0,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function closeShift(id, closeData) {
  try {
    const { data, error } = await supabase
      .from('cash_shifts')
      .update({
        status: 'CLOSED',
        closed_by: closeData.closedBy,
        closed_by_user_id: closeData.closedByUserId,
        closed_at: new Date().toISOString(),
        counted_cash: closeData.countedCash,
        cash_discrepancy: closeData.cashDiscrepancy,
        discrepancy_justification: closeData.discrepancyJustification,
        notes: closeData.notes,
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

export async function getShifts(filters = {}) {
  try {
    let query = supabase
      .from('cash_shifts')
      .select('*')
      .order('opened_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function addMovement(movement) {
  try {
    const { data, error } = await supabase
      .from('cash_movements')
      .insert({
        shift_id: movement.shiftId,
        type: movement.type,
        amount: movement.amount,
        method: movement.method,
        reference: movement.reference,
        description: movement.description,
        performed_by: movement.performedBy,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// Alias for AppContext compatibility
export const getAllShifts = getShifts;
