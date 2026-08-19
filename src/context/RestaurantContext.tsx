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
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_INGREDIENTS,
  INITIAL_ORDERS,
  INITIAL_PAYMENTS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CONFIG,
} from '../data/initialData';

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
  | 'logs'
  | 'settings';

interface ToastNotification {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface RestaurantContextType {
  // State
  activeView: 'public' | 'admin';
  setActiveView: (view: 'public' | 'admin') => void;
  adminSubView: AdminSubView;
  setAdminSubView: (view: AdminSubView) => void;
  isAdminAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authenticateAdmin: (pin: string) => boolean;
  lockAdminSession: () => void;
  updateAdminPin: (currentPin: string, newPin: string) => { success: boolean; message: string };
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

  // Cart actions
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTotalItems: number;

  // Order actions
  createOrder: (orderData: Partial<Order>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => void;
  cancelOrder: (orderId: string, reason?: string) => void;

  // Stock actions
  addStockMovement: (
    ingredientId: string,
    type: StockMovementType,
    quantity: number,
    reason: string,
    performedBy?: string
  ) => void;
  deductStockForOrder: (order: Order) => boolean;

  // Product & Category actions
  createProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  createIngredient: (ingredient: Omit<Ingredient, 'id' | 'lastUpdated'>) => Ingredient;
  updateIngredient: (ingredientId: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (ingredientId: string) => void;
  updateProductRecipe: (productId: string, ingredients: RecipeIngredient[]) => void;

  // Payments
  registerPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => PaymentRecord;

  // Settings & Storage
  updateConfig: (newConfig: Partial<RestaurantConfig>) => void;
  resetAllData: () => void;
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CONFIG: 'bali_catering_config_v1',
  CATEGORIES: 'bali_catering_categories_v1',
  PRODUCTS: 'bali_catering_products_v1',
  INGREDIENTS: 'bali_catering_ingredients_v1',
  ORDERS: 'bali_catering_orders_v1',
  PAYMENTS: 'bali_catering_payments_v1',
  MOVEMENTS: 'bali_catering_movements_v1',
  CUSTOMERS: 'bali_catering_customers_v1',
  LOGS: 'bali_catering_logs_v1',
  CART: 'bali_catering_cart_v1',
};

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveViewState] = useState<'public' | 'admin'>('public');
  const [adminSubView, setAdminSubView] = useState<AdminSubView>('dashboard');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Safe wrapper for view switching with auth check
  const setActiveView = (view: 'public' | 'admin') => {
    if (view === 'admin') {
      if (isAdminAuthenticated) {
        setActiveViewState('admin');
      } else {
        setIsAuthModalOpen(true);
      }
    } else {
      setActiveViewState('public');
    }
  };

  // Load state with fallback to seed data
  const [config, setConfig] = useState<RestaurantConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  // Toast Helpers
  const showToast = (
    title: string,
    message?: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'success'
  ) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Add audit log helper
  const logAudit = (
    action: string,
    entity: AuditLog['entity'],
    entityId: string,
    description: string,
    user: string = 'Sistema'
  ) => {
    const newLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString().slice(2, 6),
      action,
      entity,
      entityId,
      description,
      user,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Cart Operations
  const addToCart = (product: Product, quantity = 1, notes?: string) => {
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

  // Stock deduction engine based on recipes (Fichas Técnicas)
  const deductStockForOrder = (order: Order): boolean => {
    let anyMovementCreated = false;
    const newMovements: StockMovement[] = [];
    let updatedIngredientsMap = new Map<string, Ingredient>(ingredients.map((i) => [i.id, { ...i }]));

    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.ingredients || product.ingredients.length === 0) return;

      product.ingredients.forEach((recipeItem) => {
        const ing = updatedIngredientsMap.get(recipeItem.ingredientId);
        if (!ing) return;

        const totalNeeded = recipeItem.quantity * item.quantity;
        const prevStock = ing.currentStock;
        const newStock = Number((prevStock - totalNeeded).toFixed(3));

        ing.currentStock = newStock;
        ing.lastUpdated = new Date().toISOString();
        updatedIngredientsMap.set(ing.id, ing);

        newMovements.push({
          id: 'mov-' + Date.now() + '-' + Math.random().toString().slice(2, 6),
          ingredientId: ing.id,
          ingredientName: ing.name,
          unit: ing.unit,
          type: 'EXIT_ORDER',
          quantity: Number(totalNeeded.toFixed(3)),
          previousStock: prevStock,
          newStock: newStock,
          reason: `Consumo automático ficha técnica - Pedido ${order.orderNumber} (${item.quantity}x ${item.productName})`,
          referenceOrderId: order.id,
          referenceOrderNumber: order.orderNumber,
          performedBy: 'Sistema Automático',
          createdAt: new Date().toISOString(),
        });

        anyMovementCreated = true;
      });
    });

    if (anyMovementCreated) {
      setIngredients(Array.from(updatedIngredientsMap.values()));
      setStockMovements((prev) => [...newMovements, ...prev]);
      logAudit(
        'Dedução de Estoque Automática',
        'STOCK',
        order.orderNumber,
        `Consumidos ingredientes de ${order.items.length} itens do pedido ${order.orderNumber}.`
      );
    }

    return anyMovementCreated;
  };

  // Stock Manual Movement (Entry, Waste, Adjustment)
  const addStockMovement = (
    ingredientId: string,
    type: StockMovementType,
    quantity: number,
    reason: string,
    performedBy = 'Administrador'
  ) => {
    const ing = ingredients.find((i) => i.id === ingredientId);
    if (!ing) return;

    const prevStock = ing.currentStock;
    let newStock = prevStock;

    if (type === 'ENTRY') {
      newStock = prevStock + quantity;
    } else if (type === 'EXIT_WASTE' || type === 'EXIT_ORDER') {
      newStock = prevStock - quantity;
    } else if (type === 'ADJUSTMENT') {
      // In adjustment, quantity is the new target stock directly
      newStock = quantity;
    }

    newStock = Number(newStock.toFixed(3));

    const movement: StockMovement = {
      id: 'mov-' + Date.now() + '-' + Math.random().toString().slice(2, 6),
      ingredientId: ing.id,
      ingredientName: ing.name,
      unit: ing.unit,
      type,
      quantity: type === 'ADJUSTMENT' ? Math.abs(newStock - prevStock) : quantity,
      previousStock: prevStock,
      newStock,
      reason,
      performedBy,
      createdAt: new Date().toISOString(),
    };

    setIngredients((prev) =>
      prev.map((item) =>
        item.id === ingredientId
          ? { ...item, currentStock: newStock, lastUpdated: new Date().toISOString() }
          : item
      )
    );

    setStockMovements((prev) => [movement, ...prev]);
    logAudit(
      'Movimentação de Estoque',
      'STOCK',
      ing.name,
      `${type === 'ENTRY' ? 'Entrada' : type === 'EXIT_WASTE' ? 'Perda/Desperdício' : 'Ajuste'} de ${movement.quantity} ${ing.unit} em "${ing.name}". Motivo: ${reason}`,
      performedBy
    );

    showToast('Estoque atualizado!', `${ing.name}: ${newStock} ${ing.unit} disponíveis.`);
  };

  // Create Order
  const createOrder = (orderData: Partial<Order>): Order => {
    const timestamp = new Date();
    const nextSeq = orders.length + 1045;
    const orderNumber = orderData.orderNumber || `BC-${nextSeq}`;

    const newOrder: Order = {
      id: 'order-' + Date.now(),
      orderNumber,
      customerName: orderData.customerName || 'Cliente Balcão',
      customerPhone: orderData.customerPhone || '+258 87 202 2777',
      customerAddress: orderData.customerAddress || '',
      orderType: orderData.orderType || 'TAKEAWAY',
      tableNumber: orderData.tableNumber,
      status: orderData.status || 'PENDING',
      items: orderData.items || [],
      subtotal: orderData.subtotal || 0,
      deliveryFee: orderData.deliveryFee || 0,
      discount: orderData.discount || 0,
      total: orderData.total || 0,
      paymentStatus: orderData.paymentStatus || 'PENDING',
      paymentMethod: orderData.paymentMethod || 'CASH',
      notes: orderData.notes || '',
      stockDeducted: false,
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString(),
    };

    // Auto deduct stock if configured or if order is immediately confirmed/preparing
    if (
      (config.autoDeductStockOnConfirm && newOrder.status !== 'CANCELLED') ||
      newOrder.status === 'CONFIRMED' ||
      newOrder.status === 'PREPARING' ||
      newOrder.status === 'DELIVERED'
    ) {
      deductStockForOrder(newOrder);
      newOrder.stockDeducted = true;
    }

    setOrders((prev) => [newOrder, ...prev]);

    // Update Customer CRM
    if (newOrder.customerName && newOrder.customerPhone) {
      setCustomers((prev) => {
        const existingCust = prev.find((c) => c.phone.replace(/\s+/g, '') === newOrder.customerPhone.replace(/\s+/g, ''));
        if (existingCust) {
          return prev.map((c) =>
            c.id === existingCust.id
              ? {
                  ...c,
                  name: newOrder.customerName,
                  address: newOrder.customerAddress || c.address,
                  totalOrders: c.totalOrders + 1,
                  totalSpent: c.totalSpent + newOrder.total,
                  lastOrderDate: timestamp.toISOString(),
                }
              : c
          );
        } else {
          const newCust: Customer = {
            id: 'cust-' + Date.now(),
            name: newOrder.customerName,
            phone: newOrder.customerPhone,
            address: newOrder.customerAddress,
            totalOrders: 1,
            totalSpent: newOrder.total,
            firstOrderDate: timestamp.toISOString(),
            lastOrderDate: timestamp.toISOString(),
          };
          return [newCust, ...prev];
        }
      });
    }

    logAudit(
      'Criação de Pedido',
      'ORDER',
      newOrder.orderNumber,
      `Pedido ${newOrder.orderNumber} criado para ${newOrder.customerName} (${newOrder.orderType}) total ${newOrder.total} MT.`
    );

    // If paid immediately, create payment record
    if (newOrder.paymentStatus === 'PAID') {
      registerPayment({
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        amount: newOrder.total,
        method: newOrder.paymentMethod,
        reference: `AUTO-${newOrder.paymentMethod}-${Date.now().toString().slice(-4)}`,
        status: 'COMPLETED',
        notes: `Pagamento recebido no registo do pedido ${newOrder.orderNumber}`,
        receivedBy: 'Caixa Bali',
      });
    }

    return newOrder;
  };

  // Update Order Status
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        let shouldDeduct = false;
        if (!order.stockDeducted && (newStatus === 'CONFIRMED' || newStatus === 'PREPARING' || newStatus === 'READY' || newStatus === 'DELIVERED')) {
          shouldDeduct = true;
        }

        if (shouldDeduct) {
          deductStockForOrder(order);
        }

        const updatedOrder: Order = {
          ...order,
          status: newStatus,
          stockDeducted: order.stockDeducted || shouldDeduct,
          updatedAt: new Date().toISOString(),
        };

        logAudit(
          'Alteração de Estado de Pedido',
          'ORDER',
          order.orderNumber,
          `Estado alterado de "${order.status}" para "${newStatus}".`
        );

        return updatedOrder;
      })
    );

    showToast('Estado atualizado', `Pedido foi alterado para ${newStatus}.`);
  };

  const updatePaymentStatus = (
    orderId: string,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod,
    reference?: string
  ) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        if (paymentStatus === 'PAID' && order.paymentStatus !== 'PAID') {
          registerPayment({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            amount: order.total,
            method: paymentMethod,
            reference: reference || `REF-${Date.now().toString().slice(-4)}`,
            status: 'COMPLETED',
            receivedBy: 'Caixa Balcão',
          });
        }

        return {
          ...order,
          paymentStatus,
          paymentMethod,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    showToast('Pagamento atualizado', `Pagamento registado como ${paymentStatus}.`);
  };

  const cancelOrder = (orderId: string, reason = 'Cancelado pelo operador') => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status: 'CANCELLED',
          notes: order.notes ? `${order.notes} [Cancelamento: ${reason}]` : `[Cancelamento: ${reason}]`,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    logAudit('Cancelamento de Pedido', 'ORDER', orderId, `Pedido cancelado. Motivo: ${reason}`);
    showToast('Pedido Cancelado', reason, 'warning');
  };

  // Register Payment Record
  const registerPayment = (paymentData: Omit<PaymentRecord, 'id' | 'createdAt'>): PaymentRecord => {
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: 'pay-' + Date.now() + '-' + Math.random().toString().slice(2, 6),
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);
    logAudit(
      'Registo de Pagamento',
      'PAYMENT',
      newPayment.orderNumber,
      `Pagamento de ${newPayment.amount} MT registado via ${newPayment.method}.`
    );

    return newPayment;
  };

  // Product CRUD
  const createProduct = (productData: Omit<Product, 'id'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: 'prod-' + Date.now(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    logAudit('Criação de Produto', 'PRODUCT', newProduct.name, `Produto "${newProduct.name}" adicionado ao cardápio.`);
    showToast('Produto Criado', `${newProduct.name} adicionado com sucesso.`);
    return newProduct;
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((prod) => (prod.id === productId ? { ...prod, ...updates } : prod))
    );
    logAudit('Atualização de Produto', 'PRODUCT', productId, `Produto atualizado.`);
    showToast('Produto Atualizado', 'Alterações guardadas com sucesso.');
  };

  const deleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (target) {
      logAudit('Remoção de Produto', 'PRODUCT', target.name, `Produto "${target.name}" removido.`);
      showToast('Produto Removido', `"${target.name}" foi removido do catálogo.`, 'info');
    }
  };

  // Ingredient CRUD
  const createIngredient = (
    ingredientData: Omit<Ingredient, 'id' | 'lastUpdated'>
  ): Ingredient => {
    const newIngredient: Ingredient = {
      ...ingredientData,
      id: 'ing-' + Date.now(),
      lastUpdated: new Date().toISOString(),
    };
    setIngredients((prev) => [...prev, newIngredient]);
    logAudit(
      'Criação de Ingrediente',
      'INGREDIENT',
      newIngredient.name,
      `Novo ingrediente cadastrado: ${newIngredient.name} (${newIngredient.unit}).`
    );
    showToast('Ingrediente Criado', `${newIngredient.name} cadastrado no estoque.`);
    return newIngredient;
  };

  const updateIngredient = (ingredientId: string, updates: Partial<Ingredient>) => {
    setIngredients((prev) =>
      prev.map((ing) =>
        ing.id === ingredientId
          ? { ...ing, ...updates, lastUpdated: new Date().toISOString() }
          : ing
      )
    );
    showToast('Ingrediente Atualizado', 'Dados do ingrediente guardados.');
  };

  const deleteIngredient = (ingredientId: string) => {
    const target = ingredients.find((i) => i.id === ingredientId);
    setIngredients((prev) => prev.filter((i) => i.id !== ingredientId));
    if (target) {
      logAudit('Remoção de Ingrediente', 'INGREDIENT', target.name, `Ingrediente "${target.name}" removido.`);
      showToast('Ingrediente Removido', `${target.name} removido do estoque.`, 'info');
    }
  };

  const updateProductRecipe = (productId: string, newRecipe: RecipeIngredient[]) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;
        // Calculate estimated cost based on ingredient unit costs
        const calculatedCost = newRecipe.reduce((total, item) => {
          const ing = ingredients.find((i) => i.id === item.ingredientId);
          return total + (ing ? ing.costPerUnit * item.quantity : 0);
        }, 0);

        return {
          ...prod,
          ingredients: newRecipe,
          costPrice: Math.round(calculatedCost),
        };
      })
    );
    logAudit('Atualização de Ficha Técnica', 'PRODUCT', productId, `Ficha técnica atualizada.`);
    showToast('Ficha Técnica Salva', 'Composição do produto e custo recalculados com sucesso.');
  };

  // Admin PIN Authentication Methods
  const authenticateAdmin = (pin: string): boolean => {
    const validPin = config.adminPinCode || '250420';
    if (pin.trim() === validPin.trim()) {
      setIsAdminAuthenticated(true);
      setActiveViewState('admin');
      setIsAuthModalOpen(false);
      logAudit('Acesso Administrativo', 'SETTING', 'AUTH', 'Sessão administrativa desbloqueada com sucesso.', 'Administrador');
      showToast('Sessão Desbloqueada', 'Bem-vindo ao Painel de Gestão do Bali Catering Service.');
      return true;
    } else {
      logAudit('Tentativa de Acesso Falhada', 'SETTING', 'AUTH', 'Tentativa de desbloqueio com código PIN incorreto.', 'Visitante');
      return false;
    }
  };

  const lockAdminSession = () => {
    setIsAdminAuthenticated(false);
    setActiveViewState('public');
    showToast('Sessão Bloqueada', 'Área administrativa foi protegida e encerrada.', 'info');
  };

  const updateAdminPin = (currentPin: string, newPin: string): { success: boolean; message: string } => {
    const validPin = config.adminPinCode || '250420';
    if (currentPin.trim() !== validPin.trim()) {
      return { success: false, message: 'O código PIN atual está incorreto.' };
    }
    if (!newPin || newPin.trim().length < 4) {
      return { success: false, message: 'O novo código PIN deve ter no mínimo 4 dígitos.' };
    }

    const updatedPin = newPin.trim();
    setConfig((prev) => ({ ...prev, adminPinCode: updatedPin }));
    logAudit('Alteração de Código PIN', 'SETTING', 'SEGURANÇA', 'Código de acesso administrativo (PIN) alterado com sucesso.', 'Administrador');
    showToast('PIN de Acesso Alterado', 'O novo código de gestão administrativa foi guardado com sucesso.');
    return { success: true, message: 'Código de acesso alterado com sucesso!' };
  };

  const updateConfig = (newConfig: Partial<RestaurantConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
    logAudit('Configurações Alteradas', 'SETTING', 'SISTEMA', 'Configurações gerais do restaurante atualizadas.');
    showToast('Configurações Atualizadas', 'Definições do Bali Catering gravadas com sucesso.');
  };

  const resetAllData = () => {
    localStorage.clear();
    setConfig(INITIAL_CONFIG);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setIngredients(INITIAL_INGREDIENTS);
    setOrders(INITIAL_ORDERS);
    setPayments(INITIAL_PAYMENTS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setCustomers(INITIAL_CUSTOMERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCart([]);
    setIsAdminAuthenticated(false);
    showToast('Dados Restaurados', 'O sistema foi reinicializado com os dados originais do Bali Catering.', 'info');
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
        authenticateAdmin,
        lockAdminSession,
        updateAdminPin,
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
        addStockMovement,
        deductStockForOrder,
        createProduct,
        updateProduct,
        deleteProduct,
        createIngredient,
        updateIngredient,
        deleteIngredient,
        updateProductRecipe,
        registerPayment,
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
