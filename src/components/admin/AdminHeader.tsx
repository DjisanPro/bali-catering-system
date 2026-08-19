import React from 'react';
import { useRestaurant, AdminSubView } from '../../context/RestaurantContext';
import {
  AlertTriangle,
  PlusCircle,
  Store,
  ExternalLink,
} from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const {
    adminSubView,
    setAdminSubView,
    setActiveView,
    orders,
    ingredients,
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
      case 'logs':
        return {
          title: 'Auditoria & Logs Operacionais',
          subtitle: 'Registo imutável de todas as ações operacionais para conformidade.',
        };
      case 'settings':
        return {
          title: 'Configurações do Restaurante',
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

  const pendingCount = orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'PREPARING'
  ).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-slate-900 font-heading">
          {title}
        </h2>
        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider">
          Operacional
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Low Stock Warning Pill */}
        {lowStockCount > 0 && (
          <button
            onClick={() => setAdminSubView('ingredients')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{lowStockCount} {lowStockCount === 1 ? 'item crítico' : 'itens críticos'}</span>
          </button>
        )}

        {/* Website Public button */}
        <button
          onClick={() => setActiveView('public')}
          className="text-sm text-slate-500 font-medium hover:text-slate-800 transition-colors hidden sm:block"
        >
          Website Público
        </button>

        {/* Novo Pedido Button */}
        <button
          onClick={() => setAdminSubView('pos')}
          className="px-4 py-2 bg-[#F27D26] hover:bg-orange-600 text-white text-sm font-bold rounded-lg shadow-sm shadow-orange-200 transition-colors flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Pedido +</span>
        </button>
      </div>
    </header>
  );
};
