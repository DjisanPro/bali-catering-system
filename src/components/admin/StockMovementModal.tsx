import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Ingredient, StockMovementType } from '../../types';
import { getStockMovementTypeLabel } from '../../utils/formatters';
import { X, PlusCircle, MinusCircle, RefreshCw } from 'lucide-react';

interface StockMovementModalProps {
  ingredient: Ingredient;
  initialType?: StockMovementType;
  onClose: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  ingredient,
  initialType = 'ENTRY',
  onClose,
}) => {
  const { addStockMovement } = useRestaurant();
  const [type, setType] = useState<StockMovementType>(initialType);
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [performedBy, setPerformedBy] = useState('Gestor de Estoque');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty < 0) return;

    const defaultReason =
      reason.trim() ||
      (type === 'ENTRY'
        ? 'Entrada de mercadoria fornecedor'
        : type === 'EXIT_WASTE'
        ? 'Perda / Quebra / Avaria de insumo'
        : 'Ajuste de contagem física de inventário');

    addStockMovement(ingredient.id, type, numQty, defaultReason, performedBy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-serif font-bold text-base text-slate-900">
              Movimentação de Estoque
            </h3>
            <p className="text-xs text-slate-500">{ingredient.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Current Stock Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
            <span className="text-slate-600 font-medium">Estoque Físico Atual:</span>
            <span className="font-black text-slate-900 text-sm">
              {ingredient.currentStock} {ingredient.unit}
            </span>
          </div>

          {/* Movement Type */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">Tipo de Operação</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('ENTRY')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all text-center ${
                  type === 'ENTRY'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                + Entrada
              </button>
              <button
                type="button"
                onClick={() => setType('EXIT_WASTE')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all text-center ${
                  type === 'EXIT_WASTE'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                - Perda / Avaria
              </button>
              <button
                type="button"
                onClick={() => setType('ADJUSTMENT')}
                className={`py-2 px-2 rounded-xl font-bold text-xs border transition-all text-center ${
                  type === 'ADJUSTMENT'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Ajuste Total
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              {type === 'ADJUSTMENT'
                ? `Novo Estoque Físico Real (${ingredient.unit}) *`
                : `Quantidade a ${type === 'ENTRY' ? 'Adicionar' : 'Deduzir'} (${ingredient.unit}) *`}
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex: 5"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Justification / Invoice details */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Justificativa / Motivo / Factura *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                type === 'ENTRY'
                  ? 'Ex: Factura #782 - Fornecedor Talho Central'
                  : type === 'EXIT_WASTE'
                  ? 'Ex: Quebra de embalagem / Validade'
                  : 'Ex: Inventário físico de fim de turno'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Performed By */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Responsável pela Operação</label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs"
            >
              Confirmar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
