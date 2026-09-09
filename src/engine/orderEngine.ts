import { Order, OrderStatus, CartItem, RestaurantConfig, OrderItem } from '../types';
import { formatMT } from '../utils/formatters';

const activeLocks = new Map<string, number>();

export const orderEngine = {
  /**
   * Generates monotonic order number
   */
  generateOrderNumber(existingOrders: Order[] | number): string {
    const count = typeof existingOrders === 'number' ? existingOrders : existingOrders.length;
    const seq = count + 1045;
    return `BC-${seq}`;
  },

  /**
   * Mutex lock to prevent double clicks and duplicate submissions
   */
  acquireLock(key: string, ttlMs = 3000): boolean {
    const now = Date.now();
    const existingExpiry = activeLocks.get(key);

    if (existingExpiry && existingExpiry > now) {
      return false; // Lock is already active
    }

    activeLocks.set(key, now + ttlMs);
    return true;
  },

  releaseLock(key: string): void {
    activeLocks.delete(key);
  },

  /**
   * Financial computation with safe rounding
   */
  calculateFinancials(
    items: OrderItem[],
    deliveryFee = 0,
    discount = 0
  ): {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    total: number;
  } {
    const subtotal = items.reduce((acc, item) => {
      const lineTotal = (item.price || 0) * (item.quantity || 0);
      return acc + lineTotal;
    }, 0);

    const safeDelivery = Math.max(0, deliveryFee || 0);
    const safeDiscount = Math.max(0, discount || 0);
    const total = Math.max(0, Math.round(subtotal + safeDelivery - safeDiscount));

    return {
      subtotal: Math.round(subtotal),
      deliveryFee: safeDelivery,
      discount: safeDiscount,
      total,
    };
  },

  buildWhatsAppOrderMessage(
    customerName: string,
    customerPhone: string,
    customerAddress: string,
    orderType: string,
    tableNumber: string | undefined,
    cart: CartItem[],
    notes: string,
    config: RestaurantConfig
  ): string {
    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const deliveryFee = orderType === 'DELIVERY' ? config.defaultDeliveryFee : 0;
    const total = subtotal + deliveryFee;

    const typeLabel =
      orderType === 'DELIVERY'
        ? '🛵 Entrega ao Domicílio'
        : orderType === 'DINE_IN'
        ? `🍽️ Consumo no Local ${tableNumber ? `(${tableNumber})` : ''}`
        : '🥡 Levantamento / Take-away';

    const itemsText = cart
      .map(
        (item) =>
          `• ${item.quantity}x *${item.product.name}* (${formatMT(item.product.price * item.quantity)})${
            item.notes ? `\n  ↳ _Obs: ${item.notes}_` : ''
          }`
      )
      .join('\n');

    const message = [
      `*NOVO PEDIDO - ${config.name.toUpperCase()}*`,
      `---------------------------------`,
      `👤 *Cliente:* ${customerName}`,
      `📞 *Contacto:* ${customerPhone}`,
      `📍 *Modalidade:* ${typeLabel}`,
      orderType === 'DELIVERY' && customerAddress ? `🏠 *Endereço:* ${customerAddress}` : '',
      `---------------------------------`,
      `📋 *Itens Solicitados:*`,
      itemsText,
      `---------------------------------`,
      `💵 *Subtotal:* ${formatMT(subtotal)}`,
      deliveryFee > 0 ? `🛵 *Taxa de Entrega:* ${formatMT(deliveryFee)}` : '',
      `💰 *TOTAL DO PEDIDO:* ${formatMT(total)}`,
      notes ? `\n📝 *Observações:* ${notes}` : '',
      `\n_Obrigado por escolher o ${config.name}! Aguardo a confirmação._`,
    ]
      .filter(Boolean)
      .join('\n');

    return message;
  },

  /**
   * Deterministic State Machine for Orders
   */
  canTransitionStatus(current: OrderStatus, next: OrderStatus): boolean {
    if (current === next) return true;
    if (current === 'CANCELLED') return false; // Cancelled is terminal
    if (current === 'DELIVERED') return false; // Delivered is terminal

    const flow: Record<OrderStatus, OrderStatus[]> = {
          RECEIVED: ['PENDING', 'CONFIRMED', 'CANCELLED'],
          PENDING: ['RECEIVED', 'CONFIRMED', 'PREPARING', 'CANCELLED'],
          CONFIRMED: ['PREPARING', 'READY', 'CANCELLED'],
          PREPARING: ['READY', 'DELIVERED', 'CANCELLED'],
          READY: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
          OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
          DELIVERED: [],
          CANCELLED: [],
        };

    return flow[current]?.includes(next) ?? false;
  },

  validateStatusTransition(
    current: OrderStatus,
    next: OrderStatus
  ): { allowed: boolean; reason?: string } {
    if (current === next) {
      return { allowed: true };
    }

    if (current === 'CANCELLED') {
      return {
        allowed: false,
        reason: 'O pedido foi cancelado e não pode ser reativado diretamente.',
      };
    }

    if (current === 'DELIVERED') {
      return {
        allowed: false,
        reason: 'O pedido já foi finalizado/entregue e não pode ter o estado revertido.',
      };
    }

    if (!this.canTransitionStatus(current, next)) {
      return {
        allowed: false,
        reason: `Transição de estado inválida: Não é permitido mudar de "${current}" diretamente para "${next}".`,
      };
    }

    return { allowed: true };
  },
};
