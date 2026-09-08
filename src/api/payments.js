/**
 * Payments API — Supabase backed.
 */
import { supabase } from '../lib/supabase';

export async function getAll(filters = {}) {
  try {
    let query = supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.orderId) query = query.eq('order_id', filters.orderId);
    if (filters.method) query = query.eq('method', filters.method);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function create(payment) {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: payment.orderId,
        order_number: payment.orderNumber,
        customer_name: payment.customerName,
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference,
        receipt_number: payment.receiptNumber,
        status: payment.status || 'COMPLETED',
        notes: payment.notes,
        received_by: payment.receivedBy,
        shift_id: payment.shiftId,
      })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
