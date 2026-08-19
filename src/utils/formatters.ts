import { OrderStatus, PaymentStatus, PaymentMethod, StockMovementType, OrderType } from '../types';

export const formatMT = (amount: number): string => {
  return new Intl.NumberFormat('pt-MZ', {
    maximumFractionDigits: 0,
  }).format(amount) + ' MT';
};

export const formatNumber = (num: number, decimals = 2): string => {
  return new Intl.NumberFormat('pt-MZ', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: Number.isInteger(num) ? 0 : Math.min(2, decimals),
  }).format(num);
};

export const formatDate = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
};

export const getOrderStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'Pendente';
    case 'CONFIRMED':
      return 'Confirmado';
    case 'PREPARING':
      return 'Em Preparação';
    case 'READY':
      return 'Pronto';
    case 'DELIVERED':
      return 'Entregue / Concluído';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
};

export const getOrderStatusBadgeColor = (status: OrderStatus): { bg: string; text: string; border: string } => {
  switch (status) {
    case 'PENDING':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'CONFIRMED':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'PREPARING':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'READY':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'DELIVERED':
      return { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-300' };
    case 'CANCELLED':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  }
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  switch (status) {
    case 'PAID':
      return 'Pago';
    case 'PENDING':
      return 'Pendente';
    case 'PARTIALLY_PAID':
      return 'Parcial';
    default:
      return status;
  }
};

export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  switch (method) {
    case 'MPESA':
      return 'M-Pesa';
    case 'EMOLA':
      return 'E-Mola';
    case 'CASH':
      return 'Dinheiro / Numerário';
    case 'POS_CARD':
      return 'Cartão / POS';
    case 'BANK_TRANSFER':
      return 'Transferência Bancária';
    default:
      return method;
  }
};

export const getOrderTypeLabel = (type: OrderType): string => {
  switch (type) {
    case 'DINE_IN':
      return 'Consumo no Local';
    case 'TAKEAWAY':
      return 'Levantamento (Take-away)';
    case 'DELIVERY':
      return 'Entrega ao Domicílio';
    case 'EVENT_CATERING':
      return 'Catering / Evento';
    default:
      return type;
  }
};

export const getStockMovementTypeLabel = (type: StockMovementType): string => {
  switch (type) {
    case 'ENTRY':
      return 'Entrada de Estoque';
    case 'EXIT_ORDER':
      return 'Saída por Pedido';
    case 'EXIT_WASTE':
      return 'Perda / Desperdício';
    case 'ADJUSTMENT':
      return 'Ajuste de Inventário';
    default:
      return type;
  }
};

export const getStockMovementBadgeColor = (type: StockMovementType): { bg: string; text: string; border: string } => {
  switch (type) {
    case 'ENTRY':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'EXIT_ORDER':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'EXIT_WASTE':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'ADJUSTMENT':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  }
};

/**
 * Builds clean WhatsApp ordering message URL
 */
export const buildWhatsAppOrderUrl = (
  phone: string,
  customerName: string,
  customerAddress: string,
  orderType: OrderType,
  items: { productName: string; quantity: number; price: number; notes?: string }[],
  deliveryFee: number,
  total: number,
  notes?: string
): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const lines: string[] = [
    `*NOVO PEDIDO - BALI CATERING SERVICE* 🥘`,
    `Olá! Gostaria de fazer o seguinte pedido:`,
    ``,
    `👤 *Cliente:* ${customerName}`,
    `📍 *Tipo:* ${getOrderTypeLabel(orderType)}`,
  ];

  if (customerAddress) {
    lines.push(`🏠 *Endereço / Local:* ${customerAddress}`);
  }

  lines.push(``, `📋 *ITENS DO PEDIDO:*`);
  items.forEach((item, idx) => {
    const itemTotal = item.price * item.quantity;
    lines.push(`${idx + 1}. *${item.quantity}x* ${item.productName} - ${formatMT(itemTotal)}`);
    if (item.notes) {
      lines.push(`   _Obs: ${item.notes}_`);
    }
  });

  lines.push(``);
  if (deliveryFee > 0) {
    lines.push(`🛵 *Taxa de Entrega:* ${formatMT(deliveryFee)}`);
  }
  lines.push(`💰 *TOTAL:* *${formatMT(total)}*`);

  if (notes) {
    lines.push(``, `📝 *Observações Adicionais:* ${notes}`);
  }

  lines.push(``, `Localização: Nuras – Hotel Estrela, Tete.`);
  lines.push(`Por favor, confirmem a disponibilidade e tempo estimado de entrega. Obrigado!`);

  const fullText = lines.join('\n');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`;
};
