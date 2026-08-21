import {
  BackupPoint,
  BackupSource,
  BackupStatus,
  FullRestaurantDataState,
  SyncStatus,
  ConflictLog,
  AuditLog,
  RestaurantConfig,
  Product,
  Ingredient,
  Order,
  PaymentRecord,
  Customer,
  StockMovement,
  Category,
} from '../types';
import { storageEngine } from './storageEngine';

const BACKUP_INDEX_KEY = 'bali_catering_backup_points_v4';
const OFFLINE_QUEUE_KEY = 'bali_catering_backup_offline_queue_v4';
const CONFLICT_LOGS_KEY = 'bali_catering_conflict_logs_v4';

// Fast simple deterministic checksum calculation (FNV-1a / Murmur-like 32-bit hex)
export function calculateChecksum(content: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    hash ^= content.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `CHK-${hex.toUpperCase()}-${content.length}`;
}

export const backupEngine = {
  /**
   * Retrieves all local backup metadata records
   */
  getLocalBackupPoints(): BackupPoint[] {
    try {
      const raw = localStorage.getItem(BACKUP_INDEX_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Saves updated list of backup metadata
   */
  saveLocalBackupPoints(points: BackupPoint[]): void {
    try {
      localStorage.setItem(BACKUP_INDEX_KEY, JSON.stringify(points));
    } catch (err) {
      console.error('Failed to save local backup points list:', err);
    }
  },

  /**
   * Generates next sequential backup ID (e.g. BACKUP-001, BACKUP-002, ...)
   */
  getNextBackupId(points: BackupPoint[], prefix = 'BACKUP'): { id: string; seq: number } {
    const regularBackups = points.filter((p) => p.id.startsWith(`${prefix}-`));
    const highestSeq = regularBackups.reduce((max, p) => Math.max(max, p.sequenceNumber || 0), 0);
    const nextSeq = highestSeq + 1;
    const padded = String(nextSeq).padStart(3, '0');
    return {
      id: `${prefix}-${padded}`,
      seq: nextSeq,
    };
  },

  /**
   * Extracts full operational state from storageEngine
   */
  captureCurrentState(): FullRestaurantDataState {
    const config = storageEngine.loadConfig();
    const categories = storageEngine.loadCategories();
    const products = storageEngine.loadProducts();
    const ingredients = storageEngine.loadIngredients();
    const orders = storageEngine.loadOrders();
    const payments = storageEngine.loadPayments();
    const stockMovements = storageEngine.loadStockMovements();
    const customers = storageEngine.loadCustomers();
    const cashShifts = storageEngine.loadCashShifts();
    const securityAlerts = storageEngine.loadSecurityAlerts();
    const auditLogs = storageEngine.loadAuditLogs();

    return {
      version: '1.0.0',
      config,
      categories,
      products,
      ingredients,
      orders,
      payments,
      stockMovements,
      customers,
      cashShifts,
      securityAlerts,
      auditLogs,
      exportedAt: new Date().toISOString(),
    };
  },

  /**
   * Validates full backup payload schema and structural integrity
   */
  validateBackupIntegrity(data: any): {
    isValid: boolean;
    errors: string[];
    itemCounts?: BackupPoint['itemCounts'];
  } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['O ficheiro ou carga de backup é inválido ou está vazio.'] };
    }

    if (!data.config || typeof data.config !== 'object') {
      errors.push('Configurações do restaurante ausentes ou inválidas.');
    }
    if (!Array.isArray(data.products)) {
      errors.push('Lista de produtos inválida ou corrompida.');
    }
    if (!Array.isArray(data.ingredients)) {
      errors.push('Lista de insumos/estoque inválida ou corrompida.');
    }
    if (!Array.isArray(data.orders)) {
      errors.push('Histórico de pedidos inválido ou corrompido.');
    }
    if (!Array.isArray(data.payments)) {
      errors.push('Histórico de pagamentos inválido ou corrompido.');
    }
    if (!Array.isArray(data.customers)) {
      errors.push('Base de clientes inválida ou corrompida.');
    }
    if (!Array.isArray(data.stockMovements)) {
      errors.push('Movimentações de estoque inválidas ou corrompidas.');
    }
    if (!Array.isArray(data.auditLogs)) {
      errors.push('Registos de auditoria inválidos ou corrompidos.');
    }

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      errors: [],
      itemCounts: {
        products: data.products.length,
        ingredients: data.ingredients.length,
        orders: data.orders.length,
        payments: data.payments.length,
        customers: data.customers.length,
        stockMovements: data.stockMovements.length,
        auditLogs: data.auditLogs.length,
      },
    };
  },

  /**
   * Creates a new versioned backup point with both local and cloud persistence
   */
  async createBackup(
    source: BackupSource,
    label: string,
    performedBy = 'Sistema',
    isPreRestore = false
  ): Promise<{ success: boolean; backupPoint?: BackupPoint; error?: string }> {
    try {
      const state = this.captureCurrentState();
      const serialized = JSON.stringify(state);
      const sizeBytes = new Blob([serialized]).size;
      const checksum = calculateChecksum(serialized);

      const existingPoints = this.getLocalBackupPoints();
      const prefix = isPreRestore ? 'SNAPSHOT-PRE-RESTORE' : 'BACKUP';
      const { id, seq } = this.getNextBackupId(existingPoints, prefix);

      const backupPoint: BackupPoint = {
        id,
        sequenceNumber: seq,
        label: label.trim(),
        source,
        status: 'SUCCESS',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        sizeBytes,
        checksum,
        itemCounts: {
          products: state.products.length,
          ingredients: state.ingredients.length,
          orders: state.orders.length,
          payments: state.payments.length,
          customers: state.customers.length,
          stockMovements: state.stockMovements.length,
          auditLogs: state.auditLogs.length,
        },
        performedBy,
        isPreRestoreSnapshot: isPreRestore,
        dataPayload: state,
      };

      // 1. Save locally
      // Keep up to 25 local snapshots (with payload) to protect memory
      const updatedPoints = [backupPoint, ...existingPoints.slice(0, 24)];
      this.saveLocalBackupPoints(updatedPoints);

      // 2. Also save to separate local storage key for direct lookup
      try {
        localStorage.setItem(`bali_backup_payload_${backupPoint.id}`, serialized);
      } catch (e) {
        console.warn('LocalStorage quota limit reached for individual payload cache, metadata preserved.');
      }

      // 3. Replicate to Backend Cloud Storage (/api/cloud/backups/create)
      try {
        const response = await fetch('/api/cloud/backups/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            backupPoint: {
              ...backupPoint,
              dataPayload: undefined, // remove from metadata body
            },
            dataPayload: state,
          }),
        });

        if (!response.ok) {
          console.warn('Cloud replication responded with non-200 status.');
        }
      } catch (cloudErr) {
        console.warn('Cloud sync is currently offline. Backup stored locally.', cloudErr);
      }

      return {
        success: true,
        backupPoint,
      };
    } catch (err: any) {
      console.error('Failed to create backup:', err);
      return {
        success: false,
        error: err.message || 'Erro desconhecido ao gerar cópia de segurança.',
      };
    }
  },

  /**
   * Retrieves full data payload for a backup point (from memory, local payload key, or cloud API)
   */
  async getBackupPayload(backupId: string): Promise<FullRestaurantDataState | null> {
    // 1. Check local index with payload
    const points = this.getLocalBackupPoints();
    const local = points.find((p) => p.id === backupId);
    if (local && local.dataPayload) {
      return local.dataPayload;
    }

    // 2. Check local individual key
    const rawLocal = localStorage.getItem(`bali_backup_payload_${backupId}`);
    if (rawLocal) {
      try {
        return JSON.parse(rawLocal);
      } catch {}
    }

    // 3. Fetch from Cloud API (/api/cloud/backups/restore/:id)
    try {
      const res = await fetch(`/api/cloud/backups/restore/${backupId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch backup from cloud server:', e);
    }

    return null;
  },

  /**
   * Executes safe restoration with mandatory pre-restore safety snapshot
   */
  async restoreBackup(
    backupId: string,
    performedBy = 'Administrador',
    applyCallback: (restoredState: FullRestaurantDataState) => void
  ): Promise<{ success: boolean; safetySnapshotId?: string; error?: string }> {
    try {
      // 1. Fetch data payload
      const payload = await this.getBackupPayload(backupId);
      if (!payload) {
        return {
          success: false,
          error: `Não foi possível recuperar os dados do ponto ${backupId}.`,
        };
      }

      // 2. Validate payload integrity
      const validation = this.validateBackupIntegrity(payload);
      if (!validation.isValid) {
        return {
          success: false,
          error: `O backup está corrompido: ${validation.errors.join(', ')}`,
        };
      }

      // 3. CRITICAL: Create Safety Snapshot of CURRENT state BEFORE restoring
      const snapshotResult = await this.createBackup(
        'PRE_RESTORE_SNAPSHOT',
        `Snapshot de Segurança Pré-Restauração de ${backupId}`,
        performedBy,
        true
      );

      // 4. Apply state to context via callback & storage
      applyCallback(payload);

      // 5. Update direct storage
      storageEngine.saveConfig(payload.config);
      storageEngine.saveCategories(payload.categories);
      storageEngine.saveProducts(payload.products);
      storageEngine.saveIngredients(payload.ingredients);
      storageEngine.saveOrders(payload.orders);
      storageEngine.savePayments(payload.payments);
      storageEngine.saveStockMovements(payload.stockMovements);
      storageEngine.saveCustomers(payload.customers);
      if (payload.cashShifts && Array.isArray(payload.cashShifts)) {
        storageEngine.saveCashShifts(payload.cashShifts);
      }
      if (payload.securityAlerts && Array.isArray(payload.securityAlerts)) {
        storageEngine.saveSecurityAlerts(payload.securityAlerts);
      }

      return {
        success: true,
        safetySnapshotId: snapshotResult.backupPoint?.id,
      };
    } catch (err: any) {
      console.error('Failed to restore backup:', err);
      return {
        success: false,
        error: err.message || 'Erro durante a restauração do backup.',
      };
    }
  },

  /**
   * Fetches remote backups list from cloud server
   */
  async fetchCloudBackups(): Promise<BackupPoint[]> {
    try {
      const res = await fetch('/api/cloud/backups');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.backups)) {
          return json.backups;
        }
      }
    } catch (e) {
      console.warn('Cloud backups endpoint unreachable:', e);
    }
    return [];
  },

  /**
   * Health & connectivity ping to cloud service
   */
  async pingCloudService(): Promise<{ online: boolean; backupCount: number; serverTime?: string }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const json = await res.json();
        return {
          online: true,
          backupCount: json.backupCount || 0,
          serverTime: json.serverTime,
        };
      }
    } catch {}
    return { online: false, backupCount: 0 };
  },

  /**
   * Conflict logging and resolution
   */
  getConflictLogs(): ConflictLog[] {
    try {
      const raw = localStorage.getItem(CONFLICT_LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  recordConflict(conflict: Omit<ConflictLog, 'id' | 'timestamp'>): void {
    try {
      const existing = this.getConflictLogs();
      const newEntry: ConflictLog = {
        ...conflict,
        id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(CONFLICT_LOGS_KEY, JSON.stringify([newEntry, ...existing.slice(0, 49)]));
    } catch (err) {
      console.error('Failed to record conflict log:', err);
    }
  },
};
