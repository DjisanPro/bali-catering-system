import React, { createContext, useContext, useState, useEffect } from 'react';
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
  BackupSource,
  CloudSyncState,
  ConflictLog,
  FullRestaurantDataState,
  User,
  UserRole,
  UserStatus,
  UserSession,
  PermissionAction,
  CashShift,
  CashShiftPaymentBreakdown,
  SecurityAlert,
  SecurityAlertType,
  SecurityAlertSeverity,
  OrderCorrectionRecord,
  OrderItem,
} from '../types';
import {
  storageEngine,
  stockEngine,
  orderEngine,
  securityEngine,
  validationEngine,
  transactionEngine,
  backupEngine,
  userEngine,
  MAX_ACTIVE_SELLERS,
} from '../engine';

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
  | 'settings';

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
  currentSession: UserSession | null;
  authenticateUser: (identifier: string, secret: string) => { success: boolean; user?: User; error?: string };
  authenticateAdmin: (pin: string) => boolean;
  logoutUser: () => void;
  lockAdminSession: () => void;
  updateAdminPin: (currentPin: string, newPin: string) => { success: boolean; message: string };

  // Authorized Action / Elevation Mechanism
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

  // User & Seller Management (Enforcing MAX 5 active sellers)
  createSeller: (sellerData: {
    name: string;
    username: string;
    passwordOrPin: string;
    status?: UserStatus;
  }) => EngineResult<User>;
  updateUser: (
    userId: string,
    updates: {
      name?: string;
      username?: string;
      status?: UserStatus;
      passwordOrPin?: string;
    }
  ) => EngineResult<User[]>;
  deleteUser: (userId: string) => EngineResult<User[]>;

  // Core Data (Single Source of Truth)
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

  // Cart Operations
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTotalItems: number;

  // Order Operations (Atomic & Consistent)
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

  // Stock Operations (Controlled & Audited)
  addStockMovement: (
    ingredientId: string,
    type: StockMovementType,
    quantity: number,
    reason: string,
    performedBy?: string,
    authorizedBy?: string
  ) => boolean;
  deductStockForOrder: (order: Order) => boolean;

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

  // Cash Register & Shift Operations (Caixa Aberto, Em Operação, Fechado)
  cashShifts: CashShift[];
  currentCashShift: CashShift | null;
  openCashShift: (initialCashFloat: number, notes?: string) => CashShift | null;
  closeCashShift: (
    countedCash: number,
    justification?: string,
    notes?: string
  ) => CashShift | null;
  getCashShiftSummary: () => {
    expectedCash: number;
    totalSales: number;
    breakdown: CashShiftPaymentBreakdown;
    ordersCount: number;
  };

  // Security Alerts & Engine Audit Log Immutability
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

  // Operational Security Attack Simulator (7 Scenarios)
  runSecurityAttackSimulation: (scenarioId: string) => {
    scenarioId: string;
    scenarioName: string;
    attackerRole: string;
    attemptedAction: string;
    blocked: boolean;
    engineMessage: string;
    auditLogId?: string;
    alertGenerated?: boolean;
  };

  // Payment Operations
  registerPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => PaymentRecord | null;

  // Backup, Recovery & Cloud Persistence
  backupPoints: BackupPoint[];
  cloudSyncState: CloudSyncState;
  conflictLogs: ConflictLog[];
  isAutoBackupRunning: boolean;
  createManualBackup: (label?: string) => Promise<BackupPoint | null>;
  restoreBackupPoint: (backupId: string) => Promise<boolean>;
  importBackupJSON: (jsonString: string) => Promise<boolean>;
  exportBackupJSON: () => void;
  verifyCloudStatus: () => Promise<void>;

  // System & Config
  updateConfig: (newConfig: Partial<RestaurantConfig>) => void;
  resetAllData: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveViewState] = useState<'public' | 'admin'>('public');
  const [adminSubView, setAdminSubView] = useState<AdminSubView>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Users and Sessions State
  const [users, setUsers] = useState<User[]>(() => storageEngine.loadUsers());
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() => storageEngine.loadSession());

  // Derive Current User from session
  const currentUser: User | null = React.useMemo(() => {
    if (!currentSession) return null;
    return users.find((u) => u.id === currentSession.userId && u.status === 'ACTIVE') || null;
  }, [currentSession, users]);

  const isAdminAuthenticated: boolean = currentUser !== null && currentUser.role === 'ADMIN';

  // Authorized Action Modal State
  const [isAuthorizedModalOpen, setIsAuthorizedModalOpen] = useState(false);
  const [authorizedActionPayload, setAuthorizedActionPayload] = useState<AuthorizedActionPayload | null>(null);

  // Navigation controller with auth protection
  const setActiveView = (view: 'public' | 'admin') => {
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
  };

  // State initialization via storageEngine
  const [config, setConfig] = useState<RestaurantConfig>(() => storageEngine.loadConfig());
  const [categories, setCategories] = useState<Category[]>(() => storageEngine.loadCategories());
  const [products, setProducts] = useState<Product[]>(() => storageEngine.loadProducts());
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => storageEngine.loadIngredients());
  const [orders, setOrders] = useState<Order[]>(() => storageEngine.loadOrders());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => storageEngine.loadPayments());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => storageEngine.loadStockMovements());
  const [customers, setCustomers] = useState<Customer[]>(() => storageEngine.loadCustomers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storageEngine.loadAuditLogs());
  const [cart, setCart] = useState<CartItem[]>(() => storageEngine.loadCart());
  const [cashShifts, setCashShifts] = useState<CashShift[]>(() => storageEngine.loadCashShifts());
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(() => storageEngine.loadSecurityAlerts());

  // Derived active cash shift
  const currentCashShift = React.useMemo(() => {
    return cashShifts.find((s) => s.status === 'OPEN' || s.status === 'IN_OPERATION') || null;
  }, [cashShifts]);

  // Derived unread security alerts
  const unreadAlertsCount = React.useMemo(() => {
    return securityAlerts.filter((a) => !a.isRead && !a.isDismissed).length;
  }, [securityAlerts]);

  // Backup, Recovery & Cloud Synchronization State
  const [backupPoints, setBackupPoints] = useState<BackupPoint[]>(() =>
    backupEngine.getLocalBackupPoints()
  );
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>({
    status: typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE',
    pendingQueueCount: 0,
    totalCloudBackups: 0,
    lastSyncTimestamp: new Date().toISOString(),
  });
  const [conflictLogs, setConflictLogs] = useState<ConflictLog[]>(() =>
    backupEngine.getConflictLogs()
  );
  const [isAutoBackupRunning, setIsAutoBackupRunning] = useState(false);

  // Storage Sync Subscriptions
  useEffect(() => { storageEngine.saveConfig(config); }, [config]);
  useEffect(() => { storageEngine.saveCategories(categories); }, [categories]);
  useEffect(() => { storageEngine.saveProducts(products); }, [products]);
  useEffect(() => { storageEngine.saveIngredients(ingredients); }, [ingredients]);
  useEffect(() => { storageEngine.saveOrders(orders); }, [orders]);
  useEffect(() => { storageEngine.savePayments(payments); }, [payments]);
  useEffect(() => { storageEngine.saveStockMovements(stockMovements); }, [stockMovements]);
  useEffect(() => { storageEngine.saveCustomers(customers); }, [customers]);
  useEffect(() => { storageEngine.saveUsers(users); }, [users]);
  useEffect(() => { storageEngine.saveSession(currentSession); }, [currentSession]);
  useEffect(() => { storageEngine.saveAuditLogs(auditLogs); }, [auditLogs]);
  useEffect(() => { storageEngine.saveCart(cart); }, [cart]);
  useEffect(() => { storageEngine.saveCashShifts(cashShifts); }, [cashShifts]);
  useEffect(() => { storageEngine.saveSecurityAlerts(securityAlerts); }, [securityAlerts]);

  // Initial Backup baseline
  useEffect(() => {
    const initBackupSystem = async () => {
      const existing = backupEngine.getLocalBackupPoints();
      if (existing.length === 0) {
        await backupEngine.createBackup(
          'AUTOMATIC_TIMER',
          'Ponto Inicial de Referência do Sistema',
          'Sistema'
        );
        setBackupPoints(backupEngine.getLocalBackupPoints());
      }
    };
    initBackupSystem();
  }, []);

  // Periodic Automated Backup Interval (Every 5 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      setIsAutoBackupRunning(true);
      try {
        const result = await backupEngine.createBackup(
          'AUTOMATIC_TIMER',
          'Cópia de Segurança Periódica Automática',
          'Sistema'
        );
        if (result.success && result.backupPoint) {
          setBackupPoints(backupEngine.getLocalBackupPoints());
          setCloudSyncState((prev) => ({
            ...prev,
            lastSyncTimestamp: new Date().toISOString(),
          }));
        }
      } catch (e) {
        console.warn('Periodic backup cycle encountered an issue:', e);
      } finally {
        setIsAutoBackupRunning(false);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Toast feedback helper
  const showToast = (
    title: string,
    message?: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'success'
  ) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Structured Audit Logger with role and result
  const logAudit = (
    action: string,
    entity: AuditLog['entity'],
    entityId: string,
    description: string,
    user?: string,
    userId?: string,
    userRole?: UserRole,
    previousValue?: string,
    newValue?: string,
    result: AuditLog['result'] = 'SUCCESS'
  ) => {
    const userName =
      user ||
      (currentUser ? `${currentUser.role === 'ADMIN' ? 'ADMIN' : 'VENDEDOR'} (${currentUser.name})` : 'Sistema');
    const uId = userId || currentUser?.id;
    const uRole = userRole || currentUser?.role;

    const entry = securityEngine.createAuditEntry(
      action,
      entity,
      entityId,
      description,
      userName,
      uId,
      uRole,
      previousValue,
      newValue,
      result
    );
    setAuditLogs((prev) => [entry, ...prev]);
  };

  // Security Alert Handlers
  const createSecurityAlert = (
    type: SecurityAlertType,
    severity: SecurityAlertSeverity,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ) => {
    const alert = securityEngine.createSecurityAlert(
      type,
      severity,
      title,
      message,
      currentUser ? `${currentUser.role} (${currentUser.name})` : 'Sistema',
      currentUser?.role,
      metadata
    );
    setSecurityAlerts((prev) => [alert, ...prev]);

    if (severity === 'CRITICAL' || severity === 'HIGH') {
      showToast(`Alerta de Segurança [${severity}]`, title, 'error');
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setSecurityAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              isRead: true,
              acknowledgedBy: currentUser ? `${currentUser.role} (${currentUser.name})` : 'Admin',
              acknowledgedAt: new Date().toISOString(),
            }
          : a
      )
    );
  };

  const dismissAlert = (alertId: string) => {
    setSecurityAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isDismissed: true, isRead: true } : a))
    );
  };

  const clearAllAlerts = () => {
    setSecurityAlerts((prev) => prev.map((a) => ({ ...a, isDismissed: true, isRead: true })));
    showToast('Alertas Arquivados', 'Todos os alertas foram marcados como lidos e arquivados.');
  };

  // Authenticate user with password/PIN and role verification
  const authenticateUser = (
    identifier: string,
    secret: string
  ): { success: boolean; user?: User; error?: string } => {
    const authResult = userEngine.authenticate(identifier, secret, users);

    if (authResult.success && authResult.user) {
      const user = authResult.user;
      const session = userEngine.createSession(user);

      setCurrentSession(session);
      setActiveViewState('admin');

      // Default subview based on role
      if (user.role === 'SELLER') {
        setAdminSubView('pos');
      } else {
        setAdminSubView('dashboard');
      }

      setIsAuthModalOpen(false);

      // Update user last activity
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, lastActivity: new Date().toISOString() } : u))
      );

      logAudit(
        'Início de Sessão Autorizado',
        'AUTH',
        user.username,
        `Sessão iniciada como ${user.role} (${user.name}).`,
        `${user.role} (${user.name})`,
        user.id,
        user.role,
        undefined,
        undefined,
        'SUCCESS'
      );

      showToast(
        'Sessão Desbloqueada',
        `Bem-vindo, ${user.name}! Nível de acesso: ${user.role === 'ADMIN' ? 'Administrador (Boss)' : 'Vendedor (PDV)'}.`
      );

      return { success: true, user };
    } else {
      logAudit(
        'Tentativa de Login Falhada',
        'AUTH',
        identifier,
        `Tentativa de autenticação falhada para "${identifier}". Motivo: ${authResult.error}`,
        'Visitante',
        undefined,
        undefined,
        undefined,
        undefined,
        'FAILED'
      );
      return { success: false, error: authResult.error || 'Credenciais inválidas.' };
    }
  };

  // Backward compatible authenticateAdmin (authenticates admin user)
  const authenticateAdmin = (pin: string): boolean => {
    const result = authenticateUser('admin', pin);
    return result.success;
  };

  const logoutUser = () => {
    if (currentUser) {
      logAudit(
        'Encerramento de Sessão',
        'AUTH',
        currentUser.username,
        `Sessão de ${currentUser.name} finalizada.`,
        `${currentUser.role} (${currentUser.name})`,
        currentUser.id,
        currentUser.role
      );
    }
    setCurrentSession(null);
    storageEngine.clearSession();
    setActiveViewState('public');
    showToast('Sessão Encerrada', 'Sessão fechada com sucesso.', 'info');
  };

  const lockAdminSession = () => {
    logoutUser();
  };

  // Elevation verification for Authorized Actions
  const verifyAdminElevation = (secret: string): boolean => {
    const admin = users.find((u) => u.role === 'ADMIN');
    if (!admin) return false;

    const isValid = securityEngine.verifyHash(secret, admin.salt, admin.passwordHash);
    if (isValid) {
      logAudit(
        'Ação Administrativa Elevada',
        'AUTH',
        admin.id,
        'Credencial do Administrador confirmada para operação protegida.',
        `ADMIN (${admin.name})`,
        admin.id,
        'ADMIN',
        undefined,
        undefined,
        'SUCCESS'
      );
      return true;
    } else {
      logAudit(
        'Elevação de Ação Rejeitada',
        'AUTH',
        admin.id,
        'Tentativa de autorização administrativa falhou: PIN/Senha incorreto.',
        'Operador',
        currentUser?.id,
        currentUser?.role,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      return false;
    }
  };

  // Prompt for Authorized Action Elevation
  const requestAuthorizedAction = (
    action: PermissionAction,
    title: string,
    description: string,
    onAuthorized: () => void
  ) => {
    setAuthorizedActionPayload({
      action,
      title,
      description,
      onAuthorized,
    });
    setIsAuthorizedModalOpen(true);
  };

  // User Management Handlers (Enforcing MAX 5 active sellers)
  const createSeller = (sellerData: {
    name: string;
    username: string;
    passwordOrPin: string;
    status?: UserStatus;
  }): EngineResult<User> => {
    const check = userEngine.canPerformAction(currentUser, 'CREATE_USER');
    if (!check.allowed) {
      logAudit(
        'Tentativa de Criação de Utilizador Não Autorizada',
        'USER',
        sellerData.username,
        `Vendedor tentou cadastrar novo utilizador sem permissão.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      showToast('Acesso Negado', check.reason, 'error');
      return { success: false, error: check.reason };
    }

    const result = userEngine.createSeller(currentUser, sellerData, users);
    if (result.success && result.data) {
      setUsers((prev) => [...prev, result.data!]);
      logAudit(
        'Cadastro de Vendedor',
        'USER',
        result.data.username,
        `Novo vendedor "${result.data.name}" (@${result.data.username}) registado com sucesso.`
      );
      return result;
    } else {
      return result;
    }
  };

  const updateUser = (
    userId: string,
    updates: {
      name?: string;
      username?: string;
      status?: UserStatus;
      passwordOrPin?: string;
    }
  ): EngineResult<User[]> => {
    const check = userEngine.canPerformAction(currentUser, 'UPDATE_USER');
    if (!check.allowed) {
      logAudit(
        'Tentativa de Atualização de Utilizador Não Autorizada',
        'USER',
        userId,
        `Operação de edição de utilizador rejeitada por falta de permissão.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      showToast('Acesso Negado', check.reason, 'error');
      return { success: false, error: check.reason };
    }

    const result = userEngine.updateUser(currentUser, userId, updates, users);
    if (result.success && result.data) {
      setUsers(result.data);
      logAudit(
        'Atualização de Utilizador',
        'USER',
        userId,
        `Registo do utilizador ID ${userId} atualizado.`
      );
      return result;
    }
    return result;
  };

  const deleteUser = (userId: string): EngineResult<User[]> => {
    const check = userEngine.canPerformAction(currentUser, 'DELETE_USER');
    if (!check.allowed) {
      logAudit(
        'Tentativa de Remoção de Utilizador Rejeitada',
        'USER',
        userId,
        `Operação de remoção de utilizador rejeitada por falta de privilégios.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      showToast('Acesso Negado', check.reason, 'error');
      return { success: false, error: check.reason };
    }

    const result = userEngine.deleteUser(currentUser, userId, users);
    if (result.success && result.data) {
      setUsers(result.data);
      logAudit(
        'Remoção de Vendedor',
        'USER',
        userId,
        `Utilizador ID ${userId} removido do sistema.`
      );
      return result;
    }
    return result;
  };

  const updateAdminPin = (
    currentPinVal: string,
    newPinVal: string
  ): { success: boolean; message: string } => {
    const admin = users.find((u) => u.role === 'ADMIN');
    if (!admin) return { success: false, message: 'Administrador não encontrado.' };

    const check = userEngine.canPerformAction(currentUser, 'UPDATE_CONFIG');
    if (!check.allowed) {
      logAudit(
        'Tentativa de Alteração de PIN Rejeitada',
        'AUTH',
        admin.id,
        'Tentativa não autorizada de alteração de PIN do Administrador.',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      showToast('Acesso Negado', check.reason, 'error');
      return { success: false, message: check.reason || 'Acesso negado.' };
    }

    const isValid = securityEngine.verifyHash(currentPinVal, admin.salt, admin.passwordHash);
    if (!isValid) {
      return { success: false, message: 'O PIN atual do Administrador está incorreto.' };
    }

    if (!newPinVal || newPinVal.trim().length < 4) {
      return { success: false, message: 'O novo PIN deve ter no mínimo 4 dígitos.' };
    }

    const newSalt = securityEngine.generateSalt(16);
    const newHash = securityEngine.hashWithSalt(newPinVal.trim(), newSalt);

    setUsers((prev) =>
      prev.map((u) => (u.id === admin.id ? { ...u, salt: newSalt, passwordHash: newHash } : u))
    );
    setConfig((prev) => ({ ...prev, adminPinCode: newPinVal.trim() }));

    logAudit(
      'Alteração de PIN Administrativo',
      'AUTH',
      admin.id,
      'Código de segurança do Administrador Principal atualizado com nova encriptação SHA-256 + Salt.'
    );
    showToast('PIN de Acesso Alterado', 'O novo código de gestão foi guardado com sucesso.');
    return { success: true, message: 'Código de acesso alterado com sucesso!' };
  };

  // Cart Operations
  const addToCart = (product: Product, quantity = 1, notes?: string) => {
    if (!product || quantity <= 0) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
            : item
        );
      }
      return [...prev, { product, quantity, notes }];
    });
    showToast(`Adicionado ao pedido: ${product.name}`, `${quantity}x adicionado ao carrinho.`);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Stock Operations (Controlled & Audited)
  const deductStockForOrder = (order: Order): boolean => {
    const result = stockEngine.processOrderStockDeduction(
      order,
      products,
      ingredients,
      Boolean(config.allowNegativeStock)
    );

    if (!result.success) {
      showToast('Estoque Insuficiente', result.error, 'error');
      return false;
    }

    if (result.generatedMovements.length > 0) {
      setIngredients(result.updatedIngredients);
      setStockMovements((prev) => [...result.generatedMovements, ...prev]);
      logAudit(
        'Dedução de Estoque Automática',
        'STOCK',
        order.orderNumber,
        `Consumidos ingredientes de ${order.items.length} itens do pedido ${order.orderNumber}.`
      );
      return true;
    }
    return true;
  };

  const addStockMovement = (
    ingredientId: string,
    type: StockMovementType,
    quantity: number,
    reason: string,
    performedBy?: string,
    authorizedBy?: string
  ): boolean => {
    // Engine check: Manual stock adjustment is restricted to ADMIN
    const authCheck = userEngine.canPerformAction(currentUser, 'MANUAL_STOCK_ADJUSTMENT');
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Ajuste de Estoque Rejeitada',
        'STOCK',
        ingredientId,
        `Operação de estoque manual rejeitada no Engine para utilizador ${currentUser?.username || 'desconhecido'}.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      createSecurityAlert(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'HIGH',
        'Tentativa Não Autorizada de Ajustar Estoque',
        `Utilizador "${currentUser?.username || 'desconhecido'}" tentou ajustar estoque sem permissão de Administrador.`
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const ing = ingredients.find((i) => i.id === ingredientId);
    const validation = validationEngine.validateStockMovement(
      ing,
      type,
      quantity,
      reason,
      Boolean(config.allowNegativeStock)
    );

    if (!validation.isValid) {
      showToast('Operação Não Permitida', validation.errors[0], 'error');
      return false;
    }

    const performer = performedBy || (currentUser ? `${currentUser.role} (${currentUser.name})` : 'Administrador');
    const movementResult = stockEngine.createManualMovement(
      ing!,
      type,
      quantity,
      reason,
      performer,
      Boolean(config.allowNegativeStock),
      authorizedBy
    );

    if (!movementResult.success) {
      showToast('Erro de Estoque', movementResult.error, 'error');
      return false;
    }

    setIngredients((prev) =>
      prev.map((item) => (item.id === ingredientId ? movementResult.updatedIngredient : item))
    );
    setStockMovements((prev) => [movementResult.movement, ...prev]);

    // Anomaly trigger for large or waste stock adjustments
    if (movementResult.movement.quantity >= 50 || type === 'EXIT_WASTE') {
      createSecurityAlert(
        'STOCK_ANOMALY',
        type === 'EXIT_WASTE' ? 'HIGH' : 'MEDIUM',
        `Ajuste Relevante de Estoque: ${ing!.name}`,
        `${type === 'ENTRY' ? 'Entrada' : type === 'EXIT_WASTE' ? 'Perda/Avaria' : 'Ajuste'} de ${movementResult.movement.quantity} ${ing!.unit} em "${ing!.name}". Motivo: ${reason}. Autorizado por: ${authorizedBy || performer}.`
      );
    }

    logAudit(
      'Movimentação de Estoque Manual',
      'STOCK',
      ing!.name,
      `${type === 'ENTRY' ? 'Entrada' : type === 'EXIT_WASTE' ? 'Perda/Avaria' : 'Ajuste'} de ${movementResult.movement.quantity} ${ing!.unit} em "${ing!.name}". Motivo: ${reason}. ${authorizedBy ? `Autorizado por: ${authorizedBy}.` : ''}`,
      performer,
      currentUser?.id,
      currentUser?.role,
      movementResult.movement.previousStock.toString(),
      movementResult.movement.newStock.toString(),
      'SUCCESS'
    );
    showToast('Estoque Atualizado', `${ing!.name}: ${movementResult.updatedIngredient.currentStock} ${ing!.unit} disponíveis.`);
    return true;
  };

  // Order Operations (Atomic & Consistent)
  const createOrder = (orderData: Partial<Order>): Order | null => {
    // Check idempotency if key provided
    if (orderData.idempotencyKey) {
      const existing = orders.find((o) => o.idempotencyKey === orderData.idempotencyKey);
      if (existing) {
        showToast('Pedido Já Processado', `A comanda ${existing.orderNumber} já foi submetida com esta chave de segurança.`, 'info');
        return existing;
      }
    }

    const operatorName = currentUser ? `${currentUser.role} (${currentUser.name})` : 'Atendimento / Balcão';
    const txResult = transactionEngine.createOrderTransaction(
      orderData,
      orders,
      products,
      ingredients,
      customers,
      config,
      operatorName
    );

    if (!txResult.success || !txResult.data) {
      showToast('Falha ao Registrar Pedido', txResult.error || 'Verifique os dados informados.', 'error');
      return null;
    }

    const { order, updatedIngredients, generatedMovements, newPayment, updatedCustomers, auditLog } = txResult.data;

    setOrders((prev) => [order, ...prev]);

    if (updatedIngredients) {
      setIngredients(updatedIngredients);
    }
    if (generatedMovements && generatedMovements.length > 0) {
      setStockMovements((prev) => [...generatedMovements, ...prev]);
    }
    if (newPayment) {
      setPayments((prev) => [newPayment, ...prev]);

      // If active cash shift exists, update shift metrics
      if (currentCashShift) {
        setCashShifts((prevShifts) =>
          prevShifts.map((s) => {
            if (s.id !== currentCashShift.id) return s;
            const isCash = order.paymentMethod === 'CASH';
            const mpesa = order.paymentMethod === 'MPESA' ? order.total : 0;
            const emola = order.paymentMethod === 'EMOLA' ? order.total : 0;
            const posCard = order.paymentMethod === 'POS_CARD' ? order.total : 0;
            const bankTransfer = order.paymentMethod === 'BANK_TRANSFER' ? order.total : 0;
            const cash = isCash ? order.total : 0;

            return {
              ...s,
              status: 'IN_OPERATION',
              ordersCount: s.ordersCount + 1,
              totalSalesAmount: Number((s.totalSalesAmount + order.total).toFixed(2)),
              expectedCash: Number((s.expectedCash + cash).toFixed(2)),
              paymentBreakdown: {
                cash: Number((s.paymentBreakdown.cash + cash).toFixed(2)),
                mpesa: Number((s.paymentBreakdown.mpesa + mpesa).toFixed(2)),
                emola: Number((s.paymentBreakdown.emola + emola).toFixed(2)),
                posCard: Number((s.paymentBreakdown.posCard + posCard).toFixed(2)),
                bankTransfer: Number((s.paymentBreakdown.bankTransfer + bankTransfer).toFixed(2)),
              },
            };
          })
        );
      }
    }
    setCustomers(updatedCustomers);
    setAuditLogs((prev) => [auditLog, ...prev]);

    showToast(
      'Pedido Registado com Sucesso',
      `Comanda ${order.orderNumber} para ${order.customerName} no valor de ${order.total} MT.`
    );

    return order;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      showToast('Pedido Não Encontrado', 'O pedido especificado não existe no sistema.', 'error');
      return false;
    }

    const transitionCheck = orderEngine.validateStatusTransition(order.status, newStatus);
    if (!transitionCheck.allowed) {
      showToast('Transição Não Permitida', transitionCheck.reason, 'warning');
      return false;
    }

    let updatedIngredientsList = ingredients;
    let newMovements: StockMovement[] = [];
    let stockWasDeducted = order.stockDeducted;

    const needsDeduction =
      !order.stockDeducted &&
      (newStatus === 'CONFIRMED' ||
        newStatus === 'PREPARING' ||
        newStatus === 'READY' ||
        newStatus === 'DELIVERED');

    if (needsDeduction) {
      const deductionResult = stockEngine.processOrderStockDeduction(
        order,
        products,
        ingredients,
        Boolean(config.allowNegativeStock)
      );

      if (!deductionResult.success) {
        showToast('Estoque Insuficiente', deductionResult.error, 'error');
        return false;
      }

      updatedIngredientsList = deductionResult.updatedIngredients;
      newMovements = deductionResult.generatedMovements;
      stockWasDeducted = true;
    }

    if (needsDeduction && newMovements.length > 0) {
      setIngredients(updatedIngredientsList);
      setStockMovements((prev) => [...newMovements, ...prev]);
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              stockDeducted: stockWasDeducted,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    logAudit(
      'Alteração de Estado de Pedido',
      'ORDER',
      order.orderNumber,
      `Estado alterado de "${order.status}" para "${newStatus}".`
    );

    showToast('Estado Atualizado', `Pedido ${order.orderNumber} foi alterado para ${newStatus}.`);
    return true;
  };

  const updatePaymentStatus = (
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod,
    reference?: string
  ): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      showToast('Pedido Não Encontrado', 'Identificador de pedido inválido.', 'error');
      return false;
    }

    if (paymentStatus === 'PAID') {
      if (order.paymentStatus === 'PAID') {
        showToast('Pagamento Já Registado', `O pedido ${order.orderNumber} já se encontra liquidado.`, 'warning');
        return false;
      }

      const existingRecord = payments.find((p) => p.orderId === orderId && p.status === 'PAID');
      if (existingRecord) {
        showToast('Pagamento Duplicado', `Já existe recibo ${existingRecord.receiptNumber} associado a este pedido.`, 'warning');
        return false;
      }

      const newPayRecord: PaymentRecord = {
        id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || 'Cliente Balcão',
        amount: order.total,
        method: paymentMethod,
        status: 'PAID',
        reference: reference || `REF-${order.orderNumber}-${Date.now().toString().slice(-4)}`,
        receiptNumber: `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`,
        receivedBy: currentUser ? `${currentUser.role} (${currentUser.name})` : 'Operador',
        createdAt: new Date().toISOString(),
      };

      setPayments((prev) => [newPayRecord, ...prev]);

      // If active cash shift exists, update shift metrics
      if (currentCashShift) {
        setCashShifts((prevShifts) =>
          prevShifts.map((s) => {
            if (s.id !== currentCashShift.id) return s;
            const isCash = paymentMethod === 'CASH';
            const mpesa = paymentMethod === 'MPESA' ? order.total : 0;
            const emola = paymentMethod === 'EMOLA' ? order.total : 0;
            const posCard = paymentMethod === 'POS_CARD' ? order.total : 0;
            const bankTransfer = paymentMethod === 'BANK_TRANSFER' ? order.total : 0;
            const cash = isCash ? order.total : 0;

            return {
              ...s,
              status: 'IN_OPERATION',
              ordersCount: s.ordersCount + 1,
              totalSalesAmount: Number((s.totalSalesAmount + order.total).toFixed(2)),
              expectedCash: Number((s.expectedCash + cash).toFixed(2)),
              paymentBreakdown: {
                cash: Number((s.paymentBreakdown.cash + cash).toFixed(2)),
                mpesa: Number((s.paymentBreakdown.mpesa + mpesa).toFixed(2)),
                emola: Number((s.paymentBreakdown.emola + emola).toFixed(2)),
                posCard: Number((s.paymentBreakdown.posCard + posCard).toFixed(2)),
                bankTransfer: Number((s.paymentBreakdown.bankTransfer + bankTransfer).toFixed(2)),
              },
            };
          })
        );
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                paymentStatus: 'PAID',
                paymentMethod: paymentMethod,
                paymentReference: newPayRecord.reference,
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );

      logAudit(
        'Recebimento Registado',
        'PAYMENT',
        newPayRecord.receiptNumber,
        `Recebido valor de ${order.total} MT (${paymentMethod}) para comanda ${order.orderNumber}.`
      );

      showToast('Pagamento Confirmado', `Recibo ${newPayRecord.receiptNumber} emitido com sucesso.`);
      return true;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              paymentStatus: paymentStatus,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    return true;
  };

  const cancelOrder = (orderId: string, reason = 'Cancelamento pelo Operador'): boolean => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    // If order was already paid or completed, require admin role or authorization
    if (order.status === 'DELIVERED' || order.paymentStatus === 'PAID') {
      const authCheck = userEngine.canPerformAction(currentUser, 'CANCEL_COMPLETED_SALE');
      if (!authCheck.allowed) {
        logAudit(
          'Tentativa de Cancelamento de Venda Rejeitada',
          'ORDER',
          order.orderNumber,
          `Vendedor tentou cancelar pedido liquidado/entregue ${order.orderNumber} sem autorização.`,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          'REJECTED_UNAUTHORIZED'
        );
        showToast('Acesso Negado', authCheck.reason, 'error');
        return false;
      }
    }

    let restoredIngredients = ingredients;
    let reversalMovements: StockMovement[] = [];

    if (order.stockDeducted && order.items && order.items.length > 0) {
      const reversal = stockEngine.restoreOrderStock(order, products, ingredients, reason);
      restoredIngredients = reversal.updatedIngredients;
      reversalMovements = reversal.generatedMovements;
    }

    if (reversalMovements.length > 0) {
      setIngredients(restoredIngredients);
      setStockMovements((prev) => [...reversalMovements, ...prev]);
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'CANCELLED',
              cancellationReason: reason,
              stockDeducted: false,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    logAudit(
      'Cancelamento de Pedido',
      'ORDER',
      order.orderNumber,
      `Pedido ${order.orderNumber} cancelado. Motivo: ${reason}. ${
        reversalMovements.length > 0 ? 'Estoque estornado automaticamente.' : ''
      }`
    );

    showToast('Pedido Cancelado', `Comanda ${order.orderNumber} foi anulada.`);
    return true;
  };

  const correctCompletedOrder = (
    orderId: string,
    correctionData: {
      items?: OrderItem[];
      paymentMethod?: PaymentMethod;
      discount?: number;
      reason: string;
      authorizedBy: string;
    }
  ): boolean => {
    const authCheck = userEngine.canPerformAction(currentUser, 'MODIFY_COMPLETED_SALE');
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Modificação de Venda Rejeitada',
        'ORDER',
        orderId,
        `Vendedor tentou retificar venda concluída ID ${orderId} sem autorização do Administrador.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      createSecurityAlert(
        'ORDER_CORRECTION_ATTEMPT',
        'HIGH',
        'Tentativa de Retificação de Venda Rejeitada',
        `Tentativa de alterar o pedido ID ${orderId} sem perfil de Administrador.`
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      showToast('Pedido Não Encontrado', 'O pedido especificado não existe.', 'error');
      return false;
    }

    if (!correctionData.reason || correctionData.reason.trim().length < 4) {
      showToast('Motivo Obrigatório', 'A retificação de pedido concluído exige justificativa detalhada.', 'warning');
      return false;
    }

    const newItems = correctionData.items || order.items;
    const newSubtotal = newItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const newDiscount = correctionData.discount !== undefined ? Math.max(0, correctionData.discount) : (order.discount || 0);
    const newDeliveryFee = order.deliveryFee || 0;
    const newTotal = Math.max(0, newSubtotal - newDiscount + newDeliveryFee);
    const newMethod = correctionData.paymentMethod || order.paymentMethod;

    const correctionRecord: OrderCorrectionRecord = {
      id: `corr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      correctedBy: currentUser ? `${currentUser.role} (${currentUser.name})` : 'Administrador',
      authorizedBy: correctionData.authorizedBy || 'Administrador',
      reason: correctionData.reason.trim(),
      previousTotal: order.total,
      newTotal,
      previousItems: order.items,
      newItems,
      previousPaymentMethod: order.paymentMethod,
      newPaymentMethod: newMethod,
      timestamp: new Date().toISOString(),
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: newItems,
              subtotal: newSubtotal,
              discount: newDiscount,
              total: newTotal,
              paymentMethod: newMethod,
              corrections: [correctionRecord, ...(o.corrections || [])],
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    logAudit(
      'Retificação de Venda Concluída',
      'ORDER',
      order.orderNumber,
      `Venda ${order.orderNumber} retificada (${order.total} MT -> ${newTotal} MT). Motivo: ${correctionData.reason}. Autorizado por: ${correctionData.authorizedBy}.`,
      undefined,
      undefined,
      undefined,
      order.total.toString(),
      newTotal.toString(),
      'SUCCESS'
    );

    createSecurityAlert(
      'ORDER_CORRECTION_ATTEMPT',
      'MEDIUM',
      `Venda #${order.orderNumber} Retificada Formalmente`,
      `Pedido ajustado de ${order.total} MT para ${newTotal} MT por ${currentUser?.name || 'Admin'}. Motivo: ${correctionData.reason}.`,
      { orderId, previousTotal: order.total, newTotal, reason: correctionData.reason }
    );

    showToast('Venda Retificada', `Comanda ${order.orderNumber} corrigida com registro no histórico de auditoria.`);
    return true;
  };

  // Product & Menu Management (Admin Only - Engine Enforced)
  const createProduct = (productData: Omit<Product, 'id'>): Product | null => {
    const authCheck = userEngine.canPerformAction(currentUser, 'CREATE_PRODUCT');
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Criação de Produto Rejeitada',
        'PRODUCT',
        productData.name,
        `Vendedor tentou criar produto "${productData.name}" no cardápio.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return null;
    }

    const validation = validationEngine.validateProduct(productData, categories);
    if (!validation.isValid) {
      showToast('Dados de Prato Inválidos', validation.errors[0], 'error');
      return null;
    }

    const newProd: Product = {
      ...productData,
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      status: 'ACTIVE',
    };

    setProducts((prev) => [newProd, ...prev]);
    logAudit('Criação de Produto', 'PRODUCT', newProd.name, `Prato "${newProd.name}" cadastrado a ${newProd.price} MT.`);
    showToast('Prato Cadastrado', `${newProd.name} adicionado ao cardápio com sucesso.`);
    return newProd;
  };

  const updateProduct = (productId: string, updates: Partial<Product>): boolean => {
    const current = products.find((p) => p.id === productId);
    if (!current) return false;

    // Check if price changed
    const isPriceChange = updates.price !== undefined && updates.price !== current.price;
    const actionToCheck: PermissionAction = isPriceChange ? 'CHANGE_PRODUCT_PRICE' : 'UPDATE_PRODUCT';

    const authCheck = userEngine.canPerformAction(currentUser, actionToCheck);
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Edição de Produto Rejeitada',
        'PRODUCT',
        current.name,
        `Operação rejeitada no Engine para o utilizador ${currentUser?.username || 'desconhecido'}.`,
        undefined,
        undefined,
        undefined,
        current.price?.toString(),
        updates.price?.toString(),
        'REJECTED_UNAUTHORIZED'
      );
      createSecurityAlert(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'MEDIUM',
        'Tentativa Não Autorizada de Editar Produto',
        `Utilizador "${currentUser?.username || 'desconhecido'}" tentou alterar prato "${current.name}".`
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const merged = { ...current, ...updates };
    const validation = validationEngine.validateProduct(merged, categories);
    if (!validation.isValid) {
      showToast('Erro ao Atualizar', validation.errors[0], 'error');
      return false;
    }

    // If price changed, maintain priceHistory
    if (isPriceChange && updates.price !== undefined) {
      const historyEntry = {
        id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        price: updates.price,
        previousPrice: current.price,
        changedBy: currentUser ? `${currentUser.role} (${currentUser.name})` : 'Administrador',
        changedAt: new Date().toISOString(),
        reason: 'Atualização de formulário de produto',
      };
      merged.priceHistory = [historyEntry, ...(current.priceHistory || [])];
    }

    setProducts((prev) => prev.map((p) => (p.id === productId ? merged : p)));
    logAudit(
      'Atualização de Produto',
      'PRODUCT',
      current.name,
      `Produto "${current.name}" atualizado. ${isPriceChange ? `Preço alterado de ${current.price} para ${updates.price} MT.` : ''}`,
      undefined,
      undefined,
      undefined,
      current.price?.toString(),
      updates.price?.toString(),
      'SUCCESS'
    );
    showToast('Produto Atualizado', `Dados de "${current.name}" foram salvos com sucesso.`);
    return true;
  };

  const updateProductPriceWithAudit = (productId: string, newPrice: number, reason = 'Ajuste de tabela de preços'): boolean => {
    const authCheck = userEngine.canPerformAction(currentUser, 'CHANGE_PRODUCT_PRICE');
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Alteração de Preço Rejeitada',
        'PRODUCT',
        productId,
        `Tentativa não autorizada de alterar preço do produto ID ${productId}.`,
        undefined,
        undefined,
        undefined,
        undefined,
        newPrice.toString(),
        'REJECTED_UNAUTHORIZED'
      );
      createSecurityAlert(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'MEDIUM',
        'Tentativa Não Autorizada de Alterar Preço',
        `Tentativa de alterar o preço para ${newPrice} MT sem permissão.`
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const prod = products.find((p) => p.id === productId);
    if (!prod) return false;
    if (newPrice < 0) {
      showToast('Preço Inválido', 'O preço não pode ser negativo.', 'error');
      return false;
    }

    const prevPrice = prod.price;
    const historyEntry = {
      id: `ph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      price: newPrice,
      previousPrice: prevPrice,
      changedBy: currentUser ? `${currentUser.role} (${currentUser.name})` : 'Administrador',
      changedAt: new Date().toISOString(),
      reason: reason.trim(),
    };

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              price: newPrice,
              priceHistory: [historyEntry, ...(p.priceHistory || [])],
            }
          : p
      )
    );

    logAudit(
      'Alteração de Preço de Produto',
      'PRODUCT',
      prod.name,
      `Preço de "${prod.name}" alterado de ${prevPrice} MT para ${newPrice} MT. Motivo: ${reason}.`,
      undefined,
      undefined,
      undefined,
      prevPrice.toString(),
      newPrice.toString(),
      'SUCCESS'
    );

    createSecurityAlert(
      'PRICE_ALTERATION',
      'LOW',
      `Preço Alterado: ${prod.name}`,
      `Preço de "${prod.name}" alterado de ${prevPrice} MT para ${newPrice} MT por ${currentUser?.name || 'Admin'}. Motivo: ${reason}.`,
      { productId, previousPrice: prevPrice, newPrice, reason }
    );

    showToast('Preço Atualizado', `Novo preço de "${prod.name}": ${newPrice} MT.`);
    return true;
  };

  const deleteProduct = (productId: string): boolean => {
    const authCheck = userEngine.canPerformAction(currentUser, 'DELETE_PRODUCT');
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Exclusão de Produto Rejeitada',
        'PRODUCT',
        productId,
        `Tentativa não autorizada de apagar produto ID ${productId}.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      createSecurityAlert(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'MEDIUM',
        'Tentativa Não Autorizada de Apagar Produto',
        `Tentativa de excluir o produto ID ${productId} sem privilégio de Administrador.`
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const target = products.find((p) => p.id === productId);
    if (!target) return false;

    // Soft delete: keep record intact in database for history integrity, mark status = INACTIVE
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              status: 'INACTIVE',
              isDeleted: true,
              isAvailable: false,
            }
          : p
      )
    );

    logAudit('Desativação de Produto (Soft Delete)', 'PRODUCT', target.name, `Prato "${target.name}" desativado do cardápio (histórico preservado).`);
    showToast('Produto Desativado', `"${target.name}" foi desativado (preservando histórico de vendas).`, 'info');
    return true;
  };

  const createCategory = (categoryData: Omit<Category, 'id'>): Category | null => {
    const authCheck = userEngine.canPerformAction(currentUser, 'CREATE_PRODUCT');
    if (!authCheck.allowed) {
      showToast('Acesso Negado', authCheck.reason, 'error');
      return null;
    }

    const newCat: Category = {
      ...categoryData,
      id: 'cat-' + Date.now(),
    };
    setCategories((prev) => [...prev, newCat]);
    logAudit('Criação de Categoria', 'PRODUCT', newCat.name, `Categoria "${newCat.name}" criada.`);
    showToast('Categoria Criada', `${newCat.name} adicionada ao menu.`);
    return newCat;
  };

  const updateCategory = (categoryId: string, updates: Partial<Category>): boolean => {
    const authCheck = userEngine.canPerformAction(currentUser, 'UPDATE_PRODUCT');
    if (!authCheck.allowed) {
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, ...updates } : c))
    );
    showToast('Categoria Atualizada', 'Alterações guardadas.');
    return true;
  };

  const deleteCategory = (categoryId: string): boolean => {
    const authCheck = userEngine.canPerformAction(currentUser, 'DELETE_PRODUCT');
    if (!authCheck.allowed) {
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const hasProducts = products.some((p) => p.categoryId === categoryId);
    if (hasProducts) {
      showToast('Não é Possível Remover', 'Existem produtos associados a esta categoria.', 'warning');
      return false;
    }
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    showToast('Categoria Removida', 'Categoria removida com sucesso.', 'info');
    return true;
  };

  // Ingredient & Recipe Management (Admin Only - Engine Enforced)
  const createIngredient = (
    ingredientData: Omit<Ingredient, 'id' | 'lastUpdated'>
  ): Ingredient | null => {
    const authCheck = userEngine.canPerformAction(currentUser, 'CREATE_INGREDIENT');
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Criação de Ingrediente Rejeitada',
        'INGREDIENT',
        ingredientData.name,
        `Vendedor tentou cadastrar ingrediente sem autorização.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return null;
    }

    const validation = validationEngine.validateIngredient(ingredientData);
    if (!validation.isValid) {
      showToast('Dados de Insumo Inválidos', validation.errors[0], 'error');
      return null;
    }

    const newIng: Ingredient = {
      ...ingredientData,
      id: 'ing-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      lastUpdated: new Date().toISOString(),
    };

    setIngredients((prev) => [...prev, newIng]);
    logAudit('Criação de Ingrediente', 'INGREDIENT', newIng.name, `Ingrediente "${newIng.name}" (${newIng.currentStock} ${newIng.unit}) registado.`);
    showToast('Ingrediente Cadastrado', `${newIng.name} adicionado ao controle de estoque.`);
    return newIng;
  };

  const updateIngredient = (ingredientId: string, updates: Partial<Ingredient>): boolean => {
    const authCheck = userEngine.canPerformAction(currentUser, 'UPDATE_INGREDIENT');
    if (!authCheck.allowed) {
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const current = ingredients.find((i) => i.id === ingredientId);
    if (!current) return false;

    const merged = { ...current, ...updates, lastUpdated: new Date().toISOString() };
    setIngredients((prev) => prev.map((i) => (i.id === ingredientId ? merged : i)));
    logAudit('Atualização de Ingrediente', 'INGREDIENT', current.name, `Dados de "${current.name}" atualizados.`);
    showToast('Ingrediente Atualizado', 'Dados de insumo salvos com sucesso.');
    return true;
  };

  const deleteIngredient = (ingredientId: string): boolean => {
    const authCheck = userEngine.canPerformAction(currentUser, 'DELETE_INGREDIENT');
    if (!authCheck.allowed) {
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const target = ingredients.find((i) => i.id === ingredientId);
    if (!target) return false;

    // Soft delete: keep record intact in database for history integrity, mark status = INACTIVE
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === ingredientId
          ? {
              ...i,
              status: 'INACTIVE',
              isDeleted: true,
            }
          : i
      )
    );

    logAudit('Desativação de Insumo (Soft Delete)', 'INGREDIENT', target.name, `Insumo "${target.name}" desativado (movimentações preservadas).`);
    showToast('Ingrediente Desativado', `${target.name} desativado com sucesso.`, 'info');
    return true;
  };

  const updateProductRecipe = (
    productId: string,
    recipeIngredients: RecipeIngredient[]
  ): boolean => {
    const authCheck = userEngine.canPerformAction(currentUser, 'UPDATE_RECIPE');
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Edição de Receita Rejeitada',
        'PRODUCT',
        productId,
        `Vendedor tentou alterar ficha técnica do prato ID ${productId}.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return false;

    const validation = validationEngine.validateRecipe(recipeIngredients, ingredients);
    if (!validation.isValid) {
      showToast('Erro na Ficha Técnica', validation.errors[0], 'error');
      return false;
    }

    const calculatedCost = stockEngine.calculateRecipeCost(recipeIngredients, ingredients);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              ingredients: recipeIngredients,
              costPrice: calculatedCost,
            }
          : p
      )
    );

    logAudit(
      'Ficha Técnica Atualizada',
      'PRODUCT',
      targetProduct.name,
      `Composição de "${targetProduct.name}" recalculada (${recipeIngredients.length} ingredientes, custo CMV: ${calculatedCost} MT).`
    );

    showToast('Ficha Técnica Salva', 'Composição e custo de CMV recalculados com sucesso.');
    return true;
  };

  // Customer Management
  const createCustomer = (
    customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'firstOrderDate' | 'lastOrderDate'>
  ): Customer | null => {
    const validation = validationEngine.validateCustomer(customerData);
    if (!validation.isValid) {
      showToast('Dados de Cliente Inválidos', validation.errors[0], 'error');
      return null;
    }

    const cleanPhone = customerData.phone.replace(/[^0-9+]/g, '');
    const duplicate = customers.find((c) => c.phone.replace(/[^0-9+]/g, '') === cleanPhone);
    if (duplicate) {
      showToast(
        'Cliente Já Cadastrado',
        `Já existe um cliente registado com o número ${customerData.phone} ("${duplicate.name}").`,
        'warning'
      );
      return null;
    }

    const now = new Date().toISOString();
    const newCust: Customer = {
      ...customerData,
      id: 'cust-' + Date.now(),
      status: 'ACTIVE',
      totalOrders: 0,
      totalSpent: 0,
      firstOrderDate: now,
      lastOrderDate: now,
    };
    setCustomers((prev) => [newCust, ...prev]);
    logAudit('Criação de Cliente', 'CUSTOMER', newCust.name, `Cliente "${newCust.name}" adicionado.`);
    showToast('Cliente Cadastrado', `${newCust.name} adicionado à base de dados.`);
    return newCust;
  };

  const updateCustomer = (customerId: string, updates: Partial<Customer>): boolean => {
    const authCheck = userEngine.canPerformAction(currentUser, 'UPDATE_CUSTOMER');
    if (!authCheck.allowed) {
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const current = customers.find((c) => c.id === customerId);
    if (!current) return false;

    const merged = { ...current, ...updates };
    const validation = validationEngine.validateCustomer(merged);
    if (!validation.isValid) {
      showToast('Erro ao Atualizar', validation.errors[0], 'error');
      return false;
    }

    setCustomers((prev) => prev.map((cust) => (cust.id === customerId ? merged : cust)));
    logAudit('Atualização de Cliente', 'CUSTOMER', current.name, `Dados do cliente "${current.name}" atualizados.`);
    showToast('Cliente Atualizado', 'Dados do cliente guardados.');
    return true;
  };

  const deleteCustomer = (customerId: string): boolean => {
    const authCheck = userEngine.canPerformAction(currentUser, 'DELETE_CUSTOMER');
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Exclusão de Cliente Rejeitada',
        'CUSTOMER',
        customerId,
        `Vendedor tentou apagar cliente ID ${customerId} da base de dados.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      createSecurityAlert(
        'UNAUTHORIZED_ACCESS_ATTEMPT',
        'HIGH',
        'Tentativa Não Autorizada de Apagar Cliente',
        `Tentativa de excluir cliente ID ${customerId} sem privilégio de Administrador.`
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const target = customers.find((c) => c.id === customerId);
    if (!target) return false;

    // Soft delete: keep customer record intact in database for history integrity, mark status = ARCHIVED
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              status: 'ARCHIVED',
              isArchived: true,
            }
          : c
      )
    );

    logAudit('Arquivamento de Cliente (Soft Delete)', 'CUSTOMER', target.name, `Cliente "${target.name}" arquivado (histórico de compras preservado).`);
    showToast('Cliente Arquivado', `"${target.name}" arquivado (histórico preservado).`, 'info');
    return true;
  };

  // Cash Shift Management
  const openCashShift = (initialCashFloat: number, notes?: string): CashShift | null => {
    if (currentCashShift) {
      showToast('Caixa Já Aberto', `O turno #${currentCashShift.shiftNumber} já está ativo. Feche o turno atual antes de abrir um novo.`, 'warning');
      return null;
    }
    const performer = currentUser ? `${currentUser.role} (${currentUser.name})` : 'Administrador';
    const now = new Date().toISOString();
    const cleanFloat = Math.max(0, initialCashFloat || 0);
    const newShift: CashShift = {
      id: `shift-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      shiftNumber: cashShifts.length + 1,
      openedBy: performer,
      openedByUserId: currentUser?.id,
      openedByRole: currentUser?.role || 'ADMIN',
      openedAt: now,
      status: 'OPEN',
      initialCashFloat: cleanFloat,
      expectedCash: cleanFloat,
      totalSalesAmount: 0,
      ordersCount: 0,
      paymentBreakdown: {
        cash: 0,
        mpesa: 0,
        emola: 0,
        posCard: 0,
        bankTransfer: 0,
      },
      notes: notes?.trim(),
      auditLogIds: [],
    };

    setCashShifts((prev) => [newShift, ...prev]);
    logAudit(
      'Abertura de Turno de Caixa',
      'ORDER',
      newShift.id,
      `Turno #${newShift.shiftNumber} aberto por ${performer} com fundo inicial de ${cleanFloat} MT.`
    );
    showToast('Caixa Aberto', `Turno #${newShift.shiftNumber} aberto com fundo de ${cleanFloat} MT.`);
    return newShift;
  };

  const closeCashShift = (
    countedCash: number,
    justification?: string,
    notes?: string
  ): CashShift | null => {
    if (!currentCashShift) {
      showToast('Nenhum Caixa Aberto', 'Não existe nenhum turno de caixa em aberto para fechar.', 'warning');
      return null;
    }
    const performer = currentUser ? `${currentUser.role} (${currentUser.name})` : 'Administrador';
    const now = new Date().toISOString();
    const cleanCounted = Math.max(0, countedCash || 0);
    const discrepancy = Number((cleanCounted - currentCashShift.expectedCash).toFixed(2));

    const updatedShift: CashShift = {
      ...currentCashShift,
      status: 'CLOSED',
      closedBy: performer,
      closedByUserId: currentUser?.id,
      closedAt: now,
      countedCash: cleanCounted,
      cashDiscrepancy: discrepancy,
      discrepancyJustification: justification?.trim(),
      notes: notes?.trim() || currentCashShift.notes,
    };

    setCashShifts((prev) => prev.map((s) => (s.id === currentCashShift.id ? updatedShift : s)));

    if (Math.abs(discrepancy) > 0.01) {
      createSecurityAlert(
        'CASH_DISCREPANCY',
        Math.abs(discrepancy) > 500 ? 'HIGH' : 'MEDIUM',
        `Discrepância de Caixa no Turno #${currentCashShift.shiftNumber}`,
        `Esperado em dinheiro: ${currentCashShift.expectedCash} MT, contado: ${cleanCounted} MT. Diferença: ${discrepancy > 0 ? '+' : ''}${discrepancy} MT. Justificativa: ${justification || 'Nenhuma informada'}.`,
        { shiftId: currentCashShift.id, discrepancy, expected: currentCashShift.expectedCash, counted: cleanCounted }
      );
    }

    logAudit(
      'Fecho de Turno de Caixa',
      'ORDER',
      updatedShift.id,
      `Turno #${updatedShift.shiftNumber} fechado por ${performer}. Vendas: ${updatedShift.totalSalesAmount} MT. Dinheiro contado: ${cleanCounted} MT (Diferença: ${discrepancy} MT).`
    );
    showToast('Caixa Fechado com Sucesso', `Turno #${updatedShift.shiftNumber} finalizado.`);
    return updatedShift;
  };

  const getCashShiftSummary = () => {
    if (!currentCashShift) {
      return {
        expectedCash: 0,
        totalSales: 0,
        breakdown: { cash: 0, mpesa: 0, emola: 0, posCard: 0, bankTransfer: 0 },
        ordersCount: 0,
      };
    }
    return {
      expectedCash: currentCashShift.expectedCash,
      totalSales: currentCashShift.totalSalesAmount,
      breakdown: currentCashShift.paymentBreakdown,
      ordersCount: currentCashShift.ordersCount,
    };
  };

  // Operational Security Attack Simulation Engine
  const runSecurityAttackSimulation = (scenarioId: string) => {
    let scenarioName = '';
    let attackerRole = 'SELLER';
    let attemptedAction = '';
    let blocked = false;
    let engineMessage = '';

    const mockSeller: User = {
      id: 'mock-seller-attacker',
      name: 'Vendedor Simulado',
      username: 'vendedor_teste',
      role: 'SELLER',
      status: 'ACTIVE',
      passwordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      salt: 'simulationsalt1234',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };

    switch (scenarioId) {
      case 'VENDEDOR_APAGAR_CLIENTE': {
        scenarioName = 'Vendedor Tenta Apagar Cliente da Base';
        attemptedAction = 'DELETE_CUSTOMER';
        const check = userEngine.canPerformAction(mockSeller, 'DELETE_CUSTOMER');
        blocked = !check.allowed;
        engineMessage = check.reason || 'Bloqueado pelo RBAC User Engine';
        break;
      }
      case 'VENDEDOR_ALTERAR_PRECO': {
        scenarioName = 'Vendedor Tenta Alterar Preço de Produto';
        attemptedAction = 'CHANGE_PRODUCT_PRICE';
        const check = userEngine.canPerformAction(mockSeller, 'CHANGE_PRODUCT_PRICE');
        blocked = !check.allowed;
        engineMessage = check.reason || 'Bloqueado pelo RBAC User Engine';
        break;
      }
      case 'VENDEDOR_ALTERAR_ESTOQUE': {
        scenarioName = 'Vendedor Tenta Fazer Ajuste Manual de Estoque';
        attemptedAction = 'MANUAL_STOCK_ADJUSTMENT';
        const check = userEngine.canPerformAction(mockSeller, 'MANUAL_STOCK_ADJUSTMENT');
        blocked = !check.allowed;
        engineMessage = check.reason || 'Bloqueado pelo RBAC User Engine';
        break;
      }
      case 'VENDEDOR_ACEDER_CONFIG': {
        scenarioName = 'Vendedor Tenta Alterar Parâmetros do Restaurante';
        attemptedAction = 'UPDATE_CONFIG';
        const check = userEngine.canPerformAction(mockSeller, 'UPDATE_CONFIG');
        blocked = !check.allowed;
        engineMessage = check.reason || 'Bloqueado pelo RBAC User Engine';
        break;
      }
      case 'VENDEDOR_RESTAURAR_BACKUP': {
        scenarioName = 'Vendedor Tenta Restaurar Ponto de Backup';
        attemptedAction = 'RESTORE_BACKUP';
        const check = userEngine.canPerformAction(mockSeller, 'RESTORE_BACKUP');
        blocked = !check.allowed;
        engineMessage = check.reason || 'Bloqueado pelo RBAC User Engine';
        break;
      }
      case 'VENDEDOR_ALTERAR_VENDA_CONCLUIDA': {
        scenarioName = 'Vendedor Tenta Modificar/Cancelar Venda Concluída';
        attemptedAction = 'MODIFY_COMPLETED_SALE';
        const check = userEngine.canPerformAction(mockSeller, 'MODIFY_COMPLETED_SALE');
        blocked = !check.allowed;
        engineMessage = check.reason || 'Bloqueado pelo RBAC User Engine';
        break;
      }
      case 'SEM_SESSAO_ACEDER_PAINEL': {
        scenarioName = 'Visitante Sem Sessão Tenta Aceder Logs ou Gerir Utilizadores';
        attackerRole = 'ANONYMOUS';
        attemptedAction = 'VIEW_AUDIT_LOGS';
        const check = userEngine.canPerformAction(null, 'VIEW_AUDIT_LOGS');
        blocked = !check.allowed;
        engineMessage = check.reason || 'Bloqueado por ausência de sessão autenticada';
        break;
      }
      default: {
        scenarioName = 'Cenário Genérico de Teste de Intrusão';
        attemptedAction = 'ADMIN_ACTION';
        blocked = true;
        engineMessage = 'Acesso bloqueado por segurança';
      }
    }

    // Log the simulation attack to Audit Logs & Security Alerts
    const auditEntry = securityEngine.createAuditEntry(
      `Simulação de Ataque: ${scenarioName}`,
      'SECURITY',
      scenarioId,
      `Teste de segurança operacional executado. Ação "${attemptedAction}" foi ${blocked ? 'BLOQUEADA com sucesso pelo Engine' : 'PERMITIDA'}.`,
      `Simulador (${attackerRole})`,
      'sim-attacker-id',
      attackerRole as UserRole,
      undefined,
      undefined,
      blocked ? 'REJECTED_UNAUTHORIZED' : 'SUCCESS'
    );
    setAuditLogs((prev) => [auditEntry, ...prev]);

    createSecurityAlert(
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'HIGH',
      `Simulação: ${scenarioName}`,
      `O sistema bloqueou a tentativa de execução da ação "${attemptedAction}" pelo perfil ${attackerRole}. Motivo: ${engineMessage}.`,
      { scenarioId, attemptedAction, attackerRole, blocked, engineMessage }
    );

    return {
      scenarioId,
      scenarioName,
      attackerRole,
      attemptedAction,
      blocked,
      engineMessage,
      auditLogId: auditEntry.id,
      alertGenerated: true,
    };
  };

  // Payment registration
  const registerPayment = (payment: Omit<PaymentRecord, 'id' | 'createdAt'>): PaymentRecord | null => {
    const newRecord: PaymentRecord = {
      ...payment,
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    setPayments((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  // Backup & Recovery Handlers (Admin Only)
  const createManualBackup = async (label?: string): Promise<BackupPoint | null> => {
    const authCheck = userEngine.canPerformAction(currentUser, 'CREATE_BACKUP');
    if (!authCheck.allowed) {
      showToast('Acesso Negado', authCheck.reason, 'error');
      return null;
    }

    const customLabel = label?.trim() || `Backup Manual ${new Date().toLocaleTimeString('pt-PT')}`;
    const performer = currentUser ? `${currentUser.role} (${currentUser.name})` : 'Administrador';
    const res = await backupEngine.createBackup('MANUAL_ADMIN', customLabel, performer);

    if (res.success && res.backupPoint) {
      const updated = backupEngine.getLocalBackupPoints();
      setBackupPoints(updated);
      logAudit(
        'Cópia de Segurança Criada',
        'SETTING',
        res.backupPoint.id,
        `Ponto ${res.backupPoint.id} gerado com sucesso (${(res.backupPoint.sizeBytes / 1024).toFixed(1)} KB).`,
        performer
      );
      showToast(
        'Backup Criado com Sucesso',
        `Ponto ${res.backupPoint.id} registado localmente e replicado na nuvem.`
      );
      return res.backupPoint;
    } else {
      showToast('Erro no Backup', res.error || 'Falha ao gerar cópia de segurança.', 'error');
      return null;
    }
  };

  const restoreBackupPoint = async (backupId: string): Promise<boolean> => {
    const authCheck = userEngine.canPerformAction(currentUser, 'RESTORE_BACKUP');
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Restauração de Backup Rejeitada',
        'SETTING',
        backupId,
        `Tentativa de restaurar dados bloqueada por falta de privilégios.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    const performer = currentUser ? `${currentUser.role} (${currentUser.name})` : 'Administrador';
    const res = await backupEngine.restoreBackup(
      backupId,
      performer,
      (restored: FullRestaurantDataState) => {
        setConfig(restored.config);
        setCategories(restored.categories || []);
        setProducts(restored.products || []);
        setIngredients(restored.ingredients || []);
        setOrders(restored.orders || []);
        setPayments(restored.payments || []);
        setStockMovements(restored.stockMovements || []);
        setCustomers(restored.customers || []);
        if (restored.users && Array.isArray(restored.users)) {
          setUsers(restored.users);
        }
      }
    );

    if (res.success) {
      setBackupPoints(backupEngine.getLocalBackupPoints());
      logAudit(
        'Restauração de Dados',
        'SETTING',
        backupId,
        `Sistema restaurado com sucesso para o ponto ${backupId}. Snapshot de segurança criado (${res.safetySnapshotId}).`,
        performer
      );
      showToast(
        'Base de Dados Restaurada',
        `Ponto ${backupId} aplicado. Snapshot reversível ${res.safetySnapshotId} criado.`
      );
      return true;
    } else {
      showToast('Falha na Restauração', res.error || 'Não foi possível restaurar os dados.', 'error');
      return false;
    }
  };

  const importBackupJSON = async (jsonString: string): Promise<boolean> => {
    const authCheck = userEngine.canPerformAction(currentUser, 'RESTORE_BACKUP');
    if (!authCheck.allowed) {
      showToast('Acesso Negado', authCheck.reason, 'error');
      return false;
    }

    try {
      const parsed = JSON.parse(jsonString);
      const validation = backupEngine.validateBackupIntegrity(parsed);

      if (!validation.isValid) {
        showToast(
          'Ficheiro de Backup Corrompido',
          `Inconsistências encontradas: ${validation.errors.join(', ')}`,
          'error'
        );
        return false;
      }

      const performer = currentUser ? `${currentUser.role} (${currentUser.name})` : 'Administrador';
      const safetySnap = await backupEngine.createBackup(
        'PRE_RESTORE_SNAPSHOT',
        'Snapshot de Segurança Pré-Importação de JSON',
        performer,
        true
      );

      setConfig(parsed.config);
      if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
      setProducts(parsed.products);
      setIngredients(parsed.ingredients);
      setOrders(parsed.orders);
      setPayments(parsed.payments);
      setStockMovements(parsed.stockMovements);
      setCustomers(parsed.customers);
      if (Array.isArray(parsed.users)) {
        setUsers(parsed.users);
      }

      setBackupPoints(backupEngine.getLocalBackupPoints());
      logAudit(
        'Importação de Backup JSON',
        'SETTING',
        'IMPORT_JSON',
        `Backup importado com sucesso. Snapshot de segurança: ${safetySnap.backupPoint?.id}.`,
        performer
      );
      showToast(
        'Backup JSON Importado',
        `Dados importados com sucesso. Snapshot ${safetySnap.backupPoint?.id} criado.`
      );
      return true;
    } catch (err: any) {
      showToast('Erro ao Ler JSON', err.message || 'O ficheiro fornecido não é um JSON válido.', 'error');
      return false;
    }
  };

  const exportBackupJSON = () => {
    const currentState = backupEngine.captureCurrentState();
    const serialized = JSON.stringify({ ...currentState, users }, null, 2);
    const blob = new Blob([serialized], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bali_catering_backup_${new Date().toISOString().slice(0, 10)}_${Date.now().toString().slice(-4)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Backup Exportado', 'Ficheiro JSON de backup descarregado com sucesso.');
  };

  const verifyCloudStatus = async () => {
    setCloudSyncState((prev) => ({ ...prev, status: 'SYNCING' }));
    try {
      const ping = await backupEngine.pingCloudService();
      setCloudSyncState({
        status: ping.online ? 'ONLINE' : 'OFFLINE',
        pendingQueueCount: 0,
        totalCloudBackups: ping.backupCount,
        lastSyncTimestamp: ping.serverTime || new Date().toISOString(),
      });
      if (ping.online) {
        showToast('Serviço Conectado', `Servidor de backup em nuvem operacional (${ping.backupCount} backups registados).`);
      } else {
        showToast('Serviço Offline', 'Servidor em nuvem temporariamente inacessível. Armazenamento local ativo.', 'warning');
      }
    } catch {
      setCloudSyncState((prev) => ({ ...prev, status: 'OFFLINE' }));
      showToast('Serviço Offline', 'Não foi possível conectar ao servidor em nuvem.', 'warning');
    }
  };

  const updateConfig = (newConfig: Partial<RestaurantConfig>) => {
    const authCheck = userEngine.canPerformAction(currentUser, 'UPDATE_CONFIG');
    if (!authCheck.allowed) {
      logAudit(
        'Tentativa de Alteração de Configurações Rejeitada',
        'SETTING',
        'CONFIG',
        `Tentativa não autorizada de modificar parâmetros do restaurante.`,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        'REJECTED_UNAUTHORIZED'
      );
      showToast('Acesso Negado', authCheck.reason, 'error');
      return;
    }

    setConfig((prev) => ({ ...prev, ...newConfig }));
    logAudit('Configurações Alteradas', 'SETTING', 'SISTEMA', 'Definições do restaurante atualizadas.');
    showToast('Configurações Atualizadas', 'Definições guardadas com sucesso.');
  };

  const resetAllData = () => {
    const authCheck = userEngine.canPerformAction(currentUser, 'RESET_DATA');
    if (!authCheck.allowed) {
      showToast('Acesso Negado', authCheck.reason, 'error');
      return;
    }

    storageEngine.clearAllData();
    window.location.reload();
  };

  return (
    <RestaurantContext.Provider
      value={{
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
        registerPayment,
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
        runSecurityAttackSimulation,
        backupPoints,
        cloudSyncState,
        conflictLogs,
        isAutoBackupRunning,
        createManualBackup,
        restoreBackupPoint,
        importBackupJSON,
        exportBackupJSON,
        verifyCloudStatus,
        updateConfig,
        resetAllData,
        showToast,
        removeToast,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
