import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product, OrderType, PaymentMethod, PaymentStatus } from '../../types';
import { formatMT } from '../../utils/formatters';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  Receipt,
  Flame,
  Utensils,
  CreditCard,
  Send,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OrderReceiptModal } from './OrderReceiptModal';

interface POSItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    createOrder,
    config,
    showToast,
  } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketItems, setTicketItems] = useState<POSItem[]>([]);
  const [customerName, setCustomerName] = useState('Cliente Balcão');
  const [customerPhone, setCustomerPhone] = useState('+258 87 202 2777');
  const [customerAddress, setCustomerAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [orderNotes, setOrderNotes] = useState('');
  const [printedOrder, setPrintedOrder] = useState<any | null>(null);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  const addItemToTicket = (product: Product) => {
    setTicketItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setTicketItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (productId: string) => {
    setTicketItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearTicket = () => {
    setTicketItems([]);
    setCustomerName('Cliente Balcão');
    setCustomerPhone('+258 87 202 2777');
    setCustomerAddress('');
    setTableNumber('');
    setOrderNotes('');
  };

  const subtotal = ticketItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const deliveryFee = orderType === 'DELIVERY' ? config.defaultDeliveryFee : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (ticketItems.length === 0) {
      showToast('Nenhum item selecionado', 'Adicione produtos à comanda.', 'warning');
      return;
    }

    const orderItems = ticketItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      unitCost: item.product.costPrice || 0,
      notes: item.notes,
    }));

    const created = createOrder({
      customerName: customerName.trim() || 'Cliente Balcão',
      customerPhone: customerPhone.trim() || '+258 87 202 2777',
      customerAddress:
        orderType === 'DELIVERY'
          ? customerAddress.trim()
          : orderType === 'DINE_IN'
          ? `Mesa ${tableNumber || 'Balcão'}`
          : 'Levantamento no Balcão Nuras',
      orderType,
      tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
      status: paymentStatus === 'PAID' ? 'PREPARING' : 'PENDING',
      items: orderItems,
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      paymentStatus,
      paymentMethod,
      notes: orderNotes,
    });

    confetti({ particleCount: 60, spread: 60 });
    setPrintedOrder(created);
    clearTicket();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Left (8 cols): Products Grid */}
      <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs overflow-hidden">
        {/* Top filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar produto ou código..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Categories Tab */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === c.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 p-1 scrollbar-thin">
          {filteredProducts.map((p) => {
            const inTicket = ticketItems.find((i) => i.product.id === p.id);
            return (
              <button
                key={p.id}
                onClick={() => addItemToTicket(p)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${
                  inTicket
                    ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-400/40'
                    : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-sm'
                }`}
              >
                <div className="w-full">
                  <div className="h-20 rounded-lg overflow-hidden bg-slate-100 mb-2 relative">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    {inTicket && (
                      <span className="absolute top-1 right-1 bg-orange-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                        {inTicket.quantity}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                    {p.name}
                  </h4>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-orange-600">{formatMT(p.price)}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {p.preparationTimeMinutes}m
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right (4 cols): Register Ticket & Checkout */}
      <div className="lg:col-span-4 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Register Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-orange-600" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Comanda / Ponto de Venda
            </h3>
          </div>
          {ticketItems.length > 0 && (
            <button
              onClick={clearTicket}
              className="text-red-600 text-[11px] font-bold hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Limpar
            </button>
          )}
        </div>

        {/* Form Details: Customer, Type */}
        <div className="p-3 bg-white border-b border-slate-100 space-y-2 text-xs">
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setOrderType('DINE_IN')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-all text-center ${
                orderType === 'DINE_IN'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              🍽️ No Local
            </button>
            <button
              type="button"
              onClick={() => setOrderType('TAKEAWAY')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-all text-center ${
                orderType === 'TAKEAWAY'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              🥡 Take-away
            </button>
            <button
              type="button"
              onClick={() => setOrderType('DELIVERY')}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition-all text-center ${
                orderType === 'DELIVERY'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              🛵 Entrega
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome do cliente"
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
            />
            {orderType === 'DINE_IN' ? (
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Nº da Mesa (ex: Mesa 04)"
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
              />
            ) : (
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Telefone"
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
              />
            )}
          </div>
        </div>

        {/* Selected Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {ticketItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
              <Utensils className="w-8 h-8 mb-2 stroke-1" />
              <p className="text-xs">Selecione pratos e bebidas ao lado para montar a comanda.</p>
            </div>
          ) : (
            ticketItems.map((item) => (
              <div
                key={item.product.id}
                className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formatMT(item.product.price)} • Total: <strong className="text-slate-800">{formatMT(item.product.price * item.quantity)}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-1.5 text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Payment & Checkout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/90 space-y-3">
          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Forma de Pagamento
            </span>
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'CASH', label: '💵 Dinheiro' },
                { id: 'MPESA', label: '📱 M-Pesa' },
                { id: 'EMOLA', label: '📱 E-Mola' },
                { id: 'POS_CARD', label: '💳 POS' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`py-1 px-1 rounded text-[10px] font-bold border truncate ${
                    paymentMethod === m.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subtotals */}
          <div className="space-y-1 text-xs text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatMT(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Taxa Entrega:</span>
                <span className="font-semibold text-slate-800">{formatMT(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>Total:</span>
              <span className="text-orange-600">{formatMT(total)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={ticketItems.length === 0}
            className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Registar Pedido & Baixar Estoque</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {printedOrder && (
        <OrderReceiptModal
          order={printedOrder}
          onClose={() => setPrintedOrder(null)}
        />
      )}
    </div>
  );
};
