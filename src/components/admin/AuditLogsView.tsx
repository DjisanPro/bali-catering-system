import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatDateTime } from '../../utils/formatters';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  User,
  Tag,
  CheckCircle2,
} from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (entityFilter !== 'all' && log.entityType !== entityFilter) return false;
    if (resultFilter !== 'all' && (log.result || 'SUCCESS') !== resultFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.user.toLowerCase().includes(q) ||
        (log.userRole && log.userRole.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getEntityBadgeColor = (entity: string) => {
    switch (entity) {
      case 'ORDER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'STOCK':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'PRODUCT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INGREDIENT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PAYMENT':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'USER':
        return 'bg-orange-50 text-[#E86319] border-orange-200';
      case 'AUTH':
        return 'bg-slate-900 text-amber-400 border-slate-700';
      case 'SETTING':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getResultBadge = (result?: 'SUCCESS' | 'REJECTED_UNAUTHORIZED' | 'FAILED') => {
    switch (result) {
      case 'REJECTED_UNAUTHORIZED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">
            <ShieldX className="w-3 h-3 text-red-600 shrink-0" />
            <span>REJEITADO (ENGINE)</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
            <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
            <span>FALHA</span>
          </span>
        );
      case 'SUCCESS':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>SUCESSO</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ação, operador, descrição..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas as Entidades</option>
            <option value="ORDER">Pedidos</option>
            <option value="STOCK">Estoque</option>
            <option value="PRODUCT">Produtos</option>
            <option value="INGREDIENT">Ingredientes</option>
            <option value="PAYMENT">Pagamentos</option>
            <option value="USER">Utilizadores</option>
            <option value="AUTH">Autenticação</option>
            <option value="SETTING">Configurações & Backups</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos os Resultados</option>
            <option value="SUCCESS">Apenas Sucesso</option>
            <option value="REJECTED_UNAUTHORIZED">Rejeitados no Engine (RBAC)</option>
            <option value="FAILED">Falhas de Validação</option>
          </select>
        </div>

        <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{filteredLogs.length} de {auditLogs.length} eventos registados</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Data & Hora</th>
                <th className="p-4">Entidade</th>
                <th className="p-4">Resultado Engine</th>
                <th className="p-4">Ação Operacional</th>
                <th className="p-4">Descrição do Evento</th>
                <th className="p-4">Utilizador / Função</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    Nenhum log encontrado para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${getEntityBadgeColor(
                          log.entityType
                        )}`}
                      >
                        {log.entityType}
                      </span>
                    </td>

                    <td className="p-4">
                      {getResultBadge(log.result)}
                    </td>

                    <td className="p-4 font-bold text-slate-900">{log.action}</td>

                    <td className="p-4 text-slate-700 text-xs max-w-md">
                      <p>{log.description}</p>
                      {(log.previousValue !== undefined || log.newValue !== undefined) && (
                        <div className="mt-1 font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                          {log.previousValue !== undefined && <span>Anterior: {log.previousValue} </span>}
                          {log.newValue !== undefined && <span>| Novo: {log.newValue}</span>}
                        </div>
                      )}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 text-[11px]">
                          {log.user}
                        </span>
                        {log.userRole && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              log.userRole === 'ADMIN'
                                ? 'bg-slate-900 text-amber-400'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {log.userRole}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
