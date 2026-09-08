/**
 * Orders API — Supabase backed.
 */
import { supabase } from '../lib/supabase';

function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 900) + 100;
  return `BC-${date}-${rand}`;
}

export async function getAll(filters = {}) {
  try {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.from) query = query.gte('created_at', filters.from);
    if (filters.to) query = query.lte('created_at', filters.to);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getById(id) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function create(order) {
  try {
    const orderNumber = order.orderNumber || generateOrderNumber();
    const items = order.items || [];

    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      subtotal += Number(item.price) * Number(item.quantity || 1);
    }

    const deliveryFee = order.deliveryFee || 0;
    const discount = order.discount || 0;
    const total = subtotal + deliveryFee - discount;

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: order.customerName || 'Cliente',
        customer_phone: order.customerPhone || '',
        customer_address: order.customerAddress,
        customer_id: order.customerId,
        order_type: order.orderType || 'TAKEAWAY',
        table_number: order.tableNumber,
        status: order.status || 'PENDING',
        subtotal,
        delivery_fee: deliveryFee,
        discount,
        total,
        payment_status: order.paymentStatus || 'PENDING',
        payment_method: order.paymentMethod || 'CASH',
        payment_reference: order.paymentReference,
        notes: order.notes,
        stock_deducted: false,
        created_by: order.createdBy,
      })
      .select()
      .single();

    if (orderError) return { success: false, error: orderError.message };

    // Create order items
    if (items.length > 0) {
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.productId,
        product_name: item.productName,
        price: item.price,
        quantity: item.quantity || 1,
        unit_cost: item.unitCost || 0,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) return { success: false, error: itemsError.message };
    }

    return {
      success: true,
      data: {
        id: orderData.id,
        orderNumber: orderData.order_number,
        total: orderData.total,
        paymentStatus: orderData.payment_status,
      },
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function updateStatus(id, status, notes) {
  try {
    const mapped = { status, updated_at: new Date().toISOString() };
    if (status === 'CANCELLED') {
      mapped.cancellation_reason = notes;
      mapped.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('orders')
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
      .from('orders')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getTodayStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabase
      .from('orders')
      .select('id, total, status, payment_status, payment_method, created_at')
      .gte('created_at', todayISO);

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Cancel an order (sets status to CANCELLED).
 */
export async function cancel(id, reason, cancelledBy) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'CANCELLED',
        cancellation_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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

/**
 * Correct an order — update items/totals. Simplification: updates status and totals.
 */
export async function correct(id, corrections) {
  try {
    const mapped = { updated_at: new Date().toISOString() };
    if (corrections.total !== undefined) mapped.total = corrections.total;
    if (corrections.subtotal !== undefined) mapped.subtotal = corrections.subtotal;
    if (corrections.paymentMethod !== undefined) mapped.payment_method = corrections.paymentMethod;
    if (corrections.status !== undefined) mapped.status = corrections.status;
    if (corrections.paymentStatus !== undefined) mapped.payment_status = corrections.paymentStatus;

    const { data, error } = await supabase
      .from('orders')
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
