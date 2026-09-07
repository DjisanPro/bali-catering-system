const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { getDb, UPLOADS_DIR, BACKUPS_DIR } = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const ingredientRoutes = require('./routes/ingredients');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const debtRoutes = require('./routes/debts');
const cashRoutes = require('./routes/cash');
const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');
const backupRoutes = require('./routes/backups');
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');
const recipeRoutes = require('./routes/recipes');

const { requireAuth } = require('./middleware/auth');

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure uploads directories exist
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'data', 'uploads')));

  // Health check
  app.get('/api/health', (req, res) => {
    const db = getDb();
    let dbStatus = 'ok';
    try {
      db.prepare('SELECT 1').get();
    } catch (e) {
      dbStatus = 'error: ' + e.message;
    }
    res.json({
      success: true,
      status: 'ok',
      service: 'Bali Catering API',
      serverTime: new Date().toISOString(),
      database: dbStatus
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/ingredients', ingredientRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/debts', debtRoutes);
  app.use('/api/cash', cashRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/backups', backupRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/recipes', recipeRoutes);

  // Once token-based auth is set up, protect all /api routes by default
  // The individual routes handle their own auth requirements

  // Vite middleware for development vs static in production
  if (!isProd) {
    const { createServer: createViteServer } = require('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: process.cwd(),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  // Initialize database (migrations will run via the migrations module)
  try {
    const db = getDb();
    db.pragma('journal_mode = WAL');
    
    // Try to run migrations if available
    try {
      const migrations = require('./database/migrations');
      if (typeof migrations.migrate === 'function') {
        migrations.migrate();
      }
    } catch (migErr) {
      console.log('[DB] Migrations module not found or already applied:', migErr.message);
    }
    
    console.log('[DB] Database initialized successfully');
  } catch (dbErr) {
    console.error('[DB] Failed to initialize database:', dbErr.message);
    // Don't crash - schema may be created by a separate process
  }

  // Error handler
  app.use((err, req, res, next) => {
    console.error('[Server Error]', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Erro interno do servidor'
    });
  });

  // 404 handler for API
  app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: 'Rota não encontrada' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌴 Bali Catering API running on http://0.0.0.0:${PORT}`);
    console.log(`   Environment: ${isProd ? 'production' : 'development'}`);
    console.log(`   Uploads: ${UPLOADS_DIR}`);
    console.log(`   Backups: ${BACKUPS_DIR}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
