import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatMT, buildWhatsAppOrderUrl } from '../../utils/formatters';
import { OrderType, PaymentMethod } from '../../types';
import confetti from 'canvas-confetti';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Send,
  CheckCircle,
  Receipt,
  ArrowRight,
} from 'lucide-react';

interface PublicCartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const PublicCartDrawer: React.FC<PublicCartDrawerProps> = ({ isOpen, onClose }) => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    config,
    createOrder,
    showToast,
  } = useRestaurant();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MPESA');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);

  const activeOpen = isOpen !== undefined ? isOpen : isCartOpen;

  if (!activeOpen) return null;

  const deliveryFee = orderType === 'DELIVERY' ? config.defaultDeliveryFee : 0;
  const orderTotal = cartSubtotal + deliveryFee;

  const handleCheckout = async (isWhatsApp = true) => {
      if (cart.length === 0) {
        showToast('Sacola vazia', 'Adicione pelo menos um prato para continuar.', 'warning');
        return;
      }

    if (!customerName.trim()) {
      showToast('Nome obrigatório', 'Por favor, informe o seu nome.', 'warning');
      return;
    }

    if (!customerPhone.trim()) {
      showToast('Telefone obrigatório', 'Por favor, informe o seu contacto telefónico.', 'warning');
      return;
    }

    if (orderType === 'DELIVERY' && !customerAddress.trim()) {
      showToast('Endereço obrigatório', 'Por favor, informe o endereço de entrega em Tete.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        unitCost: item.product.costPrice || 0,
        notes: item.notes,
      }));

      // Create order in persistent state (await! createOrder é async)
            const created = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress:
          orderType === 'DELIVERY'
            ? customerAddress.trim()
            : orderType === 'DINE_IN'
            ? `Mesa: ${tableNumber}`
            : 'Levantamento no Balcão Nuras',
        orderType,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        status: 'PENDING',
        items: orderItems,
        subtotal: cartSubtotal,
        deliveryFee,
        discount: 0,
        total: orderTotal,
        paymentStatus: 'PENDING',
        paymentMethod,
        notes: orderNotes,
      });

      if (!created) {
        return;
      }

      // Confetti effect
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
      });

      setCompletedOrderNumber(created.orderNumber);

      if (isWhatsApp) {
        const whatsappUrl = buildWhatsAppOrderUrl(
          config.whatsappPrimary,
          customerName,
          orderType === 'DELIVERY'
            ? customerAddress
            : orderType === 'DINE_IN'
            ? `Mesa ${tableNumber}`
            : 'Balcão Nuras',
          orderType,
          orderItems,
          deliveryFee,
          orderTotal,
          orderNotes
        );
        window.open(whatsappUrl, '_blank');
      }

      clearCart();
    } catch (err) {
      console.error(err);
      showToast(
        'Erro ao processar pedido',
        'Tente novamente ou envie mensagem direta no WhatsApp.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsCartOpen(false);
    }
    setCompletedOrderNumber(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-[#FAF8F5] h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#EAE5DC] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E86319] text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-zinc-950 text-base">A Sua Sacola</h3>
              <p className="text-[11px] text-zinc-500 font-sans">Bali Catering Service • Tete</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Completed Order Success View */}
        {completedOrderNumber ? (
          <div className="p-8 text-center flex-1 flex flex-col justify-center items-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#E86319] bg-orange-50 px-3 py-1 rounded-full">
                Pedido Registado
              </span>
              <h3 className="text-2xl font-serif font-black text-zinc-950 pt-1">
                Obrigado pela preferência!
              </h3>
              <p className="text-xs text-zinc-600 max-w-xs mx-auto font-sans leading-relaxed">
                O seu pedido foi recebido sob o número{' '}
                <strong className="text-zinc-950 font-bold">{completedOrderNumber}</strong>.
              </p>
            </div>

            <div className="bg-white border border-[#EAE5DC] rounded-2xl p-4 w-full text-left text-xs space-y-2 text-zinc-600 font-sans shadow-2xs">
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className="font-bold text-amber-600">Em preparação na cozinha</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-semibold text-zinc-900">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Total a Pagar:</span>
                <span className="font-black text-zinc-950">{formatMT(orderTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-full bg-[#E86319] hover:bg-[#D45512] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              Voltar ao Cardápio
            </button>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart State */
          <div className="p-8 text-center flex-1 flex flex-col justify-center items-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#F4EFE6] text-[#E86319] flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-serif font-bold text-zinc-900">A sua sacola está vazia</h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto font-sans">
                Selecione os seus pratos favoritos no cardápio para pedir delivery ou takeaway.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-3 rounded-full bg-[#E86319] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D45512] transition-all cursor-pointer"
            >
              Explorar Cardápio
            </button>
          </div>
        ) : (
          /* Active Cart Items & Checkout Form */
          <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
            {/* Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold uppercase tracking-widest">
                <span>Pratos Selecionados ({cart.length})</span>
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Limpar
                </button>
              </div>

              <div className="space-y-2.5">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3.5 bg-white rounded-2xl border border-[#EAE5DC] flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-serif font-bold text-zinc-950 truncate">
                        {item.product.name}
                      </h4>
                      <div className="text-[11px] text-zinc-500 font-sans mt-0.5">
                        {formatMT(item.product.price)} • Total:{' '}
                        <strong className="text-zinc-950 font-bold">
                          {formatMT(item.product.price * item.quantity)}
                        </strong>
                      </div>
                    </div>

                    {/* Quantity Controls — com microinteração press */}
                                        <div className="flex items-center gap-2 shrink-0">
                                          <div className="flex items-center bg-[#FAF8F5] border border-[#EAE5DC] rounded-full overflow-hidden shadow-2xs">
                                            <button
                                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                              className="px-2.5 py-1.5 hover:bg-[#E86319] hover:text-white text-zinc-700 transition-colors cursor-pointer active:scale-90"
                                              aria-label="Diminuir quantidade"
                                            >
                                              <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="px-2.5 text-xs font-bold text-zinc-900 min-w-[20px] text-center font-sans tabular-nums">
                                              {item.quantity}
                                            </span>
                                            <button
                                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                              className="px-2.5 py-1.5 hover:bg-[#E86319] hover:text-white text-zinc-700 transition-colors cursor-pointer active:scale-90"
                                              aria-label="Aumentar quantidade"
                                            >
                                              <Plus className="w-3 h-3" />
                                            </button>
                                          </div>

                                          <button
                                            onClick={() => removeFromCart(item.product.id)}
                                            className="p-1.5 text-zinc-400 hover:text-red-600 rounded-full hover:bg-red-50 cursor-pointer active:scale-90 transition-all"
                                            aria-label="Remover item"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Type Selector */}
            <div className="space-y-2 pt-2 border-t border-[#EAE5DC]">
              <label className="block text-xs font-bold text-zinc-800 font-sans">Modalidade de Pedido</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('DELIVERY')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                    orderType === 'DELIVERY'
                      ? 'bg-[#E86319] text-white border-[#E86319] font-bold shadow-xs'
                      : 'bg-white text-zinc-600 border-[#EAE5DC] hover:bg-zinc-50'
                  }`}
                >
                  Entrega
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-[#E86319] text-white border-[#E86319] font-bold shadow-xs'
                      : 'bg-white text-zinc-600 border-[#EAE5DC] hover:bg-zinc-50'
                  }`}
                >
                  Takeaway
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('DINE_IN')}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${
                    orderType === 'DINE_IN'
                      ? 'bg-[#E86319] text-white border-[#E86319] font-bold shadow-xs'
                      : 'bg-white text-zinc-600 border-[#EAE5DC] hover:bg-zinc-50'
                  }`}
                >
                  No Local
                </button>
              </div>
            </div>

            {/* Customer Details Form */}
            <div className="space-y-3 pt-2 border-t border-[#EAE5DC] text-xs font-sans">
              <div>
                <label className="block text-[11px] text-zinc-600 font-bold mb-1">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Carlos Alberto"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-white text-zinc-900 focus:ring-2 focus:ring-[#E86319] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 font-bold mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ex: +258 84 123 4567"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-white text-zinc-900 focus:ring-2 focus:ring-[#E86319] focus:outline-none"
                />
              </div>

              {orderType === 'DELIVERY' && (
                <div>
                  <label className="block text-[11px] text-zinc-600 font-bold mb-1">
                    Endereço de Entrega em Tete *
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Bairro, Rua, Ponto de Referência..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-white text-zinc-900 focus:ring-2 focus:ring-[#E86319] focus:outline-none"
                  />
                </div>
              )}

              {orderType === 'DINE_IN' && (
                <div>
                  <label className="block text-[11px] text-zinc-600 font-bold mb-1">
                    Mesa / Esplanada
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: Mesa 04"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-white text-zinc-900 focus:ring-2 focus:ring-[#E86319] focus:outline-none"
                  />
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-[11px] text-zinc-600 font-bold mb-1">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'MPESA', label: 'M-Pesa' },
                    { id: 'EMOLA', label: 'E-Mola' },
                    { id: 'CASH', label: 'Dinheiro' },
                    { id: 'POS_CARD', label: 'Cartão POS' },
                  ].map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`p-2 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer ${
                        paymentMethod === method.id
                          ? 'border-[#E86319] bg-orange-50 text-[#E86319]'
                          : 'border-[#EAE5DC] text-zinc-600 bg-white hover:bg-zinc-50'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] text-zinc-600 font-bold mb-1">
                  Instruções Especiais (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ex: Sem piripiri, refrigerante bem gelado..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5DC] bg-white text-zinc-900 focus:ring-2 focus:ring-[#E86319] focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Drawer Footer & Checkout Action */}
        {!completedOrderNumber && cart.length > 0 && (
          <div className="p-5 border-t border-[#EAE5DC] bg-white space-y-3">
            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs text-zinc-600 font-sans">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-900">{formatMT(cartSubtotal)}</span>
              </div>
              {orderType === 'DELIVERY' && (
                <div className="flex justify-between">
                  <span>Taxa de Entrega:</span>
                  <span className="font-semibold text-zinc-900">{formatMT(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-zinc-950 pt-2 border-t border-[#EAE5DC]">
                <span className="font-serif">Total:</span>
                <span className="font-black text-xl text-zinc-950 font-sans">{formatMT(orderTotal)}</span>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCheckout(true)}
                className="w-full py-3.5 px-4 rounded-full bg-[#E86319] hover:bg-[#D45512] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-orange-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Confirmar & Enviar no WhatsApp</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCheckout(false)}
                className="w-full py-2.5 px-4 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-zinc-500" />
                <span>Apenas Gravar Pedido</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
