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
  UserCheck,
  ShieldCheck,
  Store,
  LogOut,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const {
    adminSubView,
    setAdminSubView,
    setActiveView,
    logoutUser,
    currentUser,
    orders,
    ingredients,
    showToast,
  } = useRestaurant();

  const isSeller = currentUser?.role === 'SELLER';

  const pendingOrdersCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PREPARING'
  ).length;

  const lowStockCount = ingredients.filter(
    (i) => i.currentStock <= i.minimumStock
  ).length;

  const handleNavClick = (subViewId: AdminSubView, isRestrictedForSeller: boolean) => {
    if (isSeller && isRestrictedForSeller) {
      showToast(
        'Acesso Restrito ao Administrador',
        'Este módulo exige privilégios de Administrador Principal (Boss). Todas as operações de escrita são protegidas a nível do motor (Engine).',
        'warning'
      );
      return;
    }
    setAdminSubView(subViewId);
  };

  const navItems: {
    id: AdminSubView;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
    restrictedForSeller?: boolean;
    group: 'operation' | 'catalog' | 'system';
  }[] = [
    // Operação
    {
      id: 'pos',
      label: 'Novo Pedido (PDV)',
      icon: <PlusCircle className="w-4 h-4 text-[#F27D26]" />,
      group: 'operation',
    },
    {
      id: 'orders',
      label: 'Gestão de Pedidos',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-orange-100 text-[#F27D26]',
      group: 'operation',
    },
    {
      id: 'dashboard',
      label: 'Dashboard Geral',
      icon: <LayoutDashboard className="w-4 h-4" />,
      restrictedForSeller: true,
      group: 'operation',
    },

    // Catálogo & Estoque
    {
      id: 'products',
      label: 'Produtos & Menu',
      icon: <UtensilsCrossed className="w-4 h-4" />,
      restrictedForSeller: true,
      group: 'catalog',
    },
    {
      id: 'recipes',
      label: 'Fichas Técnicas',
      icon: <Layers className="w-4 h-4" />,
      restrictedForSeller: true,
      group: 'catalog',
    },
    {
      id: 'ingredients',
      label: 'Ingredientes',
      icon: <Package className="w-4 h-4" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-red-50 text-red-600',
      restrictedForSeller: true,
      group: 'catalog',
    },
    {
      id: 'stock',
      label: 'Estoque & Movimentos',
      icon: <TrendingDown className="w-4 h-4" />,
      restrictedForSeller: true,
      group: 'catalog',
    },

    // Financeiro & Sistema
    {
      id: 'payments',
      label: 'Pagamentos & Caixa',
      icon: <CreditCard className="w-4 h-4" />,
      restrictedForSeller: true,
      group: 'system',
    },
    {
      id: 'customers',
      label: 'Clientes (CRM)',
      icon: <Users className="w-4 h-4" />,
      restrictedForSeller: true,
      group: 'system',
    },
    {
      id: 'users',
      label: 'Utilizadores & Vendedores',
      icon: <UserCheck className="w-4 h-4" />,
      restrictedForSeller: true,
      group: 'system',
    },
    {
      id: 'logs',
      label: 'Auditoria & Logs',
      icon: <History className="w-4 h-4" />,
      restrictedForSeller: true,
      group: 'system',
    },
    {
      id: 'cms',
      label: 'Website CMS & Conteúdo',
      icon: <Globe className="w-4 h-4 text-emerald-600" />,
      restrictedForSeller: true,
      group: 'system',
    },
    {
      id: 'media',
      label: 'Biblioteca de Mídia',
      icon: <ImageIcon className="w-4 h-4 text-sky-600" />,
      restrictedForSeller: true,
      group: 'system',
    },
    {
      id: 'settings',
      label: 'Configurações & Backups',
      icon: <Settings className="w-4 h-4" />,
      restrictedForSeller: true,
      group: 'system',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 select-none">
      {/* Official Brand Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <BaliLogo variant="horizontal" size="sm" />
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {/* Group: Operação */}
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Atendimento & Balcão
        </div>
        {navItems
          .filter((item) => item.group === 'operation')
          .map((item) => {
            const isActive = adminSubView === item.id;
            const isRestricted = Boolean(isSeller && item.restrictedForSeller);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, Boolean(item.restrictedForSeller))}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-50 text-[#F27D26] shadow-2xs font-bold'
                    : isRestricted
                    ? 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 opacity-60'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isRestricted && <Lock className="w-3 h-3 text-slate-300" />}
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

        {/* Group: Catálogo & Estoque */}
        <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Cardápio & Estoque</span>
          {isSeller && <span className="text-[9px] text-slate-400 font-normal">Admin</span>}
        </div>
        {navItems
          .filter((item) => item.group === 'catalog')
          .map((item) => {
            const isActive = adminSubView === item.id;
            const isRestricted = Boolean(isSeller && item.restrictedForSeller);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, Boolean(item.restrictedForSeller))}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-50 text-[#F27D26] shadow-2xs font-bold'
                    : isRestricted
                    ? 'text-slate-400 hover:bg-slate-50 hover:text-slate-500 opacity-50'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isRestricted && <Lock className="w-3 h-3 text-slate-300" />}
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}

        {/* Group: Financeiro & Sistema */}
        <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Gestão & Segurança</span>
          {isSeller && <span className="text-[9px] text-slate-400 font-normal">Admin</span>}
        </div>
        {navItems
          .filter((item) => item.group === 'system')
          .map((item) => {
            const isActive = adminSubView === item.id;
            const isRestricted = Boolean(isSeller && item.restrictedForSeller);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, Boolean(item.restrictedForSeller))}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-50 text-[#F27D26] shadow-2xs font-bold'
                    : isRestricted
                    ? 'text-slate-400 hover:bg-slate-50 hover:text-slate-500 opacity-50'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isRestricted && <Lock className="w-3 h-3 text-slate-300" />}
                </div>
              </button>
            );
          })}
      </nav>

      {/* Footer User Session & Profile */}
      <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
        <div className="flex items-center gap-2.5 p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
              currentUser?.role === 'ADMIN'
                ? 'bg-slate-900 text-white'
                : 'bg-orange-100 text-[#F27D26] border border-orange-200'
            }`}
          >
            {currentUser?.role === 'ADMIN' ? (
              <ShieldCheck className="w-4 h-4 text-orange-400" />
            ) : (
              <Store className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {currentUser?.name || 'Administrador'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  currentUser?.role === 'ADMIN' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
              />
              <p className="text-[10px] font-semibold text-slate-500 truncate uppercase tracking-wider">
                {currentUser?.role === 'ADMIN' ? 'Admin Boss' : 'Vendedor (PDV)'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveView('public')}
            className="py-2 px-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
            title="Ver Website Público"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#F27D26]" />
            <span>Site</span>
          </button>

          <button
            onClick={logoutUser}
            className="py-2 px-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-red-200 cursor-pointer"
            title="Encerrar Sessão e Bloquear Acesso"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
