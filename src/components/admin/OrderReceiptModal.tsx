import React from 'react';
import { Order } from '../../types';
import { formatMT, formatDateTime, getOrderTypeLabel, getPaymentMethodLabel } from '../../utils/formatters';
import { useRestaurant } from '../../context/RestaurantContext';
import { BaliLogo } from '../common/BaliLogo';
import { Printer, X } from 'lucide-react';

interface OrderReceiptModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose }) => {
  const { config } = useRestaurant();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Controls */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-orange-600" />
            <span>Recibo de Pedido</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Content Body (Thermal Ticket Style) */}
        <div id="printable-receipt" className="p-6 font-mono text-xs text-slate-800 space-y-4">
          {/* Brand Header with Official Bali Logo */}
          <div className="text-center space-y-2 pb-3 border-b border-dashed border-slate-300 flex flex-col items-center">
            <BaliLogo variant="full" size="md" className="mx-auto" />
            <div>
              <p className="text-[11px] text-slate-600 font-sans font-medium">{config.location}</p>
              <p className="text-[10px] text-slate-500 font-sans">Tel: {config.phones.join(' / ')}</p>
              <p className="text-[10px] font-bold text-slate-800 font-sans pt-1">
                *** COMPROVATIVO DE CONSUMO ***
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-slate-900">
              <span>PEDIDO Nº:</span>
              <span>{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>DATA:</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CLIENTE:</span>
              <span className="font-bold">{order.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>TIPO:</span>
              <span>{getOrderTypeLabel(order.orderType)}</span>
            </div>
            {order.customerAddress && (
              <div className="text-[10px] text-slate-500 pt-0.5">
                Local: {order.customerAddress}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500">
              <span>Item / Qtd</span>
              <span>Total MT</span>
            </div>
            {order.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="font-bold">{formatMT(item.price * item.quantity)}</span>
                </div>
                {item.notes && (
                  <p className="text-[10px] text-slate-500 italic pl-2">Obs: {item.notes}</p>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatMT(order.subtotal)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Taxa de Entrega:</span>
                <span>{formatMT(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-1">
              <span>TOTAL:</span>
              <span>{formatMT(order.total)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 pt-1">
              <span>Pagamento:</span>
              <span className="font-bold">{getPaymentMethodLabel(order.paymentMethod)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>Estado Pgto:</span>
              <span className={`font-bold ${order.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {order.paymentStatus === 'PAID' ? 'PAGO' : 'PENDENTE'}
              </span>
            </div>
          </div>

          {/* Footer Receipt Notice */}
          <div className="text-center text-[10px] text-slate-500 font-sans space-y-1">
            <p>Obrigado pela sua preferência!</p>
            <p className="text-[9px]">Conserve este comprovativo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
