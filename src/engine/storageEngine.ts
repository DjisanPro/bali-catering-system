import {
  Category,
  Product,
  Ingredient,
  StockMovement,
  Order,
  PaymentRecord,
  Customer,
  AuditLog,
  RestaurantConfig,
  CartItem,
  User,
  UserSession,
  CashShift,
  SecurityAlert,
} from '../types';
import {
  INITIAL_CONFIG,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_INGREDIENTS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CASH_SHIFTS,
  INITIAL_SECURITY_ALERTS,
} from '../data/initialData';
import { INITIAL_USERS } from './userEngine';

const STORAGE_KEYS = {
  CONFIG: 'bali_catering_config_v4',
  CATEGORIES: 'bali_catering_categories_v4',
  PRODUCTS: 'bali_catering_products_v4',
  INGREDIENTS: 'bali_catering_ingredients_v4',
  ORDERS: 'bali_catering_orders_v4',
  PAYMENTS: 'bali_catering_payments_v4',
  MOVEMENTS: 'bali_catering_movements_v4',
  CUSTOMERS: 'bali_catering_customers_v4',
  LOGS: 'bali_catering_logs_v4',
  CART: 'bali_catering_cart_v4',
  USERS: 'bali_catering_users_v4',
  SESSION: 'bali_catering_session_v4',
  CASH_SHIFTS: 'bali_catering_shifts_v4',
  SECURITY_ALERTS: 'bali_catering_alerts_v4',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Storage save failure for key ${key}:`, err);
  }
}

export const storageEngine = {
  loadConfig: (): RestaurantConfig => safeGet(STORAGE_KEYS.CONFIG, INITIAL_CONFIG),
  saveConfig: (data: RestaurantConfig): void => safeSet(STORAGE_KEYS.CONFIG, data),

  loadCategories: (): Category[] => safeGet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
  saveCategories: (data: Category[]): void => safeSet(STORAGE_KEYS.CATEGORIES, data),

  loadProducts: (): Product[] => safeGet(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
  saveProducts: (data: Product[]): void => safeSet(STORAGE_KEYS.PRODUCTS, data),

  loadIngredients: (): Ingredient[] => safeGet(STORAGE_KEYS.INGREDIENTS, INITIAL_INGREDIENTS),
  saveIngredients: (data: Ingredient[]): void => safeSet(STORAGE_KEYS.INGREDIENTS, data),

  loadOrders: (): Order[] => safeGet(STORAGE_KEYS.ORDERS, INITIAL_ORDERS),
  saveOrders: (data: Order[]): void => safeSet(STORAGE_KEYS.ORDERS, data),

  loadPayments: (): PaymentRecord[] => safeGet(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS),
  savePayments: (data: PaymentRecord[]): void => safeSet(STORAGE_KEYS.PAYMENTS, data),

  loadStockMovements: (): StockMovement[] => safeGet(STORAGE_KEYS.MOVEMENTS, INITIAL_STOCK_MOVEMENTS),
  saveStockMovements: (data: StockMovement[]): void => safeSet(STORAGE_KEYS.MOVEMENTS, data),

  loadCustomers: (): Customer[] => safeGet(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
  saveCustomers: (data: Customer[]): void => safeSet(STORAGE_KEYS.CUSTOMERS, data),

  loadUsers: (): User[] => safeGet(STORAGE_KEYS.USERS, INITIAL_USERS),
  saveUsers: (data: User[]): void => safeSet(STORAGE_KEYS.USERS, data),

  loadSession: (): UserSession | null => safeGet(STORAGE_KEYS.SESSION, null),
  saveSession: (data: UserSession | null): void => safeSet(STORAGE_KEYS.SESSION, data),
  clearSession: (): void => localStorage.removeItem(STORAGE_KEYS.SESSION),

  loadAuditLogs: (): AuditLog[] => safeGet(STORAGE_KEYS.LOGS, INITIAL_AUDIT_LOGS),
  saveAuditLogs: (data: AuditLog[]): void => safeSet(STORAGE_KEYS.LOGS, data),

  loadCashShifts: (): CashShift[] => safeGet(STORAGE_KEYS.CASH_SHIFTS, INITIAL_CASH_SHIFTS),
  saveCashShifts: (data: CashShift[]): void => safeSet(STORAGE_KEYS.CASH_SHIFTS, data),

  loadSecurityAlerts: (): SecurityAlert[] => safeGet(STORAGE_KEYS.SECURITY_ALERTS, INITIAL_SECURITY_ALERTS),
  saveSecurityAlerts: (data: SecurityAlert[]): void => safeSet(STORAGE_KEYS.SECURITY_ALERTS, data),

  loadCart: (): CartItem[] => safeGet(STORAGE_KEYS.CART, []),
  saveCart: (data: CartItem[]): void => safeSet(STORAGE_KEYS.CART, data),

  clearAllData: (): void => {
    localStorage.clear();
  },

  exportFullBackup: (): string => {
    const fullState = {
      config: safeGet(STORAGE_KEYS.CONFIG, INITIAL_CONFIG),
      categories: safeGet(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
      products: safeGet(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
      ingredients: safeGet(STORAGE_KEYS.INGREDIENTS, INITIAL_INGREDIENTS),
      orders: safeGet(STORAGE_KEYS.ORDERS, INITIAL_ORDERS),
      payments: safeGet(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS),
      movements: safeGet(STORAGE_KEYS.MOVEMENTS, INITIAL_STOCK_MOVEMENTS),
      customers: safeGet(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
      users: safeGet(STORAGE_KEYS.USERS, INITIAL_USERS),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(fullState, null, 2);
  },
};
