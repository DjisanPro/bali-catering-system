export type UnitOfMeasure = 'kg' | 'g' | 'l' | 'ml' | 'un' | 'porcao';

export type StockMovementType = 'ENTRY' | 'EXIT_ORDER' | 'EXIT_WASTE' | 'ADJUSTMENT';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'EVENT_CATERING';

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID';

export type PaymentMethod = 'CASH' | 'MPESA' | 'EMOLA' | 'POS_CARD' | 'BANK_TRANSFER';

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description?: string;
  displayOrder: number;
}

export interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  unit: UnitOfMeasure;
  quantity: number; // Quantity needed per product unit
}

export interface ProductPriceHistory {
  price: number;
  previousPrice: number;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // in Meticais (MT)
  costPrice?: number; // Calculated or estimated
  imageUrl: string;
  isAvailable: boolean;
  status?: 'ACTIVE' | 'INACTIVE'; // Soft delete support
  isDeleted?: boolean;
  isSpecialty?: boolean;
  isFeatured?: boolean;
  isSeasonal?: boolean;
  availabilityDays?: string[]; // e.g., ['Domingo', 'Segunda'] for Dobrada
  preparationTimeMinutes: number;
  ingredients: RecipeIngredient[];
  priceHistory?: ProductPriceHistory[];
}

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: UnitOfMeasure;
  currentStock: number;
  minimumStock: number;
  costPerUnit: number; // Cost in MT per unit
  supplier?: string;
  status?: 'ACTIVE' | 'INACTIVE'; // Soft delete support
  isDeleted?: boolean;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  ingredientName: string;
  unit: UnitOfMeasure;
  type: StockMovementType;
  quantity: number; // Always positive magnitude
  previousStock: number;
  newStock: number;
  reason: string;
  referenceOrderId?: string;
  referenceOrderNumber?: string;
  performedBy: string;
  authorizedBy?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number; // Historical snapshot at moment of sale
  quantity: number;
  unitCost?: number;
  notes?: string;
}

export interface OrderCorrectionRecord {
  id: string;
  orderId?: string;
  orderNumber?: string;
  timestamp: string;
  previousItems: OrderItem[];
  newItems?: OrderItem[];
  previousTotal: number;
  newTotal: number;
  previousPaymentMethod: PaymentMethod;
  newPaymentMethod: PaymentMethod;
  reason: string;
  correctedBy: string;
  authorizedBy: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "BC-1042"
  idempotencyKey?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  orderType: OrderType;
  tableNumber?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  stockDeducted: boolean;
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  authorizedBy?: string;
  corrections?: OrderCorrectionRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  receiptNumber?: string;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'PAID';
  notes?: string;
  createdAt: string;
  receivedBy: string;
  shiftId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  status?: 'ACTIVE' | 'ARCHIVED'; // Soft delete support
  isArchived?: boolean;
  totalOrders: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
}

export type CashShiftStatus = 'OPEN' | 'IN_OPERATION' | 'CLOSED';

export interface CashShiftPaymentBreakdown {
  cash: number;
  mpesa: number;
  emola: number;
  posCard: number;
  bankTransfer: number;
}

export interface CashShift {
  id: string;
  shiftNumber: number;
  status: CashShiftStatus;
  openedBy: string;
  openedByUserId?: string;
  openedByRole: UserRole;
  openedAt: string;
  initialCashFloat: number; // Fundo de caixa inicial em MT
  closedBy?: string;
  closedByUserId?: string;
  closedAt?: string;
  expectedCash: number; // Initial float + Cash sales
  countedCash?: number; // Physical cash counted at close
  cashDiscrepancy?: number; // Counted - Expected (negative = quebra, positive = sobra)
  totalSalesAmount: number;
  ordersCount: number;
  paymentBreakdown: CashShiftPaymentBreakdown;
  notes?: string;
  discrepancyJustification?: string;
  auditLogIds?: string[];
}

export type SecurityAlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SecurityAlertType =
  | 'BRUTE_FORCE_LOGIN'
  | 'LARGE_STOCK_ADJUSTMENT'
  | 'PRICE_ALTERATION'
  | 'ORDER_CANCELLATION'
  | 'ORDER_CORRECTION'
  | 'ORDER_CORRECTION_ATTEMPT'
  | 'STOCK_ANOMALY'
  | 'BACKUP_RESTORE'
  | 'UNAUTHORIZED_ATTEMPT'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'CASH_DISCREPANCY'
  | 'DATA_PURGE_ATTEMPT';

export interface SecurityAlert {
  id: string;
  type: SecurityAlertType;
  severity: SecurityAlertSeverity;
  title: string;
  message: string;
  user: string;
  userRole?: UserRole;
  timestamp: string;
  acknowledged?: boolean;
  metadata?: Record<string, any>;
}

export type UserRole = 'ADMIN' | 'SELLER';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string; // e.g. "USR-ADMIN-01", "USR-VEND-01"
  name: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string; // Salted cryptographic hash, never plaintext
  salt: string;
  pinHash?: string; // Optional fast PIN hash
  pinSalt?: string;
  createdAt: string;
  lastActivity: string;
  createdById?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
}

export interface UserSession {
  sessionId: string;
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  loginTime: string;
  lastActivityTime: string;
  expiresAt: string;
}

export type PermissionAction =
  | 'VIEW_DASHBOARD'
  | 'VIEW_POS'
  | 'CREATE_ORDER'
  | 'SEARCH_PRODUCT'
  | 'ADD_PRODUCT'
  | 'UPDATE_ORDER_QUANTITY'
  | 'RECEIVE_PAYMENT'
  | 'SELECT_PAYMENT_METHOD'
  | 'COMPLETE_SALE'
  | 'VIEW_ORDERS_FOR_SERVICE'
  | 'VIEW_CUSTOMER_MINIMAL'
  | 'CLOSE_SESSION'
  // Admin-restricted operations (Engine-enforced rejection for SELLER):
  | 'CHANGE_PRODUCT_PRICE'
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'UPDATE_RECIPE'
  | 'CREATE_INGREDIENT'
  | 'UPDATE_INGREDIENT'
  | 'DELETE_INGREDIENT'
  | 'MANUAL_STOCK_ADJUSTMENT'
  | 'DELETE_ORDER'
  | 'CANCEL_COMPLETED_SALE'
  | 'MODIFY_COMPLETED_SALE'
  | 'VIEW_FULL_FINANCIALS'
  | 'DELETE_PAYMENT'
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'DELETE_CUSTOMER'
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_USERS'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'UPDATE_CONFIG'
  | 'CREATE_BACKUP'
  | 'RESTORE_BACKUP'
  | 'RESET_DATA';

export interface AuditLog {
  id: string;
  action: string;
  entity: 'PRODUCT' | 'ORDER' | 'STOCK' | 'PAYMENT' | 'INGREDIENT' | 'SETTING' | 'CUSTOMER' | 'USER' | 'AUTH' | 'SECURITY';
  entityId: string;
  description: string;
  user: string;
  userId?: string;
  userRole?: UserRole;
  previousValue?: string;
  newValue?: string;
  result?: 'SUCCESS' | 'REJECTED_UNAUTHORIZED' | 'FAILED';
  timestamp: string;
}

export interface RestaurantConfig {
  name: string;
  tagline: string;
  location: string;
  locationDetails: string;
  phones: string[];
  whatsappPrimary: string;
  whatsappSecondary: string;
  email: string;
  currency: string;
  defaultDeliveryFee: number;
  openingHoursWeekday: string;
  openingHoursWeekend: string;
  autoDeductStockOnConfirm: boolean;
  allowNegativeStock?: boolean;
  specialNotice?: string;
  adminPinCode?: string;
}

export interface EngineResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: string[];
  rollbackApplied?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export type BackupStatus = 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'PENDING';

export type BackupSource =
  | 'AUTOMATIC_TIMER'
  | 'CRITICAL_OPERATION'
  | 'MANUAL_ADMIN'
  | 'PRE_RESTORE_SNAPSHOT'
  | 'CLOUD_SYNC';

export type SyncStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNC_ERROR';

export interface FullRestaurantDataState {
  version: string;
  config: RestaurantConfig;
  categories: Category[];
  products: Product[];
  ingredients: Ingredient[];
  orders: Order[];
  payments: PaymentRecord[];
  stockMovements: StockMovement[];
  customers: Customer[];
  cashShifts?: CashShift[];
  securityAlerts?: SecurityAlert[];
  users?: User[];
  auditLogs: AuditLog[];
  exportedAt: string;
}

export interface BackupPoint {
  id: string; // e.g. "BACKUP-001" or "SNAPSHOT-PRE-RESTORE-17290..."
  sequenceNumber: number;
  label: string;
  source: BackupSource;
  status: BackupStatus;
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
    cashShifts?: number;
    auditLogs: number;
    users?: number;
  };
  performedBy: string;
  isPreRestoreSnapshot?: boolean;
  errorMessage?: string;
  dataPayload?: FullRestaurantDataState;
}

export interface ConflictLog {
  id: string;
  entityType: 'ORDER' | 'STOCK' | 'PRODUCT' | 'CUSTOMER' | 'CONFIG';
  entityId: string;
  localVersion: string;
  remoteVersion: string;
  resolvedStrategy: 'TIMESTAMP_WINS' | 'PRESERVE_LOCAL' | 'FORCE_REMOTE';
  description: string;
  timestamp: string;
}

export interface CloudSyncState {
  status: SyncStatus;
  lastSyncTimestamp?: string;
  pendingQueueCount: number;
  lastError?: string;
  totalCloudBackups: number;
}
