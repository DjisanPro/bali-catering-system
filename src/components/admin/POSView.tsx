import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product, OrderType, PaymentMethod, PaymentStatus } from '../../types';
import { formatMT } from '../../utils/formatters';
import { stockEngine } from '../../engine/stockEngine';
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
  AlertTriangle,
  Wallet,
  ArrowRight,
  CreditCard,
  Smartphone,
  Banknote,
  DollarSign,
  Keyboard,
  PartyPopper,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OrderReceiptModal } from './OrderReceiptModal';
import { CashShiftModal } from './CashShiftModal';

interface POSItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    ingredients,
    createOrder,
    customers,
    orders,
    config,
    showToast,
    currentCashShift,
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

  // Estados de Pagamento e Troco
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [isCashShiftModalOpen, setIsCashShiftModalOpen] = useState(false);
  const [printedOrder, setPrintedOrder] = useState<any | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const receivedInputRef = useRef<HTMLInputElement>(null);

  // Autocomplete de clientes conhecidos
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

  // Cálculo de disponibilidade de estoque por produto em tempo real (Fichas Técnicas)
  const productStockStatusMap = useMemo(() => {
    const map = new Map<
      string,
      { status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'; maxPortions: number; limitingIngredient?: string }
    >();
    products.forEach((p) => {
      const stockInfo = stockEngine.calculateProductStockAvailability(p, ingredients);
      map.set(p.id, stockInfo);
    });
    return map;
  }, [products, ingredients]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isAvailable || p.isDeleted || p.status === 'INACTIVE') return false;
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const addItemToTicket = (product: Product) => {
    const stockInfo = productStockStatusMap.get(product.id);
    if (stockInfo && stockInfo.status === 'OUT_OF_STOCK') {
      showToast(
        'Item Esgotado',
        `Insumo insuficiente para preparar "${product.name}" (${stockInfo.limitingIngredient || 'estoque zero'}).`,
        'warning'
      );
      return;
    }

    setTicketItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (stockInfo && existing.quantity >= stockInfo.maxPortions) {
          showToast(
            'Limite de Estoque',
            `Apenas ${stockInfo.maxPortions} porções disponíveis para "${product.name}".`,
            'info'
          );
          return prev;
        }
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
    const stockInfo = productStockStatusMap.get(productId);
    if (stockInfo && quantity > stockInfo.maxPortions) {
      showToast(
        'Limite de Estoque',
        `Estoque suporta no máximo ${stockInfo.maxPortions} porções.`,
        'warning'
      );
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
    setReceivedAmount('');
    setIsPaymentModalOpen(false);
  };

  const subtotal = ticketItems.reduce((acc, i) => acc + i.product.price * i.quantity, 0);
  const deliveryFee = orderType === 'DELIVERY' ? config.defaultDeliveryFee : 0;
  const total = subtotal + deliveryFee;

  // Atalhos de teclado no desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evita atalhos se estiver digitando em outros inputs
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        clearTicket();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (ticketItems.length > 0) {
          setIsPaymentModalOpen(true);
        }
      } else if (e.key === 'Escape') {
        if (isPaymentModalOpen) {
          setIsPaymentModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ticketItems, isPaymentModalOpen]);

  // Abre modal de pagamento ou finaliza direto
  const handleOpenPaymentModal = () => {
    if (ticketItems.length === 0) {
      showToast('Nenhum item selecionado', 'Adicione pratos ou bebidas à comanda.', 'warning');
      return;
    }
    setReceivedAmount(total.toString());
    setIsPaymentModalOpen(true);
    setTimeout(() => {
      receivedInputRef.current?.focus();
      receivedInputRef.current?.select();
    }, 100);
  };

  const numReceived = Number(receivedAmount) || 0;
  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, numReceived - total) : 0;
  const isInsufficientCash = paymentMethod === 'CASH' && numReceived < total && numReceived > 0;

  const handleFinalizeOrder = async () => {
    if (ticketItems.length === 0) return;

    if (paymentMethod === 'CASH' && paymentStatus === 'PAID' && numReceived < total) {
      showToast('Valor Insuficiente', 'O valor entregue em dinheiro é menor que o total.', 'error');
      receivedInputRef.current?.focus();
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

    const created = await createOrder({
      customerName: trimmedName,
      customerPhone: customerPhone.trim() || '+258 87 202 2777',
      customerAddress:
        orderType === 'DELIVERY'
          ? customerAddress.trim() || 'Tete'
          : orderType === 'DINE_IN'
          ? `Mesa ${tableNumber || 'Balcão'}`
          : orderType === 'EVENT_CATERING'
          ? 'Evento / Catering'
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
      confetti({ particleCount: 60, spread: 70 });
      setPrintedOrder(created);
      clearTicket();
      setIsPaymentModalOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Status Operacional e Caixa */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              currentCashShift
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                {currentCashShift
                  ? `Turno #${currentCashShift.shiftNumber} em Operação`
                  : 'Caixa Fechado'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                  currentCashShift
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentCashShift ? 'Aberto' : 'Aguardando Abertura'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {currentCashShift
                ? `Operador: ${currentCashShift.openedBy} • Dinheiro em gaveta: ${formatMT(
                    currentCashShift.expectedCash
                  )}`
                : 'Abra o turno para iniciar a faturação com controlo de troco'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Keyboard className="w-3.5 h-3.5 text-slate-400" />
            <span>
              <kbd className="font-bold text-slate-700">F2</kbd> Busca •{' '}
              <kbd className="font-bold text-slate-700">F4</kbd> Limpar •{' '}
              <kbd className="font-bold text-slate-700">F8</kbd> Pagar
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCashShiftModalOpen(true)}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              currentCashShift
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : 'bg-[#F27D26] hover:bg-orange-600 text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>{currentCashShift ? 'Gerir Caixa' : 'Abrir Caixa'}</span>
          </button>
        </div>
      </div>

      {/* Grade Principal do PDV: Catálogo à esquerda (7 colunas) + Comanda à direita (5 colunas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[calc(100vh-210px)]">
        {/* Esquerda (7 cols): Catálogo, Busca e Filtros */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs overflow-hidden">
          {/* Barra de Busca e Categorias */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar produto ou código (F2)..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/70 font-semibold"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-[#F27D26] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Grade de Produtos */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 p-1 scrollbar-thin max-h-[620px]">
            {filteredProducts.map((p) => {
              const inTicket = ticketItems.find((i) => i.product.id === p.id);
              const stockInfo = productStockStatusMap.get(p.id) || {
                status: 'IN_STOCK',
                maxPortions: 999,
              };
              const isOut = stockInfo.status === 'OUT_OF_STOCK';
              const isLow = stockInfo.status === 'LOW_STOCK';

              return (
                <motion.button
                  key={p.id}
                  whileTap={!isOut ? { scale: 0.97 } : undefined}
                  type="button"
                  onClick={() => addItemToTicket(p)}
                  disabled={isOut}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group select-none ${
                    isOut
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : inTicket
                      ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-400/40 cursor-pointer'
                      : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div className="w-full">
                    {/* Imagem do Produto */}
                    <div className="h-24 rounded-xl overflow-hidden bg-slate-100 mb-2 relative">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          !isOut ? 'group-hover:scale-105' : 'grayscale'
                        }`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />

                      {/* Quantidade na comanda */}
                      {inTicket && (
                        <span className="absolute top-1.5 right-1.5 bg-[#F27D26] text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                          {inTicket.quantity}
                        </span>
                      )}

                      {/* Badge de Estoque em Tempo Real (Agente 6) */}
                      <div className="absolute bottom-1.5 left-1.5">
                        {isOut ? (
                          <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Esgotado
                          </span>
                        ) : isLow ? (
                          <span className="bg-amber-500 text-slate-900 text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                            Últimas {stockInfo.maxPortions} un.
                          </span>
                        ) : stockInfo.maxPortions < 900 ? (
                          <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                            {stockInfo.maxPortions} disp.
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-[#F27D26]">{formatMT(p.price)}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {p.preparationTimeMinutes}m
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Direita (5 cols): Comanda / Detalhes do Pedido e Checkout */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Cabeçalho da Comanda */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#F27D26]" />
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Comanda em Atendimento
              </h3>
            </div>
            {ticketItems.length > 0 && (
              <button
                type="button"
                onClick={clearTicket}
                className="text-red-600 hover:text-red-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Limpar (F4)
              </button>
            )}
          </div>

          {/* Seleção do Tipo de Pedido (Agente 4) */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setOrderType('DINE_IN')}
                className={`py-2 px-1 rounded-xl font-bold text-[11px] border transition-all text-center cursor-pointer ${
                  orderType === 'DINE_IN'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🍽️ Mesa
              </button>
              <button
                type="button"
                onClick={() => setOrderType('TAKEAWAY')}
                className={`py-2 px-1 rounded-xl font-bold text-[11px] border transition-all text-center cursor-pointer ${
                  orderType === 'TAKEAWAY'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🥡 Takeaway
              </button>
              <button
                type="button"
                onClick={() => setOrderType('DELIVERY')}
                className={`py-2 px-1 rounded-xl font-bold text-[11px] border transition-all text-center cursor-pointer ${
                  orderType === 'DELIVERY'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🛵 Entrega
              </button>
              <button
                type="button"
                onClick={() => setOrderType('EVENT_CATERING')}
                className={`py-2 px-1 rounded-xl font-bold text-[11px] border transition-all text-center cursor-pointer ${
                  orderType === 'EVENT_CATERING'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🎉 Catering
              </button>
            </div>

            {/* Identificação do Cliente */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#F27D26]" />
                  <span>Cliente</span>
                </label>
                {customerName && knownCustomerNames.includes(customerName) && (
                  <span className="text-[10px] text-emerald-700 font-bold">✓ Cliente Fiel</span>
                )}
              </div>
              <input
                type="text"
                list="pos-customers-list"
                value={customerName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Nome do cliente (ou deixe vazio para Balcão)..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-semibold text-slate-900"
              />
              <datalist id="pos-customers-list">
                {knownCustomerNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Campos Contextuais por Tipo de Pedido */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> WhatsApp
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+258 87 202 2777"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
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
                    placeholder="Ex: Mesa 04"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 font-bold"
                  />
                </div>
              )}

              {orderType === 'DELIVERY' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Bairro em Tete
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Endereço de entrega"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
                  />
                </div>
              )}

              {(orderType === 'TAKEAWAY' || orderType === 'EVENT_CATERING') && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Observações
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ex: Sem cebola, embalar"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Lista de Itens Adicionados */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin max-h-[260px]">
            {ticketItems.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400 p-6 border-2 border-dashed border-slate-100 rounded-2xl">
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
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      aria-label="Remover item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rodapé com Totais e Botão de Pagamento */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/90 space-y-3">
            {/* Resumo Financeiro */}
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatMT(subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Taxa de Entrega:</span>
                  <span className="font-semibold text-slate-800">{formatMT(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Total a Cobrar:</span>
                <span className="text-[#F27D26]">{formatMT(total)}</span>
              </div>
            </div>

            {/* Botão de Finalização / Pagamento */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleOpenPaymentModal}
              disabled={ticketItems.length === 0}
              className="w-full py-3.5 rounded-xl bg-[#F27D26] hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm shadow-md hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <DollarSign className="w-5 h-5" />
              <span>Concluir Pagamento & Emitir (F8)</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Modal de Pagamento & Cálculo Automático de Troco (Agente 4) */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative"
            >
              {/* Header do Pagamento */}
              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base tracking-tight text-white">
                    Finalizar Pagamento
                  </h3>
                  <p className="text-xs text-slate-300">
                    Total da Venda:{' '}
                    <strong className="text-orange-400 text-sm font-black">
                      {formatMT(total)}
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo do Pagamento */}
              <div className="p-6 space-y-4">
                {/* Seleção do Método */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'CASH', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-600' },
                      { id: 'MPESA', label: 'M-Pesa', icon: Smartphone, color: 'text-red-600' },
                      { id: 'EMOLA', label: 'E-Mola', icon: Smartphone, color: 'text-orange-600' },
                      { id: 'POS_CARD', label: 'Cartão POS', icon: CreditCard, color: 'text-blue-600' },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(m.id as PaymentMethod);
                            if (m.id !== 'CASH') {
                              setReceivedAmount(total.toString());
                            }
                          }}
                          className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                            active
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? 'text-white' : m.color}`} />
                          <span className="text-xs font-bold">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status do Pagamento */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Estado da Cobrança:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('PAID')}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        paymentStatus === 'PAID'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      ✓ Pago Imediato
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('PENDING')}
                      className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        paymentStatus === 'PENDING'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      ⏳ Pendente
                    </button>
                  </div>
                </div>

                {/* Cálculo Automático de Troco (quando Dinheiro) */}
                {paymentMethod === 'CASH' && (
                  <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-orange-950">
                        Valor Recebido do Cliente (MT)
                      </label>
                      <button
                        type="button"
                        onClick={() => setReceivedAmount(total.toString())}
                        className="text-[10px] font-bold text-orange-700 underline cursor-pointer"
                      >
                        Valor Exato
                      </button>
                    </div>

                    <input
                      ref={receivedInputRef}
                      type="number"
                      min={0}
                      step="10"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder="Ex: 1000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-orange-300 text-lg font-black bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />

                    {/* Botões Rápidos de Cédulas */}
                    <div className="flex flex-wrap gap-1.5">
                      {[total, 100, 200, 500, 1000, 2000]
                        .filter((v, idx, arr) => arr.indexOf(v) === idx && v >= total)
                        .slice(0, 5)
                        .map((cashVal) => (
                          <button
                            key={cashVal}
                            type="button"
                            onClick={() => setReceivedAmount(cashVal.toString())}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              numReceived === cashVal
                                ? 'bg-slate-900 text-white'
                                : 'bg-white border border-orange-200 text-orange-950 hover:bg-orange-100'
                            }`}
                          >
                            {cashVal} MT
                          </button>
                        ))}
                    </div>

                    {/* Resultado do Troco */}
                    <div className="pt-2 border-t border-orange-200/80 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Troco a Devolver:</span>
                      <span
                        className={`text-base font-black ${
                          isInsufficientCash
                            ? 'text-red-600'
                            : changeAmount > 0
                            ? 'text-emerald-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {isInsufficientCash ? 'Valor insuficiente' : formatMT(changeAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Voltar à Comanda
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalizeOrder}
                    disabled={paymentMethod === 'CASH' && isInsufficientCash}
                    className="flex-1 py-3 rounded-xl bg-[#F27D26] hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluir Venda</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Gestão de Caixa e Turnos (Agente 5) */}
      <CashShiftModal
        isOpen={isCashShiftModalOpen}
        onClose={() => setIsCashShiftModalOpen(false)}
      />

      {/* Modal de Recibo Imprimível */}
      {printedOrder && (
        <OrderReceiptModal
          order={printedOrder}
          onClose={() => setPrintedOrder(null)}
        />
      )}
    </div>
  );
};
