import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product, OrderType, PaymentMethod, PaymentStatus } from '../../types';
import { formatMT } from '../../utils/formatters';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Receipt,
  Utensils,
  User,
  Phone,
  MapPin,
  FileText,
  Sparkles,
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
    customers,
    orders,
    config,
    showToast,
  } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketItems, setTicketItems] = useState<POSItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+258 ');
  const [customerAddress, setCustomerAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID');
  const [orderNotes, setOrderNotes] = useState('');
  const [printedOrder, setPrintedOrder] = useState<any | null>(null);

  // Autocomplete customer names list from customers database and previous orders
  const knownCustomerNames = useMemo(() => {
    const namesSet = new Set<string>();
    customers.forEach((c) => {
      if (c.name) namesSet.add(c.name.trim());
    });
    orders.forEach((o) => {
      if (o.customerName) namesSet.add(o.customerName.trim());
    });
    return Array.from(namesSet).filter(Boolean);
  }, [customers, orders]);

  // Handle autocomplete name selection
  const handleNameChange = (newName: string) => {
    setCustomerName(newName);
    const matchedCustomer = customers.find(
      (c) => c.name.toLowerCase().trim() === newName.toLowerCase().trim()
    );
    if (matchedCustomer) {
      if (matchedCustomer.phone) setCustomerPhone(matchedCustomer.phone);
      if (matchedCustomer.address && orderType === 'DELIVERY') {
        setCustomerAddress(matchedCustomer.address);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isAvailable) return false;
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

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
    setCustomerName('');
    setCustomerPhone('+258 ');
    setCustomerAddress('');
    setTableNumber('');
    setOrderNotes('');
  };

  const subtotal = ticketItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const deliveryFee = orderType === 'DELIVERY' ? config.defaultDeliveryFee : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    if (ticketItems.length === 0) {
      showToast('Nenhum item selecionado', 'Adicione pratos ou bebidas à comanda.', 'warning');
      return;
    }

    const trimmedName = customerName.trim() || 'Cliente Balcão';

    const orderItems = ticketItems.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      unitCost: item.product.costPrice || 0,
      notes: item.notes,
    }));

    const created = createOrder({
      customerName: trimmedName,
      customerPhone: customerPhone.trim() || '+258 87 202 2777',
      customerAddress:
        orderType === 'DELIVERY'
          ? customerAddress.trim() || 'Tete'
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

    if (created) {
      confetti({ particleCount: 50, spread: 60 });
      setPrintedOrder(created);
      clearTicket();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-140px)]">
      {/* Left (7 cols): Products Catalog & Search */}
      <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs overflow-hidden">
        {/* Top Search & Category Filter */}
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

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-[#E86319] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 p-1 scrollbar-thin max-h-[600px]">
          {filteredProducts.map((p) => {
            const inTicket = ticketItems.find((i) => i.product.id === p.id);
            return (
              <button
                key={p.id}
                onClick={() => addItemToTicket(p)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group cursor-pointer ${
                  inTicket
                    ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-400/40'
                    : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-sm'
                }`}
              >
                <div className="w-full">
                  <div className="h-24 rounded-lg overflow-hidden bg-slate-100 mb-2 relative">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    {inTicket && (
                      <span className="absolute top-1.5 right-1.5 bg-[#E86319] text-white font-extrabold text-[11px] w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                        {inTicket.quantity}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                    {p.name}
                  </h4>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-[#E86319]">{formatMT(p.price)}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {p.preparationTimeMinutes}m
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right (5 cols): Order Details & Autocomplete Form */}
      <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#E86319]" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Novo Pedido / Comanda
            </h3>
          </div>
          {ticketItems.length > 0 && (
            <button
              onClick={clearTicket}
              className="text-red-600 text-[11px] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Limpar
            </button>
          )}
        </div>

        {/* Autocomplete Customer Input & Order Type */}
        <div className="p-4 bg-white border-b border-slate-100 space-y-3 text-xs">
          {/* Order Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOrderType('DINE_IN')}
              className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all text-center cursor-pointer ${
                orderType === 'DINE_IN'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🍽️ No Local
            </button>
            <button
              type="button"
              onClick={() => setOrderType('TAKEAWAY')}
              className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all text-center cursor-pointer ${
                orderType === 'TAKEAWAY'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🥡 Take-away
            </button>
            <button
              type="button"
              onClick={() => setOrderType('DELIVERY')}
              className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all text-center cursor-pointer ${
                orderType === 'DELIVERY'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              🛵 Entrega
            </button>
          </div>

          {/* Autocomplete Customer Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#E86319]" />
                <span>Nome do Cliente / Pedido (Autopreenchimento)</span>
              </span>
              {customerName && (
                <span className="text-[10px] text-slate-400 font-normal">
                  {knownCustomerNames.includes(customerName) ? '⭐ Cliente Registado' : 'Novo'}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                list="pos-customer-names-list"
                value={customerName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Digite o nome ou selecione da lista..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/70 font-semibold text-slate-900"
              />
              <datalist id="pos-customer-names-list">
                {knownCustomerNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Quick Select Frequent Customer Tags */}
          {knownCustomerNames.length > 0 && !customerName && (
            <div className="flex flex-wrap gap-1 items-center pt-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Rápidos:</span>
              {knownCustomerNames.slice(0, 4).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleNameChange(name)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-orange-100 hover:text-orange-900 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  {name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {/* Contextual Fields (Phone, Table, Address) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+258 87 202 2777"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
              />
            </div>

            {orderType === 'DINE_IN' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Utensils className="w-3 h-3" /> Nº da Mesa
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ex: Mesa 04 / Balcão"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 font-semibold"
                />
              </div>
            )}

            {orderType === 'DELIVERY' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Endereço de Entrega
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Bairro / Rua em Tete"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 font-semibold"
                />
              </div>
            )}

            {orderType === 'TAKEAWAY' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Observação Rápida
                </label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ex: Embalar para viagem"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* Selected Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin max-h-[260px]">
          {ticketItems.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400 p-6 border-2 border-dashed border-slate-100 rounded-xl">
              <Utensils className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs">Selecione pratos ou bebidas ao lado para montar a comanda.</p>
            </div>
          ) : (
            ticketItems.map((item) => (
              <div
                key={item.product.id}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {formatMT(item.product.price)} • Total:{' '}
                    <strong className="text-slate-900">
                      {formatMT(item.product.price * item.quantity)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment & Checkout Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/90 space-y-3">
          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Forma de Pagamento
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAID')}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                    paymentStatus === 'PAID'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  ✓ Pago
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PENDING')}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                    paymentStatus === 'PENDING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  ⏳ Pendente
                </button>
              </div>
            </div>

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
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border truncate cursor-pointer transition-all ${
                    paymentMethod === m.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
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
              <span className="text-[#E86319]">{formatMT(total)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={ticketItems.length === 0}
            className="w-full py-3 rounded-xl bg-[#E86319] hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-md hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Registar Pedido & Emitir Comanda</span>
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
