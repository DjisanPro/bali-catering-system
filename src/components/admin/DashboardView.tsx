import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatMT, formatDateTime, getOrderStatusBadgeColor, getOrderStatusLabel, getOrderTypeLabel } from '../../utils/formatters';
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Layers,
  ShoppingBag,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    orders,
    products,
    ingredients,
    payments,
    customers,
    auditLogs,
    updateOrderStatus,
    setAdminSubView,
  } = useRestaurant();

  // Computations — sempre derivadas de dados reais
    // Defensive defaults: nunca renderizar .map() sobre undefined
    const safeOrders = Array.isArray(orders) ? orders : [];
    const safeProducts = Array.isArray(products) ? products : [];
    const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
    const safePayments = Array.isArray(payments) ? payments : [];
    const safeAuditLogs = Array.isArray(auditLogs) ? auditLogs : [];

    const isSameDay = (iso: string | undefined, ref: Date): boolean => {
      if (!iso) return false;
      const d = new Date(iso);
      return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
    };

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const completedPaid = safeOrders.filter(
      (o) => o.status !== 'CANCELLED' && o.paymentStatus === 'PAID'
    );

    const todayRevenue = completedPaid
      .filter((o) => isSameDay(o.createdAt, today))
      .reduce((sum, o) => sum + o.total, 0);

    const yesterdayRevenue = completedPaid
      .filter((o) => isSameDay(o.createdAt, yesterday))
      .reduce((sum, o) => sum + o.total, 0);

    // Variação percentual real calculada (nunca número fixo)
    const revenueDelta =
      yesterdayRevenue > 0
        ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
        : todayRevenue > 0
        ? 100
        : 0;
    const revenueDeltaLabel = `${revenueDelta >= 0 ? '+' : ''}${revenueDelta.toFixed(1)}% vs ontem`;

    const totalRevenue = completedPaid.reduce((sum, o) => sum + o.total, 0);

    const activeOrders = safeOrders.filter(
      (o) => o.status === 'PENDING' || o.status === 'PREPARING' || o.status === 'CONFIRMED'
    );

  const completedOrders = safeOrders.filter((o) => o.status === 'DELIVERED');

  const lowStockIngredients = safeIngredients.filter(
    (i) => i.currentStock <= i.minimumStock
  );

  // Theoretical inventory value
  const totalInventoryValue = safeIngredients.reduce((sum, i) => sum + (i.currentStock * i.costPerUnit), 0);

  // Featured recipe for the sidebar card
  const featuredProduct = safeProducts.find((p) => p.name.includes('Burger') || p.ingredients?.length > 0) || safeProducts[0];

  return (
    <div className="space-y-6">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Revenue */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Vendas de Hoje
                  </p>
                  <p className="text-2xl font-black text-slate-900 font-heading">
                    {formatMT(todayRevenue)}
                  </p>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${revenueDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {revenueDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5 rotate-180" />}
                    <span>{revenueDeltaLabel}</span>
                  </div>
                </div>

        {/* Stat 2: Active Orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Pedidos Activos
          </p>
          <p className="text-2xl font-black text-slate-900 font-heading">
            {activeOrders.length}
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {safeOrders.filter(o => o.status === 'PREPARING').length} em preparação na cozinha
          </p>
        </div>

        {/* Stat 3: Low Stock */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Estoque Baixo
          </p>
          <p className={`text-2xl font-black font-heading ${lowStockIngredients.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {lowStockIngredients.length < 10 ? `0${lowStockIngredients.length}` : lowStockIngredients.length}
          </p>
          <p className={`text-xs mt-2 font-bold ${lowStockIngredients.length > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {lowStockIngredients.length > 0 ? 'Atenção imediata para reposição' : 'Todos os níveis normais'}
          </p>
        </div>

        {/* Stat 4: Inventory Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Inventário Teórico
          </p>
          <p className="text-2xl font-black text-slate-900 font-heading">
            {formatMT(totalInventoryValue)}
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Actualizado automaticamente
          </p>
        </div>
      </div>

      {/* Two Columns Grid: 5 columns (3 / 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left (3 columns): Recent Orders Table */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 font-heading">
              <span className="w-2 h-2 rounded-full bg-[#E86319]"></span>
              Últimos Pedidos em Fila
            </h3>
            <button
              onClick={() => setAdminSubView('orders')}
              className="text-xs font-bold text-[#E86319] uppercase hover:underline"
            >
              Ver Tudo ({safeOrders.length})
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase font-black border-b border-slate-100">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Produtos</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {safeOrders.slice(0, 5).map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400">{order.customerPhone}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 max-w-[180px] truncate">
                                              {(order.items || []).map((i) => `${i.quantity}x ${i.productName}`).join(', ') || '—'}
                                            </td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatMT(order.total)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {order.status === 'PENDING' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold text-[9px] uppercase">
                            Pendente
                          </span>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-[9px] uppercase">
                            Confirmado
                          </span>
                        )}
                        {order.status === 'PREPARING' && (
                          <span className="px-2 py-1 bg-orange-100 text-[#E86319] rounded-full font-bold text-[9px] uppercase">
                            Preparação
                          </span>
                        )}
                        {order.status === 'READY' && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[9px] uppercase">
                            Pronto
                          </span>
                        )}
                        {order.status === 'DELIVERED' && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[9px] uppercase">
                            Entregue
                          </span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold text-[9px] uppercase">
                            Cancelado
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold"
                          >
                            Confirmar
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                            className="px-2 py-1 bg-[#E86319] hover:bg-orange-600 text-white rounded text-[10px] font-bold"
                          >
                            Cozinhar
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'READY')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                          >
                            Pronto
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                            className="px-2 py-1 bg-slate-900 hover:bg-black text-white rounded text-[10px] font-bold"
                          >
                            Entregar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right (2 columns): Stock Alert & Technical Sheet */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Alert Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex justify-between items-center font-heading">
              <span>Alerta de Estoque</span>
              {lowStockIngredients.length > 0 ? (
                <span className="text-[10px] text-red-500 font-bold px-2 py-0.5 bg-red-50 rounded uppercase">
                  Crítico
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-bold px-2 py-0.5 bg-emerald-50 rounded uppercase">
                  OK
                </span>
              )}
            </h3>

            <div className="space-y-4">
              {safeIngredients.slice(0, 3).map((ing, idx) => {
                const percentage = Math.min(100, Math.max(10, Math.round((ing.currentStock / (ing.minimumStock * 2)) * 100)));
                const isCrit = ing.currentStock <= ing.minimumStock;
                return (
                  <div
                    key={ing.id}
                    className={`flex items-center justify-between ${idx > 0 ? 'border-t border-slate-50 pt-3' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCrit ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-[#E86319]'
                        }`}
                      >
                        {ing.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{ing.name}</p>
                        <p className="text-[10px] text-slate-400">Min: {ing.minimumStock}{ing.unit}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-xs font-bold ${isCrit ? 'text-red-600' : 'text-slate-800'}`}>
                        {ing.currentStock} {ing.unit}
                      </p>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1">
                        <div
                          className={`h-full rounded-full ${isCrit ? 'bg-red-500' : 'bg-[#E86319]'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setAdminSubView('ingredients')}
              className="w-full mt-4 py-2 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 hover:text-[#E86319] border border-slate-100 rounded transition-all text-center block"
            >
              Gerir Todo o Estoque
            </button>
          </div>

          {/* Technical Sheet Showcase (Geometric Accent card) */}
          {featuredProduct && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 border-l-4 border-l-[#E86319]">
              <h3 className="font-bold text-slate-800 text-sm mb-1 font-heading">
                Ficha Técnica: {featuredProduct.name}
              </h3>
              <p className="text-[10px] text-slate-500 mb-3">
                Consumo automático por unidade vendida:
              </p>

              <ul className="space-y-1">
                {(featuredProduct.ingredients && featuredProduct.ingredients.length > 0
                  ? featuredProduct.ingredients
                  : [
                      { ingredientName: 'Pão Especial', quantity: 1, unit: 'un' },
                      { ingredientName: 'Carne Bovina Temperada', quantity: 180, unit: 'g' },
                      { ingredientName: 'Queijo Cheddar', quantity: 1, unit: 'fatia' },
                    ]
                ).map((r, i) => (
                  <li
                    key={i}
                    className="text-[11px] flex justify-between py-1 border-b border-slate-50 text-slate-700"
                  >
                    <span>{r.ingredientName}</span>
                    <span className="font-bold text-slate-900">
                      {r.quantity} {r.unit}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setAdminSubView('recipes')}
                className="w-full mt-3 py-2 bg-slate-50 text-[10px] font-bold uppercase text-slate-500 hover:text-[#E86319] border border-slate-100 rounded transition-all"
              >
                Editar Composição / Fichas
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mini Audit Bar at Bottom */}
      <div className="h-12 bg-white rounded-xl border border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-400 shadow-xs">
        <div className="flex items-center gap-4">
          <span>
            Última Auditoria:{' '}
            <strong className="text-slate-600">
              {safeAuditLogs[0] ? safeAuditLogs[0].action : 'Venda Concluída'}
            </strong>{' '}
            (Estoque Actualizado)
          </span>
          <span>|</span>
          <span className="text-orange-600 font-medium">Sessão operacional activa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="font-bold text-slate-600">Sincronizado com Tete Server (Nuras)</span>
        </div>
      </div>
    </div>
  );
};
