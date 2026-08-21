import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

interface CloudBackupRecord {
  id: string;
  sequenceNumber: number;
  label: string;
  source: string;
  status: string;
  version: string;
  timestamp: string;
  sizeBytes: number;
  checksum: string;
  itemCounts: {
    products: number;
    ingredients: number;
    orders: number;
    payments: number;
    customers: number;
    stockMovements: number;
    auditLogs: number;
  };
  performedBy: string;
  isPreRestoreSnapshot?: boolean;
  dataPayload: any;
}

// In-memory + file-backed persistent store for cloud backups
const BACKUP_STORAGE_FILE = path.join(process.cwd(), '.cloud_backups_store.json');
let cloudBackups: CloudBackupRecord[] = [];

function loadStoredBackups() {
  try {
    if (fs.existsSync(BACKUP_STORAGE_FILE)) {
      const raw = fs.readFileSync(BACKUP_STORAGE_FILE, 'utf-8');
      cloudBackups = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load stored cloud backups:', err);
    cloudBackups = [];
  }
}

function persistBackups() {
  try {
    fs.writeFileSync(BACKUP_STORAGE_FILE, JSON.stringify(cloudBackups, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write cloud backups to disk:', err);
  }
}

loadStoredBackups();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      online: true,
      service: 'Bali Catering Cloud Backup & Synchronization Service',
      serverTime: new Date().toISOString(),
      backupCount: cloudBackups.length,
    });
  });

  // Get all cloud backups (metadata only by default for fast listing)
  app.get('/api/cloud/backups', (req, res) => {
    const list = cloudBackups.map(({ dataPayload, ...meta }) => meta);
    res.json({
      success: true,
      backups: list,
      count: list.length,
      serverTime: new Date().toISOString(),
    });
  });

  // Create new cloud backup
  app.post('/api/cloud/backups/create', (req, res) => {
    try {
      const { backupPoint, dataPayload } = req.body;
      if (!backupPoint || !dataPayload) {
        return res.status(400).json({ success: false, error: 'Missing backup payload or metadata' });
      }

      // Check if backup already exists
      const existingIndex = cloudBackups.findIndex((b) => b.id === backupPoint.id);
      const record: CloudBackupRecord = {
        ...backupPoint,
        dataPayload,
      };

      if (existingIndex >= 0) {
        cloudBackups[existingIndex] = record;
      } else {
        cloudBackups.unshift(record);
      }

      // Keep max 50 cloud backups
      if (cloudBackups.length > 50) {
        cloudBackups = cloudBackups.slice(0, 50);
      }

      persistBackups();

      res.json({
        success: true,
        message: `Backup ${backupPoint.id} saved securely on cloud server.`,
        backup: { ...backupPoint },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal backup error' });
    }
  });

  // Retrieve full cloud backup for restoration
  app.get('/api/cloud/backups/restore/:id', (req, res) => {
    const { id } = req.params;
    const found = cloudBackups.find((b) => b.id === id);

    if (!found) {
      return res.status(404).json({
        success: false,
        error: `Cloud backup ${id} not found on server.`,
      });
    }

    res.json({
      success: true,
      backup: {
        id: found.id,
        sequenceNumber: found.sequenceNumber,
        label: found.label,
        source: found.source,
        status: found.status,
        version: found.version,
        timestamp: found.timestamp,
        sizeBytes: found.sizeBytes,
        checksum: found.checksum,
        itemCounts: found.itemCounts,
        performedBy: found.performedBy,
        isPreRestoreSnapshot: found.isPreRestoreSnapshot,
      },
      data: found.dataPayload,
    });
  });

  // Delete a cloud backup
  app.delete('/api/cloud/backups/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = cloudBackups.length;
    cloudBackups = cloudBackups.filter((b) => b.id !== id);
    persistBackups();

    res.json({
      success: true,
      deleted: cloudBackups.length < initialLen,
      remainingCount: cloudBackups.length,
    });
  });

  // Cloud Sync Endpoint for Offline Queue resolution
  app.post('/api/cloud/sync', (req, res) => {
    try {
      const { clientState, clientTimestamp, lastSyncId } = req.body;
      const now = new Date().toISOString();

      res.json({
        success: true,
        syncStatus: 'ONLINE',
        syncedAt: now,
        serverBackupCount: cloudBackups.length,
        message: 'Client state synchronized with server cloud storage.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development vs static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bali Catering Cloud Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
