import React from 'react';
import { useRestaurant, AdminSubView } from '../../context/RestaurantContext';
import {
  AlertTriangle,
  PlusCircle,
  Store,
  ExternalLink,
  Cloud,
  CloudOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const {
    adminSubView,
    setAdminSubView,
    setActiveView,
    orders,
    ingredients,
    cloudSyncState,
    currentUser,
  } = useRestaurant();

  const getSubViewTitle = (sub: AdminSubView): { title: string; subtitle: string } => {
    switch (sub) {
      case 'dashboard':
        return {
          title: 'Visão Geral do Sistema',
          subtitle: 'Métricas diárias, faturamento, pedidos activos e alertas de estoque.',
        };
      case 'pos':
        return {
          title: 'Novo Pedido / Ponto de Venda (PDV)',
          subtitle: 'Lançamento rápido de pedidos de balcão, entregas ou mesas com baixa automática.',
        };
      case 'orders':
        return {
          title: 'Gestão de Pedidos & Fila',
          subtitle: 'Acompanhe o status desde a preparação até à entrega e recibos fiscais.',
        };
      case 'products':
        return {
          title: 'Produtos & Menu',
          subtitle: 'Cadastro de pratos, preços de venda, fotos e disponibilidade.',
        };
      case 'recipes':
        return {
          title: 'Fichas Técnicas & Composição',
          subtitle: 'Composição de ingredientes por prato, cálculo de CMV e margem bruta.',
        };
      case 'ingredients':
        return {
          title: 'Controle de Ingredientes & Insumos',
          subtitle: 'Lista de estoque físico, unidades de medida e alertas de reposição.',
        };
      case 'stock':
        return {
          title: 'Estoque & Movimentações',
          subtitle: 'Log completo de entradas de fornecedor, saídas por pedidos e baixas de avaria.',
        };
      case 'payments':
        return {
          title: 'Pagamentos & Caixa',
          subtitle: 'Recebimentos discriminados por M-Pesa, E-Mola, POS e Numerário.',
        };
      case 'customers':
        return {
          title: 'Clientes (CRM)',
          subtitle: 'Histórico de pedidos, contactos telefónicos e valor total acumulado.',
        };
      case 'users':
        return {
          title: 'Utilizadores & Permissões RBAC',
          subtitle: 'Administrador Boss e até 5 vendedores activos com validação a nível do motor (Engine).',
        };
      case 'logs':
        return {
          title: 'Auditoria & Logs Operacionais',
          subtitle: 'Registo imutável de todas as ações operacionais para conformidade.',
        };
      case 'settings':
        return {
          title: 'Configurações do Restaurante & Backups',
          subtitle: 'Contactos oficiais, taxas de entrega, backups e preferências operacionais.',
        };
      default:
        return { title: 'Visão Geral do Sistema', subtitle: 'Gestão interna Bali Catering' };
    }
  };

  const { title } = getSubViewTitle(adminSubView);

  const lowStockCount = ingredients.filter(
    (i) => i.currentStock <= i.minimumStock
  ).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-heading truncate">
          {title}
        </h2>
        <span
          className={`hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
            currentUser?.role === 'ADMIN'
              ? 'bg-slate-900 text-amber-400'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          {currentUser?.role === 'ADMIN' ? (
            <>
              <ShieldCheck className="w-3 h-3 text-orange-400" />
              <span>Admin Boss</span>
            </>
          ) : (
            <>
              <Store className="w-3 h-3 text-blue-600" />
              <span>Operador PDV</span>
            </>
          )}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Low Stock Warning Pill */}
        {lowStockCount > 0 && currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setAdminSubView('ingredients')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {lowStockCount} {lowStockCount === 1 ? 'item crítico' : 'itens críticos'}
            </span>
          </button>
        )}

        {/* Cloud Sync Status Pill */}
        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setAdminSubView('settings')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
            title="Clique para ver cópias de segurança e histórico de versões"
          >
            {cloudSyncState.status === 'ONLINE' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-700 hidden md:inline">Nuvem Sincronizada</span>
              </>
            ) : cloudSyncState.status === 'SYNCING' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="text-slate-700 hidden md:inline">Sincronizando</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-700 hidden md:inline">Modo Local</span>
              </>
            )}
          </button>
        )}

        {/* Website Public button */}
        <button
          onClick={() => setActiveView('public')}
          className="text-xs text-slate-500 font-bold hover:text-slate-800 transition-colors hidden md:block cursor-pointer"
        >
          Site Público
        </button>

        {/* Novo Pedido Button */}
        <button
          onClick={() => setAdminSubView('pos')}
          className="px-3.5 py-2 bg-[#F27D26] hover:bg-[#d96716] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Pedido</span>
        </button>
      </div>
    </header>
  );
};
