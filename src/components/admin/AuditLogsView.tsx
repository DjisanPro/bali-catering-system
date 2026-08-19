import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatDateTime } from '../../utils/formatters';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  User,
  Tag,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (entityFilter !== 'all' && log.entityType !== entityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getEntityBadgeColor = (entity: string) => {
    switch (entity) {
      case 'ORDER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STOCK':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PRODUCT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INGREDIENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PAYMENT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CONFIG':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ação, utilizador, descrição..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todas as Entidades</option>
            <option value="ORDER">Pedidos</option>
            <option value="STOCK">Estoque</option>
            <option value="PRODUCT">Produtos</option>
            <option value="INGREDIENT">Ingredientes</option>
            <option value="PAYMENT">Pagamentos</option>
            <option value="CONFIG">Configurações</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{auditLogs.length} eventos registados</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Data & Hora</th>
                <th className="p-3.5">Entidade</th>
                <th className="p-3.5">Ação Operacional</th>
                <th className="p-3.5">Descrição Detalhada</th>
                <th className="p-3.5">Utilizador / Sistema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getEntityBadgeColor(
                        log.entityType
                      )}`}
                    >
                      {log.entityType}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{log.action}</td>
                  <td className="p-3.5 text-slate-700 text-xs">{log.description}</td>
                  <td className="p-3.5 text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                    {log.user}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
