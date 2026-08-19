import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderStatus, OrderType, PaymentStatus, PaymentMethod } from '../../types';
import {
  formatMT,
  formatDateTime,
  getOrderStatusLabel,
  getOrderStatusBadgeColor,
  getOrderTypeLabel,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from '../../utils/formatters';
import {
  Search,
  Filter,
  ShoppingBag,
  Clock,
  Printer,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  CreditCard,
  Layers,
  List,
} from 'lucide-react';
import { OrderReceiptModal } from './OrderReceiptModal';

export const OrdersView: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    setAdminSubView,
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (typeFilter !== 'all' && order.orderType !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = order.orderNumber.toLowerCase().includes(q);
        const matchName = order.customerName.toLowerCase().includes(q);
        const matchPhone = order.customerPhone.toLowerCase().includes(q);
        return matchNum || matchName || matchPhone;
      }
      return true;
    });
  }, [orders, statusFilter, typeFilter, searchQuery]);

  const kanbanColumns: { id: OrderStatus; label: string; bg: string; border: string }[] = [
    { id: 'PENDING', label: 'Pendentes / Novos', bg: 'bg-amber-50/70', border: 'border-amber-200' },
    { id: 'CONFIRMED', label: 'Confirmados', bg: 'bg-blue-50/70', border: 'border-blue-200' },
    { id: 'PREPARING', label: 'Na Cozinha / Preparo', bg: 'bg-orange-50/70', border: 'border-orange-200' },
    { id: 'READY', label: 'Prontos para Saída', bg: 'bg-emerald-50/70', border: 'border-emerald-200' },
    { id: 'DELIVERED', label: 'Entregues / Concluídos', bg: 'bg-slate-50/70', border: 'border-slate-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Nº do pedido, cliente, telefone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50"
          />
        </div>

        {/* Filters and View Switcher */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto justify-between md:justify-end pb-1 md:pb-0">
          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Estados</option>
            <option value="PENDING">Pendentes</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="PREPARING">Em Preparação</option>
            <option value="READY">Prontos</option>
            <option value="DELIVERED">Entregues</option>
            <option value="CANCELLED">Cancelados</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todas as Modalidades</option>
            <option value="DINE_IN">Consumo no Local</option>
            <option value="TAKEAWAY">Take-away</option>
            <option value="DELIVERY">Entrega Domiciliar</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
              title="Visualização em Colunas Kanban"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Kanban or List */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id);
            return (
              <div
                key={col.id}
                className={`rounded-2xl border ${col.border} ${col.bg} p-3 min-h-[500px] flex flex-col`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {col.label}
                  </h4>
                  <span className="bg-white text-slate-900 font-extrabold text-[11px] px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                    {colOrders.length}
                  </span>
                </div>

                {/* Orders in Column */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic">
                      Nenhum pedido
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-2.5 hover:shadow-xs transition-all"
                      >
                        {/* Header: Order Number & Type */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {getOrderTypeLabel(order.orderType)}
                          </span>
                        </div>

                        {/* Customer */}
                        <div>
                          <div className="text-xs font-bold text-slate-800">{order.customerName}</div>
                          <div className="text-[10px] text-slate-500">{order.customerPhone}</div>
                        </div>

                        {/* Items list */}
                        <div className="bg-slate-50 p-2 rounded-lg text-[11px] space-y-1 text-slate-700">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate max-w-[130px]">
                                {item.quantity}x {item.productName}
                              </span>
                              <span className="font-semibold text-slate-900">
                                {formatMT(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Total & Payment */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Total</span>
                            <span className="font-black text-slate-900">{formatMT(order.total)}</span>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                order.paymentStatus === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.paymentStatus === 'PAID' ? 'PAGO' : 'PENDENTE'}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {order.paymentMethod}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 space-y-1.5">
                          {/* Next Status Advance */}
                          {order.status === 'PENDING' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                            >
                              <span>Confirmar & Baixar Estoque</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                              className="w-full py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                            >
                              <span>Iniciar Preparação</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {order.status === 'PREPARING' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'READY')}
                              className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                            >
                              <span>Marcar como Pronto</span>
                              <CheckCircle className="w-3 h-3" />
                            </button>
                          )}
                          {order.status === 'READY' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                              className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors flex items-center justify-center gap-1"
                            >
                              <span>Concluir Entrega</span>
                              <CheckCircle className="w-3 h-3" />
                            </button>
                          )}

                          {/* Fast Action Buttons Bar */}
                          <div className="flex items-center gap-1 justify-between pt-1">
                            <button
                              onClick={() => setSelectedReceiptOrder(order)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              title="Ver / Imprimir Recibo"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <a
                              href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(order.customerName)}!%20Aqui%20%C3%A9%20do%20Bali%20Catering%20Service.%20O%20seu%20pedido%20${order.orderNumber}%20est%C3%A1%20${encodeURIComponent(getOrderStatusLabel(order.status))}.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                              title="Mensagem no WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {order.paymentStatus !== 'PAID' && (
                              <button
                                onClick={() =>
                                  updatePaymentStatus(order.id, 'PAID', order.paymentMethod)
                                }
                                className="text-[10px] font-bold text-emerald-700 hover:underline"
                              >
                                Marcar Pago
                              </button>
                            )}

                            {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                              <button
                                onClick={() => {
                                  if (confirm(`Tem certeza que deseja cancelar o pedido ${order.orderNumber}?`)) {
                                    cancelOrder(order.id, 'Cancelado pelo operador no painel');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                title="Cancelar Pedido"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List / Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Nº Pedido</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5">Itens</th>
                  <th className="p-3.5">Total</th>
                  <th className="p-3.5">Pagamento</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const badge = getOrderStatusBadgeColor(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {formatDateTime(order.createdAt)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{order.customerName}</span>
                        <span className="block text-[11px] text-slate-500">{order.customerPhone}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">
                        {getOrderTypeLabel(order.orderType)}
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">
                        {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </td>
                      <td className="p-3.5 font-black text-slate-900">
                        {formatMT(order.total)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.paymentStatus === 'PAID' ? 'PAGO' : 'PENDENTE'}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {order.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                          title="Recibo"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptOrder && (
        <OrderReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
};
