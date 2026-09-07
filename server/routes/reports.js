const express = require('express');
const { getDb } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function getDateRange(period, date_from, date_to) {
  const now = new Date();
  switch (period) {
    case 'today': {
      const d = now.toISOString().split('T')[0];
      return { from: `${d}T00:00:00Z`, to: `${d}T23:59:59Z`, label: 'Hoje' };
    }
    case 'week': {
      const day = now.getDay() || 7;
      const from = new Date(now);
      from.setDate(now.getDate() - day + 1);
      from.setHours(0, 0, 0, 0);
      return {
        from: from.toISOString(),
        to: now.toISOString(),
        label: 'Esta semana'
      };
    }
    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        from: from.toISOString(),
        to: now.toISOString(),
        label: 'Este mês'
      };
    }
    case 'custom': {
      if (!date_from || !date_to) {
        throw new Error('Para período personalizado, indique date_from e date_to');
      }
      return { from: `${date_from}T00:00:00Z`, to: `${date_to}T23:59:59Z`, label: 'Personalizado' };
    }
    default:
      throw new Error('Período inválido. Use: today, week, month, custom');
  }
}

// GET /api/reports/sales
router.get('/sales', requireAuth, requireAdmin, (req, res) => {
  try {
    const { period = 'today', date_from, date_to } = req.query;
    const db = getDb();
    const range = getDateRange(period, date_from, date_to);
    
    const orders = db.prepare(`
      SELECT o.*, u.name as seller_name
      FROM orders o
      LEFT JOIN users u ON o.seller_id = u.id
      WHERE o.created_at >= ? AND o.created_at <= ? AND o.status != 'CANCELLED'
      ORDER BY o.created_at DESC
    `).all(range.from, range.to);
    
    const summary = db.prepare(`
      SELECT 
        COUNT(*) as orders_count,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(AVG(total), 0) as average_ticket,
        COALESCE(SUM(CASE WHEN payment_status = 'PAID' THEN total END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN payment_status = 'PENDING' THEN total END), 0) as pending_amount
      FROM orders
      WHERE created_at >= ? AND created_at <= ? AND status != 'CANCELLED'
    `).get(range.from, range.to);
    
    // Daily breakdown
    const daily = db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as orders_count, COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE created_at >= ? AND created_at <= ? AND status != 'CANCELLED'
      GROUP BY date(created_at)
      ORDER BY day ASC
    `).all(range.from, range.to);
    
    res.json({
      success: true,
      data: {
        period: { type: period, label: range.label, from: range.from, to: range.to },
        summary,
        daily,
        orders
      }
    });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('inválido') || msg.includes('Personalizado')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao gerar relatório de vendas: ' + err.message });
  }
});

// GET /api/reports/financial
router.get('/financial', requireAuth, requireAdmin, (req, res) => {
  try {
    const { period = 'month', date_from, date_to } = req.query;
    const db = getDb();
    const range = getDateRange(period, date_from, date_to);
    
    const revenue = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total FROM orders
      WHERE created_at >= ? AND created_at <= ? AND status != 'CANCELLED'
    `).get(range.from, range.to);
    
    const payments = db.prepare(`
      SELECT method, COALESCE(SUM(amount), 0) as total, COUNT(*) as count
      FROM payments
      WHERE created_at >= ? AND created_at <= ?
      GROUP BY method
    `).all(range.from, range.to);
    
    const debtsInPeriod = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(original_amount), 0) as created,
        COALESCE(SUM(amount_paid), 0) as collected
      FROM debts
      WHERE created_at >= ? AND created_at <= ?
    `).get(range.from, range.to);
    
    const summary = {
      total_revenue: revenue.total,
      total_payments: payments.reduce((s, p) => s + p.total, 0),
      by_method: payments,
      debts: {
        count: debtsInPeriod.count || 0,
        created: debtsInPeriod.created || 0,
        collected: debtsInPeriod.collected || 0,
        outstanding: (debtsInPeriod.created || 0) - (debtsInPeriod.collected || 0)
      }
    };
    
    res.json({ success: true, data: { period: range.label, summary } });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('inválido') || msg.includes('Personalizado')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao gerar relatório financeiro: ' + err.message });
  }
});

// GET /api/reports/stock
router.get('/stock', requireAuth, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    
    const inventory = db.prepare(`
      SELECT 
        COUNT(*) as total_ingredients,
        SUM(CASE WHEN current_stock <= minimum_stock THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock_count,
        COALESCE(SUM(current_stock * cost_per_unit), 0) as total_value
      FROM ingredients WHERE status = 'ACTIVE'
    `).get();
    
    const movements = db.prepare(`
      SELECT type, COUNT(*) as count, COALESCE(SUM(quantity), 0) as total_quantity
      FROM inventory_movements
      WHERE date(created_at) = date('now')
      GROUP BY type
    `).all();
    
    const waste = db.prepare(`
      SELECT im.ingredient_name, im.quantity, im.unit, im.reason, im.created_at
      FROM inventory_movements im
      WHERE im.type = 'EXIT_WASTE' AND date(im.created_at) = date('now')
      ORDER BY im.created_at DESC
    `).all();
    
    const wasteValue = db.prepare(`
      SELECT COALESCE(SUM(im.quantity * i.cost_per_unit), 0) as value
      FROM inventory_movements im
      JOIN ingredients i ON im.ingredient_id = i.id
      WHERE im.type = 'EXIT_WASTE' AND date(im.created_at) = date('now')
    `).get();
    
    res.json({
      success: true,
      data: {
        inventory,
        movements_today: movements,
        waste_today: waste,
        waste_value_today: wasteValue.value
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao gerar relatório de stock: ' + err.message });
  }
});

// GET /api/reports/sellers
router.get('/sellers', requireAuth, requireAdmin, (req, res) => {
  try {
    const { period = 'month', date_from, date_to } = req.query;
    const db = getDb();
    const range = getDateRange(period, date_from, date_to);
    
    const sellers = db.prepare(`
      SELECT 
        u.id, u.name as seller_name,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(o.total), 0) as total_sales,
        COALESCE(AVG(o.total), 0) as average_ticket
      FROM users u
      LEFT JOIN orders o ON o.seller_id = u.id
        AND o.created_at >= ? AND o.created_at <= ? AND o.status != 'CANCELLED'
      GROUP BY u.id
      ORDER BY total_sales DESC
    `).all(range.from, range.to);
    
    res.json({ success: true, data: { period: range.label, sellers } });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('inválido') || msg.includes('Personalizado')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao gerar relatório de vendedores: ' + err.message });
  }
});

// GET /api/reports/products
router.get('/products', requireAuth, requireAdmin, (req, res) => {
  try {
    const { period = 'month', date_from, date_to } = req.query;
    const db = getDb();
    const range = getDateRange(period, date_from, date_to);
    
    const products = db.prepare(`
      SELECT 
        oi.product_id, oi.product_name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.price * oi.quantity) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= ? AND o.created_at <= ? AND o.status != 'CANCELLED'
      GROUP BY oi.product_id
      ORDER BY revenue DESC
    `).all(range.from, range.to);
    
    const summary = {
      total_products: products.length,
      total_units: products.reduce((s, p) => s + p.quantity_sold, 0),
      total_revenue: products.reduce((s, p) => s + p.revenue, 0),
      top_product: products.length > 0 ? products[0] : null
    };
    
    res.json({ success: true, data: { period: range.label, summary, products } });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('inválido') || msg.includes('Personalizado')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Erro ao gerar relatório de produtos: ' + err.message });
  }
});

// GET /api/reports/export/:type
router.get('/export/:type', requireAuth, requireAdmin, (req, res) => {
  try {
    const { type } = req.params;
    const db = getDb();
    
    let rows;
    let headers;
    let filename;
    
    switch (type) {
      case 'orders': {
        rows = db.prepare(`
          SELECT o.id, o.order_number, o.status, o.payment_status, o.total,
            o.subtotal, o.discount, o.delivery_fee, o.created_at, u.name as seller
          FROM orders o
          LEFT JOIN users u ON o.seller_id = u.id
          ORDER BY o.created_at DESC
        `).all();
        headers = ['ID', 'Número', 'Status', 'Pagamento', 'Total (MT)', 'Subtotal (MT)', 'Desconto', 'Entrega', 'Data', 'Vendedor'];
        filename = 'encomendas.csv';
        break;
      }
      case 'payments': {
        rows = db.prepare(`
          SELECT p.id, p.amount, p.method, p.reference, p.created_at,
            p.order_number, p.customer_name, u.name as received_by
          FROM payments p
          LEFT JOIN users u ON p.received_by = u.id
          ORDER BY p.created_at DESC
        `).all();
        headers = ['ID', 'Montante (MT)', 'Método', 'Referência', 'Data', 'Encomenda', 'Cliente', 'Recebido por'];
        filename = 'pagamentos.csv';
        break;
      }
      case 'customers': {
        rows = db.prepare(`
          SELECT c.id, c.name, c.phone, c.whatsapp, c.email, c.address, c.created_at,
            c.total_orders, c.total_spent
          FROM customers c WHERE c.status = 'ACTIVE'
          ORDER BY c.name
        `).all();
        headers = ['ID', 'Nome', 'Telefone', 'WhatsApp', 'Email', 'Endereço', 'Criado', 'Nº Encomendas', 'Total Gasto (MT)'];
        filename = 'clientes.csv';
        break;
      }
      case 'debts': {
        rows = db.prepare(`
          SELECT d.id, d.customer_name, d.original_amount, d.amount_paid,
            d.balance, d.status, d.due_date, d.created_at, d.order_number
          FROM debts d
          WHERE d.status != 'CANCELADO'
          ORDER BY d.created_at DESC
        `).all();
        headers = ['ID', 'Cliente', 'Valor Original (MT)', 'Pago (MT)', 'Saldo (MT)', 'Status', 'Vencimento', 'Criado', 'Encomenda'];
        filename = 'dividas.csv';
        break;
      }
      case 'stock': {
        rows = db.prepare(`
          SELECT i.id, i.name, i.unit, i.current_stock, i.minimum_stock,
            i.cost_per_unit, (i.current_stock * i.cost_per_unit) as total_value, i.category, i.supplier
          FROM ingredients i WHERE i.status = 'ACTIVE'
          ORDER BY i.name
        `).all();
        headers = ['ID', 'Nome', 'Unidade', 'Stock', 'Stock Mínimo', 'Custo/Unidade (MT)', 'Valor Total (MT)', 'Categoria', 'Fornecedor'];
        filename = 'stock.csv';
        break;
      }
      default:
        return res.status(400).json({ success: false, error: 'Tipo de exportação inválido. Use: orders, payments, customers, debts, stock' });
    }
    
    // Build CSV
    let csv = headers.join(',') + '\n';
    for (const row of rows) {
      const values = headers.map((h, idx) => {
        const key = Object.values(row)[idx] !== undefined ? Object.values(row)[idx] : '';
        if (key === null || key === undefined) return '';
        return `"${String(key).replace(/"/g, '""')}"`;
      });
      csv += values.join(',') + '\n';
    }
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao exportar dados: ' + err.message });
  }
});

module.exports = router;
