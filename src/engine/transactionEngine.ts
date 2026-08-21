import {
  Order,
  Product,
  Ingredient,
  Customer,
  PaymentRecord,
  StockMovement,
  AuditLog,
  RestaurantConfig,
  EngineResult,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from '../types';
import { validationEngine } from './validationEngine';
import { stockEngine } from './stockEngine';
import { orderEngine } from './orderEngine';

export interface CreateOrderTransactionResult {
  order: Order;
  updatedIngredients?: Ingredient[];
  generatedMovements?: StockMovement[];
  newPayment?: PaymentRecord;
  updatedCustomers: Customer[];
  auditLog: AuditLog;
}

export interface CancelOrderTransactionResult {
  updatedOrder: Order;
  updatedIngredients?: Ingredient[];
  generatedMovements?: StockMovement[];
  auditLog: AuditLog;
}

export const transactionEngine = {
  /**
   * Executes atomic order creation with verification and rollback protection
   */
  createOrderTransaction(
    orderData: Partial<Order>,
    existingOrders: Order[],
    products: Product[],
    ingredients: Ingredient[],
    customers: Customer[],
    config: RestaurantConfig,
    currentUser = 'Sistema'
  ): EngineResult<CreateOrderTransactionResult> {
    // 1. Anti-duplication lock
    const lockKey = `create-order-${orderData.customerPhone || 'anon'}-${Date.now().toString().slice(0, -3)}`;
    if (!orderEngine.acquireLock(lockKey, 2000)) {
      return {
        success: false,
        error: 'Uma operação similar está em processamento. Por favor aguarde um momento.',
      };
    }

    try {
      // 2. Validate Order Input
      const validation = validationEngine.validateOrder(orderData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors[0],
          validationErrors: validation.errors,
        };
      }

      // 3. Compute deterministic financials
      const items = orderData.items || [];
      const financials = orderEngine.calculateFinancials(
        items,
        orderData.deliveryFee || 0,
        orderData.discount || 0
      );

      const timestamp = new Date().toISOString();
      const orderNumber = orderData.orderNumber || orderEngine.generateOrderNumber(existingOrders);
      const orderId = 'order-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

      const newOrder: Order = {
        id: orderId,
        orderNumber,
        customerName: (orderData.customerName || 'Cliente').trim(),
        customerPhone: (orderData.customerPhone || '').trim(),
        customerAddress: orderData.customerAddress ? orderData.customerAddress.trim() : '',
        orderType: orderData.orderType || 'TAKEAWAY',
        tableNumber: orderData.tableNumber,
        status: orderData.status || 'PENDING',
        items,
        subtotal: financials.subtotal,
        deliveryFee: financials.deliveryFee,
        discount: financials.discount,
        total: financials.total,
        paymentStatus: orderData.paymentStatus || 'PENDING',
        paymentMethod: orderData.paymentMethod || 'CASH',
        notes: orderData.notes ? orderData.notes.trim() : '',
        stockDeducted: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // 4. Stock deduction logic
      const shouldDeductStock =
        config.autoDeductStockOnConfirm ||
        newOrder.status === 'CONFIRMED' ||
        newOrder.status === 'PREPARING' ||
        newOrder.status === 'DELIVERED';

      let updatedIngredients: Ingredient[] | undefined;
      let generatedMovements: StockMovement[] | undefined;

      if (shouldDeductStock) {
        const stockResult = stockEngine.processOrderStockDeduction(
          newOrder,
          products,
          ingredients,
          Boolean(config.allowNegativeStock)
        );

        if (!stockResult.success) {
          return {
            success: false,
            error: stockResult.error || 'Falha ao validar disponibilidade de estoque.',
            rollbackApplied: true,
          };
        }

        updatedIngredients = stockResult.updatedIngredients;
        generatedMovements = stockResult.generatedMovements;
        newOrder.stockDeducted = true;
      }

      // 5. Payment record if paid
      let newPayment: PaymentRecord | undefined;
      if (newOrder.paymentStatus === 'PAID') {
        newPayment = {
          id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          orderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          customerName: newOrder.customerName,
          amount: newOrder.total,
          method: newOrder.paymentMethod,
          reference: `AUTO-${newOrder.paymentMethod}-${Date.now().toString().slice(-4)}`,
          status: 'COMPLETED',
          notes: `Pagamento automático registado no ato da venda do pedido ${newOrder.orderNumber}.`,
          createdAt: timestamp,
          receivedBy: currentUser,
        };
      }

      // 6. Customer CRM Sync (Atomic)
      const cleanPhone = newOrder.customerPhone.replace(/[^0-9+]/g, '');
      let updatedCustomers = [...customers];

      if (newOrder.customerName && cleanPhone) {
        const existingIndex = updatedCustomers.findIndex(
          (c) => c.phone.replace(/[^0-9+]/g, '') === cleanPhone
        );

        if (existingIndex >= 0) {
          const existing = updatedCustomers[existingIndex];
          updatedCustomers[existingIndex] = {
            ...existing,
            name: newOrder.customerName,
            address: newOrder.customerAddress || existing.address,
            totalOrders: existing.totalOrders + 1,
            totalSpent: existing.totalSpent + newOrder.total,
            lastOrderDate: timestamp,
          };
        } else {
          const newCust: Customer = {
            id: 'cust-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
            name: newOrder.customerName,
            phone: newOrder.customerPhone,
            address: newOrder.customerAddress,
            totalOrders: 1,
            totalSpent: newOrder.total,
            firstOrderDate: timestamp,
            lastOrderDate: timestamp,
          };
          updatedCustomers = [newCust, ...updatedCustomers];
        }
      }

      // 7. Audit log
      const auditLog: AuditLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action: 'Criação de Pedido',
        entity: 'ORDER',
        entityId: newOrder.orderNumber,
        description: `Pedido ${newOrder.orderNumber} criado para ${newOrder.customerName} no valor de ${newOrder.total} MT (${newOrder.orderType}).`,
        user: currentUser,
        timestamp,
      };

      return {
        success: true,
        data: {
          order: newOrder,
          updatedIngredients,
          generatedMovements,
          newPayment,
          updatedCustomers,
          auditLog,
        },
      };
    } finally {
      orderEngine.releaseLock(lockKey);
    }
  },

  /**
   * Executes atomic order cancellation with stock reversal
   */
  cancelOrderTransaction(
    order: Order,
    products: Product[],
    ingredients: Ingredient[],
    reason = 'Cancelado pelo operador',
    currentUser = 'Administrador'
  ): EngineResult<CancelOrderTransactionResult> {
    if (order.status === 'CANCELLED') {
      return {
        success: false,
        error: `O pedido ${order.orderNumber} já está cancelado.`,
      };
    }

    const timestamp = new Date().toISOString();
    let updatedIngredients: Ingredient[] | undefined;
    let generatedMovements: StockMovement[] | undefined;

    // If stock was deducted, reverse it back into inventory
    if (order.stockDeducted) {
      const reversal = stockEngine.processOrderStockReversal(
        order,
        products,
        ingredients,
        `Estorno por cancelamento do pedido: ${reason}`
      );
      updatedIngredients = reversal.updatedIngredients;
      generatedMovements = reversal.generatedMovements;
    }

    const updatedOrder: Order = {
      ...order,
      status: 'CANCELLED',
      notes: order.notes
        ? `${order.notes} [Cancelamento: ${reason}]`
        : `[Cancelamento: ${reason}]`,
      updatedAt: timestamp,
    };

    const auditLog: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      action: 'Cancelamento de Pedido',
      entity: 'ORDER',
      entityId: order.orderNumber,
      description: `Pedido ${order.orderNumber} cancelado. Motivo: ${reason}${
        order.stockDeducted ? ' (Estoque estornado automaticamente).' : ''
      }`,
      user: currentUser,
      timestamp,
    };

    return {
      success: true,
      data: {
        updatedOrder,
        updatedIngredients,
        generatedMovements,
        auditLog,
      },
    };
  },
};
