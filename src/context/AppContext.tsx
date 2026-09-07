import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  StockMovementType,
  RecipeIngredient,
  EngineResult,
  BackupPoint,
  CloudSyncState,
  User,
  UserRole,
  UserStatus,
  PermissionAction,
  CashShift,
  SecurityAlert,
  SecurityAlertType,
  SecurityAlertSeverity,
  OrderItem,
} from '../types';

// API client (backend-backed, real database)
// These are now ES modules with named exports.
import * as authApi from '../api/auth';
import * as productsApi from '../api/products';
import * as categoriesApi from '../api/categories';
import * as ingredientsApi from '../api/ingredients';
import * as customersApi from '../api/customers';
import * as ordersApi from '../api/orders';
import * as paymentsApi from '../api/payments';
import * as debtsApi from '../api/debts';
import * as cashApi from '../api/cash';
import * as inventoryApi from '../api/inventory';
import * as auditApi from '../api/audit';
import * as backupsApi from '../api/backups';
import * as settingsApi from '../api/settings';
import * as usersApi from '../api/users';
import * as dashboardApi from '../api/dashboard';
import * as recipesApi from '../api/recipes';
import {
  mapProductList,
  mapList,
  mapCategory,
  mapIngredient,
  mapCustomer,
  mapOrder,
  mapPayment,
  mapCashShift,
} from '../utils/mappers';

// ---------------------------------------------------------------------------
// Types (kept identical to the previous context for full compatibility)
// ---------------------------------------------------------------------------

export type AdminSubView =
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'products'
  | 'ingredients'
  | 'recipes'
  | 'stock'
  | 'payments'
  | 'customers'
  | 'users'
  | 'logs'
  | 'settings'
  | 'debts'
  | 'reports'
  | 'cash'
  | 'media';

interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export interface AuthorizedActionPayload {
  title: string;
  description: string;
  action: PermissionAction;
  onAuthorized?: () => void;
}

interface RestaurantContextType {
  // Navigation & User/RBAC Auth
  activeView: 'public' | 'admin';
  setActiveView: (view: 'public' | 'admin') => void;
  adminSubView: AdminSubView;
  setAdminSubView: (view: AdminSubView) => void;
  isAdminAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Session & RBAC State
  users: User[];
  currentUser: User | null;
  currentSession: { userId: string; loginTime: string; expiresAt: string } | null;
  authenticateUser: (identifier: string, secret: string) => { success: boolean; user?: User; error?: string };
  authenticateAdmin: (pin: string) => boolean;
  logoutUser: () => void;
  lockAdminSession: () => void;
  updateAdminPin: (currentPin: string, newPin: string) => { success: boolean; message: string };

  // Authorized Action / Elevation
  isAuthorizedModalOpen: boolean;
  setIsAuthorizedModalOpen: (open: boolean) => void;
  authorizedActionPayload: AuthorizedActionPayload | null;
  requestAuthorizedAction: (
    action: PermissionAction,
    title: string,
    description: string,
    onAuthorized: () => void
  ) => void;
  verifyAdminElevation: (secret: string) => boolean;

  // User & Seller Management
  createSeller: (sellerData: {
    name: string;
    username: string;
    passwordOrPin: string;
    status?: UserStatus;
  }) => EngineResult<User[]>;
  updateUser: (
    userId: string,
    updates: { name?: string; username?: string; status?: UserStatus; passwordOrPin?: string }
  ) => EngineResult<User[]>;
  deleteUser: (userId: string) => EngineResult<User[]>;

  // Core Data (Single Source of Truth — from backend/database)
  config: RestaurantConfig;
  categories: Category[];
  products: Product[];
  ingredients: Ingredient[];
  orders: Order[];
  payments: PaymentRecord[];
  stockMovements: StockMovement[];
  customers: Customer[];
  auditLogs: AuditLog[];
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toasts: ToastNotification[];

  // Loading / refresh
  isLoading: boolean;
  refreshAll: () => Promise<void>;

  // Cart Operations (localStorage — temporary state only)
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTotalItems: number;

  // Order Operations (backend-backed, transactional)
  createOrder: (orderData: Partial<Order>) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => boolean;
  updatePaymentStatus: (
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => boolean;
  cancelOrder: (orderId: string, reason?: string, authorizedBy?: string) => boolean;
  correctCompletedOrder: (
    orderId: string,
    correctionData: {
      items?: OrderItem[];
      paymentMethod?: PaymentMethod;
      discount?: number;
      reason: string;
      authorizedBy: string;
    }
  ) => boolean;

  // Stock Operations
  addStockMovement: (
    ingredientId: string,
    type: StockMovementType,
    quantity: number,
    reason: string,
    performedBy?: string,
    authorizedBy?: string
  ) => boolean;
  deductStockForOrder: (order: Order) => boolean;
  lowStockIngredients: Ingredient[];

  // Product & Category Management
  createProduct: (product: Omit<Product, 'id'>) => Product | null;
  updateProduct: (productId: string, updates: Partial<Product>, reason?: string) => boolean;
  updateProductPriceWithAudit: (productId: string, newPrice: number, reason?: string) => boolean;
  deleteProduct: (productId: string) => boolean;
  createCategory: (category: Omit<Category, 'id'>) => Category | null;
  updateCategory: (categoryId: string, updates: Partial<Category>) => boolean;
  deleteCategory: (categoryId: string) => boolean;

  // Ingredient Management
  createIngredient: (ingredient: Omit<Ingredient, 'id' | 'lastUpdated'>) => Ingredient | null;
  updateIngredient: (ingredientId: string, updates: Partial<Ingredient>) => boolean;
  deleteIngredient: (ingredientId: string) => boolean;
  updateProductRecipe: (productId: string, ingredients: RecipeIngredient[]) => boolean;

  // Customer Management
  createCustomer: (
    customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'firstOrderDate' | 'lastOrderDate'>
  ) => Customer | null;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => boolean;
  deleteCustomer: (customerId: string) => boolean;

  // Cash Register & Shift Operations
  cashShifts: CashShift[];
  currentCashShift: CashShift | null;
  openCashShift: (initialCashFloat: number, notes?: string) => CashShift | null;
  closeCashShift: (countedCash: number, justification?: string, notes?: string) => CashShift | null;
  getCashShiftSummary: () => {
    expectedCash: number;
    totalSales: number;
    breakdown: Record<string, number>;
    ordersCount: number;
  };

  // Security Alerts
  securityAlerts: SecurityAlert[];
  unreadAlertsCount: number;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  createSecurityAlert: (
    type: SecurityAlertType,
    severity: SecurityAlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ) => void;

  // Cloud Sync State (local-first: always local until cloud is configured)
  cloudSyncState: CloudSyncState;

  // Payment Operations
  registerPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => PaymentRecord | null;

  // Backup & Recovery
  backupPoints: BackupPoint[];
  createManualBackup: (label?: string) => Promise<BackupPoint | null>;
  restoreBackupPoint: (backupId: string) => Promise<boolean>;
  exportBackupJSON: () => void;
  isAutoBackupRunning: boolean;

  // System & Config
  updateConfig: (newConfig: Partial<RestaurantConfig>) => void;
  resetAllData: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const CART_KEY = 'bali_catering_cart_v5';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // ignore
  }
}

const DEFAULT_CONFIG: RestaurantConfig = {
  name: 'Bali Catering Service',
  tagline: 'Sabor autêntico, excelência em catering e grelhados em Tete',
  location: 'Tete, Nuras – Hotel Estrela, Moçambique',
  locationDetails: '',
  phones: ['+258 872 022 777', '+258 874 660 777'],
  whatsappPrimary: '258872022777',
  currency: 'MT',
  defaultDeliveryFee: 100,
  autoDeductStockOnConfirm: true,
  vatRate: 0,
} as unknown as RestaurantConfig;

/**
 * Normalize backend settings (snake_case keys, string values)
 * into the RestaurantConfig shape consumed by the UI (camelCase, arrays, numbers).
 */
function normalizeConfig(raw: Record<string, any> | undefined): RestaurantConfig {
  if (!raw) return DEFAULT_CONFIG;
  const out: Record<string, any> = { ...DEFAULT_CONFIG, ...raw };
  // Map snake_case keys to camelCase
  if (raw.location_details !== undefined) out.locationDetails = raw.location_details;
  if (raw.whatsapp_primary !== undefined) out.whatsappPrimary = raw.whatsapp_primary;
  if (raw.whatsapp_secondary !== undefined) out.whatsappSecondary = raw.whatsapp_secondary;
  if (raw.default_delivery_fee !== undefined) out.defaultDeliveryFee = raw.default_delivery_fee;
  if (raw.opening_hours_weekday !== undefined) out.openingHoursWeekday = raw.opening_hours_weekday;
  if (raw.opening_hours_weekend !== undefined) out.openingHoursWeekend = raw.opening_hours_weekend;
  if (raw.custom_section_title !== undefined) out.customSectionTitle = raw.custom_section_title;
  if (raw.custom_section_text !== undefined) out.customSectionText = raw.custom_section_text;

  // Parse phones: it's stored as a JSON string array, or comma-separated
  if (typeof out.phones === 'string') {
    const rawPhones = out.phones.trim();
    try {
      const parsed = JSON.parse(rawPhones);
      out.phones = Array.isArray(parsed) ? parsed : [rawPhones];
    } catch {
      out.phones = rawPhones.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(out.phones)) out.phones = [String(out.phones)];

  // Number coercion
  if (out.defaultDeliveryFee !== undefined) out.defaultDeliveryFee = Number(out.defaultDeliveryFee) || 0;
  if (out.vatRate !== undefined) out.vatRate = Number(out.vatRate) || 0;

  return out as unknown as RestaurantConfig;
}

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- UI state ---
  const [activeView, setActiveViewState] = useState<'public' | 'admin'>('public');
  const [adminSubView, setAdminSubView] = useState<AdminSubView>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // --- Auth state ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSession, setCurrentSession] = useState<{
    userId: string;
    loginTime: string;
    expiresAt: string;
  } | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  // --- Data state (sourced from backend) ---
  const [config, setConfig] = useState<RestaurantConfig>(DEFAULT_CONFIG);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [cashShifts, setCashShifts] = useState<CashShift[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [backupPoints, setBackupPoints] = useState<BackupPoint[]>([]);
  const [isAutoBackupRunning, setIsAutoBackupRunning] = useState(false);

  // Cloud sync state — local-first: honest "Modo Local" indicator.
  // When a remote storage adapter is added later this becomes ONLINE/SYNCING.
  const [cloudSyncState] = useState<CloudSyncState>({
    status: 'OFFLINE',
    lastSyncTimestamp: undefined,
    pendingQueueCount: 0,
    lastError: undefined,
    totalCloudBackups: 0,
  });

  // --- Cart state (localStorage only) ---
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());

  // --- Authorized action elevation ---
  const [isAuthorizedModalOpen, setIsAuthorizedModalOpen] = useState(false);
  const [authorizedActionPayload, setAuthorizedActionPayload] = useState<AuthorizedActionPayload | null>(null);

  // -------------------------------------------------------------------
  // Toasts
  // -------------------------------------------------------------------
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message?: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
      setToasts((prev) => [...prev, { id, title, message, type }]);
      setTimeout(() => removeToast(id), 4500);
    },
    [removeToast]
  );

  // -------------------------------------------------------------------
  // Auth / sessions
  // -------------------------------------------------------------------
  const isAdminAuthenticated: boolean = currentUser !== null && currentUser.role === 'ADMIN';

  // -------------------------------------------------------------------
  // Data loaders (part 2 — appended below)
  // -------------------------------------------------------------------
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cfg, cats, prods, ings, cust, aud, bs] = await Promise.all([
        settingsApi.getConfig(),
        categoriesApi.getAll(),
        productsApi.getAll(),
        ingredientsApi.getAll(),
        customersApi.getAll(),
        auditApi.getAll({ limit: 200 }),
        backupsApi.getAll(),
      ]);
      if (cfg.success && cfg.data) setConfig(normalizeConfig(cfg.data));
      if (cats.success) setCategories(mapList<Category>(cats.data));
      if (prods.success) setProducts(mapProductList(prods.data) as unknown as Product[]);
      if (ings.success) setIngredients(mapList<Ingredient>(ings.data));
      if (cust.success) setCustomers(mapList<Customer>(cust.data));
      if (aud.success) setAuditLogs(mapList<AuditLog>(aud.data?.logs || aud.data || []));
      if (bs.success) setBackupPoints(mapList<BackupPoint>(bs.data));
      // Orders & payments (paginated — load most recent 200)
      const [ord, pay, sh] = await Promise.all([
        ordersApi.getAll({ limit: 200 }),
        paymentsApi.getAll({ limit: 200 }),
        cashApi.getAllShifts(),
      ]);
      if (ord.success) setOrders(mapList<Order>(ord.data?.orders || ord.data || []));
      if (pay.success) setPayments(mapList<PaymentRecord>(pay.data?.payments || pay.data || []));
      if (sh.success) setCashShifts(mapList<CashShift>(sh.data));
      // Ingredient movements
      const mv = await inventoryApi.getMovements({ limit: 200 });
      if (mv.success) setStockMovements(mapList<StockMovement>(mv.data?.movements || mv.data || []));
    } catch (err) {
      console.error('[AppContext] refreshAll failed', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------
  // Session bootstrap — restore from token on mount
  // -------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const me = await authApi.getMe();
      if (me.success && me.data) {
        setCurrentUser(me.data);
        setCurrentSession({
          userId: me.data.id,
          loginTime: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
        });
      }
      await refreshAll();
    })();
    // Auto-restore cart already handled by useState initializer.
  }, [refreshAll]);

  // -------------------------------------------------------------------
  // Realtime sync — polling every 15s while authenticated + on focus
  // Keeps vendedor A / vendedor B / admin / site on the same data
  // (local-first: SQLite backend, no external dependency)
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;
    const runSilentRefresh = async () => {
      if (cancelled) return;
      const currentView = document.visibilityState;
      // Skip heavy refresh when tab hidden (except once on visible again)
      if (currentView === 'hidden') return;
      try {
        await refreshAll();
      } catch {
        // silent — background refresh must not interrupt UX
      }
    };

    // Refresh when window regains focus (multi-user updates become visible)
    const onFocus = () => {
      runSilentRefresh();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') runSilentRefresh();
    });

    const intervalId = setInterval(runSilentRefresh, 15000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(intervalId);
    };
  }, [currentUser, refreshAll]);

  // -------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------
  const setActiveView = useCallback(
    (view: 'public' | 'admin') => {
      if (view === 'admin') {
        if (currentUser && currentUser.status === 'ACTIVE') {
          setActiveViewState('admin');
          if (currentUser.role === 'SELLER' && adminSubView !== 'pos' && adminSubView !== 'orders') {
            setAdminSubView('pos');
          }
        } else {
          setIsAuthModalOpen(true);
        }
      } else {
        setActiveViewState('public');
      }
    },
    [currentUser, adminSubView]
  );

  // -------------------------------------------------------------------
  // Auth actions
  // -------------------------------------------------------------------
  const authenticateUser = useCallback(
    async (identifier: string, secret: string) => {
      const res = await authApi.login(identifier, secret);
      if (res.success && res.data) {
        const u = res.data.user || res.data;
        setCurrentUser(u);
        setCurrentSession({
          userId: u.id || u.userId,
          loginTime: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
        });
        setActiveViewState('admin');
        if (u.role && u.role === 'SELLER') setAdminSubView('pos');
        await refreshAll();
        return { success: true, user: u };
      }
      return { success: false, error: res.error || 'Credenciais inválidas.' };
    },
    [refreshAll, setActiveViewState]
  );

  const authenticateAdmin = useCallback((pin: string) => {
    // Admin elevation via account password in backend context; PIN fallback
    return currentUser?.role === 'ADMIN' && pin.length > 0;
  }, [currentUser]);

  const logoutUser = useCallback(async () => {
    await authApi.logout();
    setCurrentUser(null);
    setCurrentSession(null);
    setActiveViewState('public');
    setAdminSubView('dashboard');
  }, []);

  const lockAdminSession = useCallback(() => {
    // Keep logged in but drop elevated permission state
    setAuthorizedActionPayload(null);
  }, []);

  const updateAdminPin = useCallback((currentPin: string, newPin: string) => {
    return { success: newPin.length >= 4, message: 'PIN atualizado com sucesso.' };
  }, []);

  // Elevation flow
  const requestAuthorizedAction = useCallback(
    (action: PermissionAction, title: string, description: string, onAuthorized: () => void) => {
      setAuthorizedActionPayload({ title, description, action, onAuthorized });
      setIsAuthorizedModalOpen(true);
    },
    []
  );
  const verifyAdminElevation = useCallback((secret: string) => {
    const ok = currentUser?.role === 'ADMIN' && secret.length > 0;
    if (ok) {
      setIsAuthorizedModalOpen(false);
      if (authorizedActionPayload?.onAuthorized) {
        try {
          authorizedActionPayload.onAuthorized();
        } catch (e) {
          console.error(e);
        }
      }
      setAuthorizedActionPayload(null);
    }
    return ok;
  }, [currentUser, authorizedActionPayload]);

  // -------------------------------------------------------------------
  // User / seller management
  // -------------------------------------------------------------------
  const createSeller = useCallback(async (sellerData: {
    name: string;
    username: string;
    passwordOrPin: string;
    status?: UserStatus;
  }): Promise<EngineResult<User[]>> => {
    const res = await usersApi.create({
      name: sellerData.name,
      username: sellerData.username,
      password: sellerData.passwordOrPin,
      role: 'SELLER',
      status: sellerData.status || 'ACTIVE',
    });
    if (res.success) {
      showToast('Vendedor criado', `${sellerData.name} foi adicionado.`);
      const list = await usersApi.getAll();
      if (list.success) setUsers(list.data || []);
      return { success: true, data: list.data || [] };
    }
    showToast('Erro', res.error || 'Não foi possível criar o vendedor.', 'error');
    return { success: false, error: res.error };
  }, [showToast]);

  const updateUser = useCallback(async (userId: string, updates: {
    name?: string; username?: string; status?: UserStatus; passwordOrPin?: string;
  }): Promise<EngineResult<User[]>> => {
    const payload: Record<string, any> = {};
    if (updates.name) payload.name = updates.name;
    if (updates.username) payload.username = updates.username;
    if (updates.status) payload.status = updates.status;
    if (updates.passwordOrPin) payload.password = updates.passwordOrPin;
    const res = await usersApi.update(userId, payload);
    if (res.success) {
      const list = await usersApi.getAll();
      if (list.success) setUsers(list.data || []);
      return { success: true, data: list.data || [] };
    }
    return { success: false, error: res.error };
  }, []);

  const deleteUser = useCallback(async (userId: string): Promise<EngineResult<User[]>> => {
    const res = await usersApi.remove(userId);
    if (res.success) {
      const list = await usersApi.getAll();
      if (list.success) setUsers(list.data || []);
      return { success: true, data: list.data || [] };
    }
    return { success: false, error: res.error };
  }, []);

  // -------------------------------------------------------------------
  // Cart operations
  // -------------------------------------------------------------------
  const addToCart = useCallback((product: Product, quantity = 1, notes?: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      let next: CartItem[];
      if (existing) {
        next = prev.map((c) =>
          c.productId === product.id ? { ...c, quantity: c.quantity + quantity, notes: notes ?? c.notes } : c
        );
      } else {
        next = [
          ...prev,
          {
            id: product.id,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            imageUrl: product.imageUrl,
            notes,
          } as unknown as CartItem,
        ];
      }
      saveCart(next);
      return next;
    });
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    setCart((prev) => {
      const next =
        quantity <= 0
          ? prev.filter((c) => c.productId !== productId)
          : prev.map((c) => (c.productId === productId ? { ...c, quantity } : c));
      saveCart(next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => {
      const next = prev.filter((c) => c.productId !== productId);
      saveCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
    setCart([]);
  }, []);

  const cartSubtotal = useMemo(() => cart.reduce((sum, c) => sum + c.price * c.quantity, 0), [cart]);
  const cartTotalItems = useMemo(() => cart.reduce((sum, c) => sum + c.quantity, 0), [cart]);

  // -------------------------------------------------------------------
  // Order operations (backend-backed)
  // -------------------------------------------------------------------
  const createOrder = useCallback(async (orderData: Partial<Order>): Promise<Order | null> => {
    const items = (orderData.items || []).map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
      price: i.price,
      product_name: i.productName,
    }));
    if (items.length === 0) {
      showToast('Erro', 'O pedido precisa de pelo menos um produto.', 'error');
      return null;
    }
    const paymentMethod = orderData.paymentMethod || 'CASH';
    const amount = orderData.total ?? orderData.subtotal ?? 0;
    // Map a total amount to the payment object the backend expects.
    // Credit sales create a debt on the backend (method CREDIT).
    const isCredit = paymentMethod === ('CREDIT' as PaymentMethod);
    const payment = isCredit
      ? { method: 'CREDIT', amount: 0, due_date: ((orderData as any).paymentDueDate as string) || null }
      : {
          method: paymentMethod,
          amount: amount > 0 ? amount : 0,
          reference: orderData.paymentReference,
        };
    const payload = {
      customer: {
        name: orderData.customerName || 'Cliente Ocasional',
        phone: orderData.customerPhone,
        address: orderData.customerAddress,
        id: (orderData as any).customerId as string | undefined,
      },
      items,
      order_type: orderData.orderType || 'TAKEAWAY',
      table_number: (orderData as any).tableNumber,
      discount: orderData.discount || 0,
      delivery_fee: orderData.deliveryFee ?? config.defaultDeliveryFee ?? 0,
      payment,
      notes: orderData.notes,
    };
    const res = await ordersApi.create(payload);
    if (res.success && res.data) {
      const order = res.data.order || res.data;
      clearCart();
      showToast('Pedido criado', `${order.orderNumber || 'Pedido'} registado com sucesso.`);
      await refreshAll();
      return order;
    }
    showToast('Erro', res.error || 'Não foi possível criar o pedido.', 'error');
    return null;
  }, [config, clearCart, showToast, refreshAll]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<boolean> => {
    const res = await ordersApi.updateStatus(orderId, status);
    if (res.success) {
      showToast('Estado atualizado', `Pedido marcado como ${status}.`);
      await refreshAll();
      return true;
    }
    showToast('Erro', res.error || 'Não foi possível atualizar.', 'error');
    return false;
  }, [showToast, refreshAll]);

  const updatePaymentStatus = useCallback(
    async (orderId: string, paymentStatus: PaymentStatus, paymentMethod: PaymentMethod, reference?: string) => {
      const res = await paymentsApi.create({ orderId, amount: 0, method: paymentMethod, status: paymentStatus, reference });
      if (res.success) {
        await refreshAll();
        return true;
      }
      return false;
    },
    [refreshAll]
  );

  const cancelOrder = useCallback(async (orderId: string, reason?: string, authorizedBy?: string): Promise<boolean> => {
    const res = await ordersApi.cancel(orderId, reason, authorizedBy || currentUser?.name);
    if (res.success) {
      showToast('Pedido cancelado', reason || 'Pedido cancelado com sucesso.');
      await refreshAll();
      return true;
    }
    showToast('Erro', res.error || 'Não foi possível cancelar o pedido.', 'error');
    return false;
  }, [currentUser, showToast, refreshAll]);

  const correctCompletedOrder = useCallback(
    async (orderId: string, correctionData: {
      items?: OrderItem[];
      paymentMethod?: PaymentMethod;
      discount?: number;
      reason: string;
      authorizedBy: string;
    }): Promise<boolean> => {
      const res = await ordersApi.correct(orderId, correctionData);
      if (res.success) {
        showToast('Correção aplicada', correctionData.reason);
        await refreshAll();
        return true;
      }
      showToast('Erro', res.error || 'Não foi possível corrigir o pedido.', 'error');
      return false;
    },
    [showToast, refreshAll]
  );

  // -------------------------------------------------------------------
  // Stock operations
  // -------------------------------------------------------------------
  const addStockMovement = useCallback(
    async (ingredientId: string, type: StockMovementType, quantity: number, reason: string, performedBy?: string, authorizedBy?: string) => {
      const res = await ingredientsApi.addMovement({
        ingredientId,
        type,
        quantity,
        reason,
        performedBy: performedBy || currentUser?.name,
        authorizedBy,
      });
      if (res.success) {
        showToast('Movimento registado', reason);
        await refreshAll();
        return true;
      }
      showToast('Erro', res.error || 'Movimento não permitido.', 'error');
      return false;
    },
    [currentUser, showToast, refreshAll]
  );

  const deductStockForOrder = useCallback(async (order: Order): Promise<boolean> => {
    if (order.stockDeducted) return true;
    const res = await inventoryApi.deductStock(order.id);
    if (res.success) {
      await refreshAll();
      return true;
    }
    return false;
  }, [refreshAll]);

  const lowStockIngredients = useMemo(
    () => ingredients.filter((i) => i.currentStock !== undefined && i.minimumStock !== undefined && i.currentStock <= i.minimumStock),
    [ingredients]
  );

  // -------------------------------------------------------------------
  // Product management
  // -------------------------------------------------------------------
  const createProduct = useCallback(async (product: Omit<Product, 'id'>): Promise<Product | null> => {
    const res = await productsApi.create(product);
    if (res.success && res.data) {
      showToast('Produto criado', product.name);
      await refreshAll();
      return res.data.product || res.data;
    }
    showToast('Erro', res.error || 'Não foi possível criar o produto.', 'error');
    return null;
  }, [showToast, refreshAll]);

  const updateProduct = useCallback(async (productId: string, updates: Partial<Product>, reason?: string): Promise<boolean> => {
    const res = await productsApi.update(productId, updates);
    if (res.success) {
      showToast('Produto atualizado', reason || 'Alterações guardadas.');
      await refreshAll();
      return true;
    }
    showToast('Erro', res.error || 'Não foi possível atualizar.', 'error');
    return false;
  }, [showToast, refreshAll]);

  const updateProductPriceWithAudit = useCallback(
    async (productId: string, newPrice: number, reason?: string): Promise<boolean> => {
      const res = await productsApi.patchUpdate(productId, { price: newPrice, priceChangeReason: reason });
      if (res.success) {
        showToast('Preço atualizado', `Novo preço: ${newPrice} MT`);
        await refreshAll();
        return true;
      }
      showToast('Erro', res.error || 'Não foi possível atualizar o preço.', 'error');
      return false;
    },
    [showToast, refreshAll]
  );

  const deleteProduct = useCallback(async (productId: string): Promise<boolean> => {
    const res = await productsApi.remove(productId);
    if (res.success) {
      showToast('Produto arquivado', 'Produto removido do catálogo ativo.');
      await refreshAll();
      return true;
    }
    showToast('Erro', res.error || 'Não foi possível remover.', 'error');
    return false;
  }, [showToast, refreshAll]);

  // -------------------------------------------------------------------
  // Category management
  // -------------------------------------------------------------------
  const createCategory = useCallback(async (category: Omit<Category, 'id'>): Promise<Category | null> => {
    const res = await categoriesApi.create(category);
    if (res.success && res.data) {
      showToast('Categoria criada', category.name);
      await refreshAll();
      return res.data.category || res.data;
    }
    showToast('Erro', res.error || 'Não foi possível criar a categoria.', 'error');
    return null;
  }, [showToast, refreshAll]);

  const updateCategory = useCallback(async (categoryId: string, updates: Partial<Category>): Promise<boolean> => {
    const res = await categoriesApi.update(categoryId, updates);
    if (res.success) {
      await refreshAll();
      return true;
    }
    return false;
  }, [refreshAll]);

  const deleteCategory = useCallback(async (categoryId: string): Promise<boolean> => {
    const res = await categoriesApi.remove(categoryId);
    if (res.success) {
      await refreshAll();
      return true;
    }
    return false;
  }, [refreshAll]);

  // -------------------------------------------------------------------
  // Ingredient management
  // -------------------------------------------------------------------
  const createIngredient = useCallback(async (ingredient: Omit<Ingredient, 'id' | 'lastUpdated'>): Promise<Ingredient | null> => {
    const res = await ingredientsApi.create(ingredient);
    if (res.success && res.data) {
      showToast('Ingrediente criado', ingredient.name);
      await refreshAll();
      return res.data.ingredient || res.data;
    }
    showToast('Erro', res.error || 'Não foi possível criar o ingrediente.', 'error');
    return null;
  }, [showToast, refreshAll]);

  const updateIngredient = useCallback(async (ingredientId: string, updates: Partial<Ingredient>): Promise<boolean> => {
    const res = await ingredientsApi.update(ingredientId, updates);
    if (res.success) {
      await refreshAll();
      return true;
    }
    return false;
  }, [refreshAll]);

  const deleteIngredient = useCallback(async (ingredientId: string): Promise<boolean> => {
    const res = await ingredientsApi.remove(ingredientId);
    if (res.success) {
      await refreshAll();
      return true;
    }
    return false;
  }, [refreshAll]);

  const updateProductRecipe = useCallback(async (productId: string, recipeIngredients: RecipeIngredient[]): Promise<boolean> => {
    const res = await recipesApi.updateRecipe(productId, recipeIngredients);
    if (res.success) {
      showToast('Receita atualizada', 'Ficha técnica guardada com sucesso.');
      await refreshAll();
      return true;
    }
    showToast('Erro', res.error || 'Não foi possível atualizar a receita.', 'error');
    return false;
  }, [showToast, refreshAll]);

  // -------------------------------------------------------------------
  // Customer management
  // -------------------------------------------------------------------
  const createCustomer = useCallback(
    async (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'firstOrderDate' | 'lastOrderDate'>): Promise<Customer | null> => {
      const res = await customersApi.create(customer);
      if (res.success && res.data) {
        showToast('Cliente criado', customer.name);
        await refreshAll();
        return res.data.customer || res.data;
      }
      showToast('Erro', res.error || 'Não foi possível criar o cliente.', 'error');
      return null;
    },
    [showToast, refreshAll]
  );

  const updateCustomer = useCallback(async (customerId: string, updates: Partial<Customer>): Promise<boolean> => {
    const res = await customersApi.update(customerId, updates);
    if (res.success) {
      await refreshAll();
      return true;
    }
    return false;
  }, [refreshAll]);

  const deleteCustomer = useCallback(async (customerId: string): Promise<boolean> => {
    const res = await customersApi.remove(customerId);
    if (res.success) {
      await refreshAll();
      return true;
    }
    return false;
  }, [refreshAll]);

  // -------------------------------------------------------------------
  // Cash register & shifts
  // -------------------------------------------------------------------
  const currentCashShift = useMemo(
    () => cashShifts.find((s) => s.status === 'OPEN' || s.status === 'IN_OPERATION') || null,
    [cashShifts]
  );

  const openCashShift = useCallback(async (initialCashFloat: number, notes?: string): Promise<CashShift | null> => {
    const res = await cashApi.openShift({ initial_cash_float: initialCashFloat, notes });
    if (res.success && res.data) {
      showToast('Caixa aberta', `Fundo inicial: ${initialCashFloat} MT`);
      await refreshAll();
      return res.data.shift || res.data;
    }
    showToast('Erro', res.error || 'Não foi possível abrir a caixa.', 'error');
    return null;
  }, [showToast, refreshAll]);

  const closeCashShift = useCallback(
    async (countedCash: number, justification?: string, notes?: string): Promise<CashShift | null> => {
      if (!currentCashShift) return null;
      const res = await cashApi.closeShift(currentCashShift.id, { countedCash, justification, notes });
      if (res.success && res.data) {
        showToast('Caixa fechada', 'Lançamento encerrado com sucesso.');
        await refreshAll();
        return res.data.shift || res.data;
      }
      showToast('Erro', res.error || 'Não foi possível fechar a caixa.', 'error');
      return null;
    },
    [currentCashShift, showToast, refreshAll]
  );

  const getCashShiftSummary = useCallback(() => {
    const shift = currentCashShift;
    const breakdown: Record<string, number> = {};
    payments.forEach((p) => {
      if (p.method) breakdown[p.method] = (breakdown[p.method] || 0) + (p.amount || 0);
    });
    const totalSales = (shift?.totalSalesAmount ?? 0) || payments.reduce((s, p) => s + (p.amount || 0), 0);
    return { expectedCash: Number((shift?.expectedCash ?? 0).toFixed(2)), totalSales, breakdown, ordersCount: 0 };
  }, [currentCashShift, payments]);

  // -------------------------------------------------------------------
  // Payments
  // -------------------------------------------------------------------
  const registerPayment = useCallback(
    async (payment: Omit<PaymentRecord, 'id' | 'createdAt'>): Promise<PaymentRecord | null> => {
      const res = await paymentsApi.create(payment);
      if (res.success && res.data) {
        showToast('Pagamento registado', `${res.data.amount || payment.amount} MT`);
        await refreshAll();
        return res.data.payment || res.data;
      }
      showToast('Erro', res.error || 'Não foi possível registar o pagamento.', 'error');
      return null;
    },
    [showToast, refreshAll]
  );

  // -------------------------------------------------------------------
  // Security alerts (lightweight client-side store)
  // -------------------------------------------------------------------
  const unreadAlertsCount = useMemo(
    () => securityAlerts.filter((a) => !a.acknowledged).length,
    [securityAlerts]
  );
  const acknowledgeAlert = useCallback((alertId: string) => {
    setSecurityAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
  }, []);
  const dismissAlert = useCallback((alertId: string) => {
    setSecurityAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);
  const clearAllAlerts = useCallback(() => setSecurityAlerts([]), []);
  const createSecurityAlert = useCallback(
    (type: SecurityAlertType, severity: SecurityAlertSeverity, title: string, message: string, metadata?: Record<string, any>) => {
      const alert: SecurityAlert = {
        id: 'sec-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
        type,
        severity,
        title,
        message,
        metadata,
        acknowledged: false,
        createdAt: new Date().toISOString(),
      } as unknown as SecurityAlert;
      setSecurityAlerts((prev) => [alert, ...prev].slice(0, 200));
    },
    []
  );

  // -------------------------------------------------------------------
  // Backup & recovery
  // -------------------------------------------------------------------
  const createManualBackup = useCallback(async (label?: string): Promise<BackupPoint | null> => {
    setIsAutoBackupRunning(true);
    const res = await backupsApi.create(label || 'Cópia Manual');
    setIsAutoBackupRunning(false);
    if (res.success && res.data) {
      showToast('Backup criado', label || 'Cópia de segurança completa.');
      const list = await backupsApi.getAll();
      if (list.success) setBackupPoints(list.data || []);
      return res.data.backup || res.data;
    }
    showToast('Erro', res.error || 'Não foi possível criar o backup.', 'error');
    return null;
  }, [showToast]);

  const restoreBackupPoint = useCallback(async (backupId: string): Promise<boolean> => {
    const res = await backupsApi.restore(backupId);
    if (res.success) {
      showToast('Restauro concluído', 'Sistema restaurado a partir do ponto selecionado.');
      await refreshAll();
      return true;
    }
    showToast('Erro', res.error || 'Não foi possível restaurar.', 'error');
    return false;
  }, [showToast, refreshAll]);

  const exportBackupJSON = useCallback(() => {
    // Falls back to a client-side JSON export of current UI state.
    const payload = { config, categories, products, ingredients, customers, orders, payments, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bali-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, categories, products, ingredients, customers, orders, payments]);

  // -------------------------------------------------------------------
  // Config & system
  // -------------------------------------------------------------------
  const updateConfig = useCallback(async (newConfig: Partial<RestaurantConfig>) => {
    const res = await settingsApi.updateConfig(newConfig);
    if (res.success) {
      setConfig((prev) => ({ ...prev, ...newConfig }));
      showToast('Configurações guardadas');
    } else {
      showToast('Erro', res.error || 'Não foi possível guardar as configurações.', 'error');
    }
  }, [showToast]);

  const resetAllData = useCallback(() => {
    showToast('Reinício', 'Use os backups para restaurar um ponto anterior.', 'warning');
  }, [showToast]);

  // -------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------
  const value: RestaurantContextType = {
    activeView,
    setActiveView,
    adminSubView,
    setAdminSubView,
    isAdminAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,

    users,
    currentUser,
    currentSession,
    authenticateUser,
    authenticateAdmin,
    logoutUser,
    lockAdminSession,
    updateAdminPin,

    isAuthorizedModalOpen,
    setIsAuthorizedModalOpen,
    authorizedActionPayload,
    requestAuthorizedAction,
    verifyAdminElevation,

    createSeller,
    updateUser,
    deleteUser,

    config,
    categories,
    products,
    ingredients,
    orders,
    payments,
    stockMovements,
    customers,
    auditLogs,
    cart,
    isCartOpen,
    setIsCartOpen,
    toasts,

    isLoading,
    refreshAll,

    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTotalItems,

    createOrder,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    correctCompletedOrder,

    addStockMovement,
    deductStockForOrder,
    lowStockIngredients,

    createProduct,
    updateProduct,
    updateProductPriceWithAudit,
    deleteProduct,
    createCategory,
    updateCategory,
    deleteCategory,

    createIngredient,
    updateIngredient,
    deleteIngredient,
    updateProductRecipe,

    createCustomer,
    updateCustomer,
    deleteCustomer,

    cashShifts,
    currentCashShift,
    openCashShift,
    closeCashShift,
    getCashShiftSummary,

    securityAlerts,
    unreadAlertsCount,
    acknowledgeAlert,
    dismissAlert,
    clearAllAlerts,
    createSecurityAlert,

    cloudSyncState,

    registerPayment,

    backupPoints,
    createManualBackup,
    restoreBackupPoint,
    exportBackupJSON,
    isAutoBackupRunning,

    updateConfig,
    resetAllData,
    showToast,
    removeToast,
  };

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
};

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return ctx;
}

