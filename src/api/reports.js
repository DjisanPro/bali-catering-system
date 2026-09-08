/**
 * Reports API — Supabase backed. Financial/stock reports.
 */
import { supabase } from '../lib/supabase';

export async function getSalesReport(filters = {}) {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.from) query = query.gte('created_at', filters.from);
    if (filters.to) query = query.lte('created_at', filters.to);
    if (filters.limit) query = query.limit(filters.limit || 500);

    const { data, error } = await query;
    if (error) return { success: false, error: error.message };

    const totalRevenue = (data || []).reduce((s, o) => s + Number(o.total), 0);
    const totalCost = (data || []).reduce((s, o) => s + Number(o.subtotal || o.total), 0);

    return {
      success: true,
      data: {
        orders: data || [],
        totalRevenue,
        ordersCount: (data || []).length,
      },
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function getStockReport() {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name');

    if (error) return { success: false, error: error.message };
    return { success: true, data: data || [] };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
