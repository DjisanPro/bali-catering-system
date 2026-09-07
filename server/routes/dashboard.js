const express = require('express');
const { getDb } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
    // Today's sales
    const todaySales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as amount, COUNT(*) as count
      FROM orders
      WHERE date(created_at) = date('now') AND status != 'CANCELLED'
    `).get();
    
    // Month sales
    const monthSales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as amount, COUNT(*) as count
      FROM orders
      WHERE date(created_at) >= date('now', 'start of month') AND status != 'CANCELLED'
    `).get();
    
    // Pending orders
    const pendingOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE status IN ('PENDING', 'CONFIRMED', 'PREPARING')
    `).get();
    
    // Top products (from order_items)
    const topProducts = db.prepare(`
      SELECT oi.product_id, oi.product_name,
        SUM(oi.quantity) as quantity,
        SUM(oi.price * oi.quantity) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'CANCELLED'
      GROUP BY oi.product_id
      ORDER BY revenue DESC
      LIMIT 5
    `).all();
    
    // Critical stock
    const criticalStock = db.prepare(`
      SELECT * FROM ingredients
      WHERE status = 'ACTIVE' AND current_stock <= minimum_stock
      ORDER BY (current_stock - minimum_stock) ASC
      LIMIT 10
    `).all();
    
    // Clients count
    const clientsCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'ACTIVE'").get();
    
    // Payments received today
    const paymentsToday = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as received
      FROM payments WHERE date(created_at) = date('now')
    `).get();
    
    // Pending amounts (orders not fully paid)
    const pendingAmount = db.prepare(`
      SELECT COALESCE(SUM(o.total - COALESCE(p.paid, 0)), 0) as pending
      FROM orders o
      LEFT JOIN (SELECT order_id, COALESCE(SUM(amount), 0) as paid FROM payments WHERE amount > 0 GROUP BY order_id) p
        ON o.id = p.order_id
      WHERE o.status != 'CANCELLED' AND o.payment_status != 'PAID'
    `).get().pending;
    
    // Total debts
    const totalDebts = db.prepare(`
      SELECT COALESCE(SUM(balance), 0) as amount FROM debts
      WHERE status != 'CANCELADO' AND status != 'PAGO'
    `).get();
    
    // Current cash (from open shift movements)
    let currentCash = 0;
    const openShift = db.prepare("SELECT id FROM cash_shifts WHERE status = 'OPEN' ORDER BY opened_at DESC LIMIT 1").get();
    if (openShift) {
      const movements = db.prepare('SELECT * FROM cash_movements WHERE shift_id = ?').all(openShift.id);
      currentCash = movements.reduce((s, m) => {
        if (['SALE', 'INITIAL_FLOAT', 'DEBT_PAYMENT', 'INFLOW'].includes(m.type)) return s + m.amount;
        if (['WITHDRAWAL', 'EXPENSE', 'OUTFLOW'].includes(m.type)) return s - m.amount;
        return s;
      }, 0);
    }
    
    // Sales by seller
    const salesBySeller = db.prepare(`
      SELECT u.id, u.name, COALESCE(SUM(o.total), 0) as total, COUNT(o.id) as orders_count
      FROM users u
      LEFT JOIN orders o ON o.seller_id = u.id AND date(o.created_at) = date('now') AND o.status != 'CANCELLED'
      WHERE u.status = 'ACTIVE'
      GROUP BY u.id
      ORDER BY total DESC
    `).all();
    
    // Average ticket
    const avgTicket = db.prepare(`
      SELECT COALESCE(AVG(total), 0) as avg_ticket
      FROM orders WHERE date(created_at) = date('now') AND status != 'CANCELLED'
    `).get();
    
    // Estimated margin (using cost_price from products)
    const margin = db.prepare(`
      SELECT 
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
        COALESCE(SUM(COALESCE(oi.unit_cost, 0) * oi.quantity), 0) as estimated_cost
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE date(o.created_at) = date('now') AND o.status != 'CANCELLED'
    `).get();
    
    const estimatedMargin = margin.revenue > 0 ? margin.revenue - margin.estimated_cost : 0;
    const marginPct = margin.revenue > 0 ? (estimatedMargin / margin.revenue) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        today: {
          sales: todaySales.amount,
          orders_count: todaySales.count,
          received: paymentsToday.received,
          pending: pendingAmount
        },
        month: {
          sales: monthSales.amount,
          orders_count: monthSales.count
        },
        pending_orders: pendingOrders.count,
        top_products: topProducts,
        critical_stock: criticalStock,
        clients_count: clientsCount.count,
        total_debts: totalDebts.amount,
        current_cash: currentCash,
        sales_by_seller: salesBySeller,
        average_ticket: avgTicket.avg_ticket,
        margin: {
          revenue: margin.revenue,
          estimated_cost: margin.estimated_cost,
          estimated_margin: estimatedMargin,
          margin_pct: marginPct
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao obter estatísticas do painel: ' + err.message });
  }
});

module.exports = router;
