import React from 'react';
import { useRestaurant, AdminSubView } from '../../context/RestaurantContext';
import { BaliLogo } from '../common/BaliLogo';
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Package,
  Layers,
  TrendingDown,
  CreditCard,
  Users,
  History,
  Settings,
  PlusCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const {
    adminSubView,
    setAdminSubView,
    setActiveView,
    lockAdminSession,
    orders,
    ingredients,
  } = useRestaurant();

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PREPARING'
  ).length;

  const lowStockCount = ingredients.filter(
    (i) => i.currentStock <= i.minimumStock
  ).length;

  const navItems: {
    id: AdminSubView;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'pos',
      label: 'Novo Pedido (PDV)',
      icon: <PlusCircle className="w-4 h-4 text-[#F27D26]" />,
    },
    {
      id: 'orders',
      label: 'Gestão de Pedidos',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-orange-100 text-[#F27D26]',
    },
    {
      id: 'products',
      label: 'Produtos & Menu',
      icon: <UtensilsCrossed className="w-4 h-4" />,
    },
    {
      id: 'recipes',
      label: 'Fichas Técnicas',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'ingredients',
      label: 'Ingredientes',
      icon: <Package className="w-4 h-4" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-red-50 text-red-600',
    },
    {
      id: 'stock',
      label: 'Estoque & Movimentos',
      icon: <TrendingDown className="w-4 h-4" />,
    },
    {
      id: 'payments',
      label: 'Pagamentos & Caixa',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'customers',
      label: 'Clientes (CRM)',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'logs',
      label: 'Auditoria & Logs',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
      {/* Official Brand Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <BaliLogo variant="horizontal" size="sm" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Operação
        </div>

        {navItems.slice(0, 3).map((item) => {
          const isActive = adminSubView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setAdminSubView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-orange-50 text-[#F27D26] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Catálogo & Estoque
        </div>

        {navItems.slice(3, 7).map((item) => {
          const isActive = adminSubView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setAdminSubView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-orange-50 text-[#F27D26] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Financeiro & Sistema
        </div>

        {navItems.slice(7).map((item) => {
          const isActive = adminSubView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setAdminSubView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-orange-50 text-[#F27D26] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Website Link */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-[#F27D26] border border-orange-200 flex items-center justify-center font-bold text-xs">
            AB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">Admin Bali</p>
            <p className="text-[10px] text-slate-400 truncate">Gestor Sénior</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveView('public')}
            className="py-2 px-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
            title="Ver Website Público"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#F27D26]" />
            <span>Site</span>
          </button>

          <button
            onClick={lockAdminSession}
            className="py-2 px-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
            title="Encerrar e Bloquear Sessão de Gestão"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
