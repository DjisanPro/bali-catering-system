/**
 * Debts API — Supabase backed. Customer credit/debt tracking.
 */
import { supabase } from '../lib/supabase';

export async function getAll(filters = {}) {
  try {
    let query = supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.customerId) query = query.eq('customer_id', filters.customerId);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function create(debt) {
  try {
    const { data, error } = await supabase
      .from('debts')
      .insert({
        customer_id: debt.customerId,
        customer_name: debt.customerName,
        customer_phone: debt.customerPhone,
        order_id: debt.orderId,
        order_number: debt.orderNumber,
        original_amount: debt.originalAmount,
        paid_amount: debt.paidAmount || 0,
        remaining_amount: debt.originalAmount - (debt.paidAmount || 0),
        status: debt.status || 'PENDING',
        due_date: debt.dueDate,
        notes: debt.notes,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function recordPayment(payment) {
  try {
    // Get debt
    const { data: debt, error: dErr } = await supabase
      .from('debts')
      .select('*')
      .eq('id', payment.debtId)
      .single();

    if (dErr || !debt) return { success: false, error: 'Dívida não encontrada' };

    const paid = Number(debt.paid_amount) + Number(payment.amount);
    const remaining = Number(debt.original_amount) - paid;
    const status = remaining <= 0 ? 'PAID' : 'PARTIAL';

    await supabase
      .from('debts')
      .update({ paid_amount: paid, remaining_amount: remaining, status, updated_at: new Date().toISOString() })
      .eq('id', payment.debtId);

    const { data, error } = await supabase
      .from('debt_payments')
      .insert({
        debt_id: payment.debtId,
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference,
        received_by: payment.receivedBy,
        notes: payment.notes,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data, status };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
