/**
 * Dashboard API — Supabase backed. Aggregated stats for the dashboard.
 */
import { supabase } from '../lib/supabase';

export async function getStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Today's orders
    const { data: todayOrders, error: tErr } = await supabase
      .from('orders')
      .select('id, total, status, payment_method')
      .gte('created_at', todayISO);

    if (tErr) return { success: false, error: tErr.message };

    // All products
    const { data: products, error: pErr } = await supabase
      .from('products')
      .select('id, status, is_available');

    if (pErr) return { success: false, error: pErr.message };

    // All orders count
    const { count: totalOrders, error: oErr } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Customers count
    const { count: totalCustomers, error: cErr } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Low stock ingredients
    const { data: ingredients, error: iErr } = await supabase
      .from('ingredients')
      .select('*')
      .eq('status', 'ACTIVE');

    const lowStock = (ingredients || []).filter(i => Number(i.current_stock) <= Number(i.minimum_stock));

    const todayTotal = (todayOrders || []).reduce((s, o) => s + Number(o.total), 0);
    const todayOrdersCount = (todayOrders || []).length;
    const activeProducts = (products || []).filter(p => p.status === 'ACTIVE').length;

    // Payment breakdown for today
    const breakdown = { CASH: 0, MPESA: 0, EMOLA: 0, POS_CARD: 0, BANK_TRANSFER: 0 };
    for (const o of (todayOrders || [])) {
      const m = o.payment_method;
      if (breakdown[m] !== undefined) breakdown[m] += Number(o.total);
    }

    return {
      success: true,
      data: {
        todayRevenue: todayTotal,
        todayOrders: todayOrdersCount,
        totalProducts: activeProducts,
        totalOrders: totalOrders || 0,
        totalCustomers: totalCustomers || 0,
        lowStockCount: lowStock.length,
        paymentBreakdown: breakdown,
      },
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export const getDashboard = getStats;
