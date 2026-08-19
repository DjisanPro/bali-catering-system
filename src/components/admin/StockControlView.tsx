import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { StockMovementType, Ingredient } from '../../types';
import {
  formatDateTime,
  getStockMovementTypeLabel,
  getStockMovementBadgeColor,
} from '../../utils/formatters';
import {
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  PlusCircle,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { StockMovementModal } from './StockMovementModal';

export const StockControlView: React.FC = () => {
  const { stockMovements, ingredients } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [ingredientFilter, setIngredientFilter] = useState<string>('all');
  const [selectedIngredientForMovement, setSelectedIngredientForMovement] = useState<Ingredient | null>(null);

  const filteredMovements = stockMovements.filter((m) => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (ingredientFilter !== 'all' && m.ingredientId !== ingredientFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.ingredientName.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        m.performedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por motivo, insumo..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Tipos de Movimento</option>
            <option value="ENTRY">Entradas de Fornecedor</option>
            <option value="EXIT_ORDER">Saídas por Pedidos</option>
            <option value="EXIT_WASTE">Perdas / Avarias</option>
            <option value="ADJUSTMENT">Ajustes de Inventário</option>
          </select>

          {/* Ingredient Filter */}
          <select
            value={ingredientFilter}
            onChange={(e) => setIngredientFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Insumos</option>
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name}
              </option>
            ))}
          </select>
        </div>

        {/* New Movement Button */}
        {ingredients.length > 0 && (
          <button
            onClick={() => setSelectedIngredientForMovement(ingredients[0])}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lançar Movimento Manual</span>
          </button>
        )}
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Data & Hora</th>
                <th className="p-3.5">Tipo de Movimento</th>
                <th className="p-3.5">Ingrediente</th>
                <th className="p-3.5">Qtd Movimentada</th>
                <th className="p-3.5">Anterior ➔ Final</th>
                <th className="p-3.5">Justificativa / Documento</th>
                <th className="p-3.5">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum registo de movimentação encontrado.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const badge = getStockMovementBadgeColor(mov.type);
                  const isPositive = mov.type === 'ENTRY';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date */}
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(mov.createdAt)}
                      </td>

                      {/* Type Badge */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                          <span>{getStockMovementTypeLabel(mov.type)}</span>
                        </span>
                      </td>

                      {/* Ingredient */}
                      <td className="p-3.5 font-bold text-slate-900">{mov.ingredientName}</td>

                      {/* Quantity */}
                      <td className="p-3.5 font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-700' : 'text-red-700'}>
                          {isPositive ? '+' : '-'}
                          {mov.quantity} {mov.unit}
                        </span>
                      </td>

                      {/* Before / After */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                        <span>{mov.previousStock}</span>
                        <span className="text-slate-400 mx-1">➔</span>
                        <strong className="text-slate-900">{mov.newStock} {mov.unit}</strong>
                      </td>

                      {/* Reason */}
                      <td className="p-3.5 text-slate-700 max-w-xs truncate" title={mov.reason}>
                        {mov.reason}
                      </td>

                      {/* Performed by */}
                      <td className="p-3.5 text-[11px] text-slate-500">{mov.performedBy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedIngredientForMovement && (
        <StockMovementModal
          ingredient={selectedIngredientForMovement}
          initialType="ENTRY"
          onClose={() => setSelectedIngredientForMovement(null)}
        />
      )}
    </div>
  );
};
