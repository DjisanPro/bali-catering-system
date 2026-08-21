import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Ingredient, StockMovementType, UnitOfMeasure } from '../../types';
import { formatMT } from '../../utils/formatters';
import {
  PlusCircle,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  Plus,
  Minus,
  X,
  Sliders,
  DollarSign,
  PackageCheck,
} from 'lucide-react';
import { StockMovementModal } from './StockMovementModal';

export const IngredientsView: React.FC = () => {
  const {
    ingredients,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    addStockMovement,
    showToast,
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [movementModalIngredient, setMovementModalIngredient] = useState<Ingredient | null>(null);
  const [movementType, setMovementType] = useState<StockMovementType>('ENTRY');
  const [isNewIngredientModalOpen, setIsNewIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Carnes');
  const [unit, setUnit] = useState<UnitOfMeasure>('kg');
  const [currentStock, setCurrentStock] = useState('10');
  const [minimumStock, setMinimumStock] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('100');
  const [supplier, setSupplier] = useState('');

  const uniqueCategories = Array.from(new Set(ingredients.map((i) => i.category)));

  const filteredIngredients = ingredients.filter((i) => {
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.supplier && i.supplier.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const openMovement = (ing: Ingredient, type: StockMovementType) => {
    setMovementModalIngredient(ing);
    setMovementType(type);
  };

  const handleQuickAdjust = (ing: Ingredient, delta: number) => {
    const newStock = Math.max(0, Number((ing.currentStock + delta).toFixed(3)));
    const type: StockMovementType = delta > 0 ? 'ENTRY' : 'EXIT_WASTE';
    addStockMovement(
      ing.id,
      type,
      Math.abs(delta),
      `Ajuste rápido direto de estoque (${delta > 0 ? '+' : ''}${delta} ${ing.unit}) no painel`,
      'Administrador'
    );
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setName(ing.name);
    setCategory(ing.category);
    setUnit(ing.unit);
    setCurrentStock(ing.currentStock.toString());
    setMinimumStock(ing.minimumStock.toString());
    setCostPerUnit(ing.costPerUnit.toString());
    setSupplier(ing.supplier || '');
    setIsNewIngredientModalOpen(true);
  };

  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numStock = parseFloat(currentStock) || 0;
    const numMin = parseFloat(minimumStock) || 0;
    const numCost = parseFloat(costPerUnit) || 0;

    if (editingIngredient) {
      updateIngredient(editingIngredient.id, {
        name: name.trim(),
        category,
        unit,
        currentStock: numStock,
        minimumStock: numMin,
        costPerUnit: numCost,
        supplier: supplier.trim(),
      });
      showToast('Estoque Atualizado', `"${name}" e valores foram atualizados com sucesso.`);
    } else {
      createIngredient({
        name: name.trim(),
        category,
        unit,
        currentStock: numStock,
        minimumStock: numMin,
        costPerUnit: numCost,
        supplier: supplier.trim(),
      });
      showToast('Insumo Cadastrado', `"${name}" adicionado ao inventário.`);
    }

    setIsNewIngredientModalOpen(false);
    setEditingIngredient(null);
    setName('');
    setSupplier('');
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar insumo, categoria ou fornecedor..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setEditingIngredient(null);
            setName('');
            setCurrentStock('10');
            setMinimumStock('5');
            setCostPerUnit('100');
            setSupplier('');
            setIsNewIngredientModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F27D26] hover:bg-orange-600 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Insumo / Matéria-Prima</span>
        </button>
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Insumo / Matéria-Prima</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5">Estoque Atual & Ajuste Rápido</th>
                <th className="p-3.5">Nível Mínimo</th>
                <th className="p-3.5">Custo Unitário</th>
                <th className="p-3.5">Fornecedor</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredIngredients.map((ing) => {
                const isLow = ing.currentStock <= ing.minimumStock;
                const isCriticallyLow = ing.currentStock <= ing.minimumStock / 2;
                return (
                  <tr key={ing.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{ing.name}</div>
                      <span className="text-[10px] text-slate-400">Unidade: {ing.unit}</span>
                    </td>

                    {/* Category */}
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {ing.category}
                      </span>
                    </td>

                    {/* Current Stock with Quick Adjusters */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-black text-sm ${
                            isLow ? 'text-red-600' : 'text-slate-900'
                          }`}
                        >
                          {ing.currentStock} {ing.unit}
                        </span>

                        {/* Quick +/- buttons */}
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                          <button
                            onClick={() => handleQuickAdjust(ing, -1)}
                            className="p-1 hover:bg-white rounded text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
                            title="Subtrair 1 unidade"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(ing, 1)}
                            className="p-1 hover:bg-white rounded text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Adicionar 1 unidade"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Minimum Stock */}
                    <td className="p-3.5 text-slate-500 font-medium">
                      {ing.minimumStock} {ing.unit}
                    </td>

                    {/* Unit Cost */}
                    <td className="p-3.5 font-bold text-slate-800">
                      {formatMT(ing.costPerUnit)} / {ing.unit}
                    </td>

                    {/* Supplier */}
                    <td className="p-3.5 text-slate-600 text-[11px]">
                      {ing.supplier || 'Mercado Local Tete'}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5">
                      {isCriticallyLow ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Crítico
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Baixo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Regular
                        </span>
                      )}
                    </td>

                    {/* Fast Movement & Edit Buttons */}
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => openMovement(ing, 'ENTRY')}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] border border-emerald-200 cursor-pointer"
                        title="Registar Entrada de Lote de Fornecedor"
                      >
                        + Entrada
                      </button>
                      <button
                        onClick={() => openMovement(ing, 'EXIT_WASTE')}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[11px] border border-red-200 cursor-pointer"
                        title="Registar Perda / Avaria"
                      >
                        - Perda
                      </button>
                      <button
                        onClick={() => handleOpenEdit(ing)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                        title="Editar Insumo e Valores"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir "${ing.name}"?`)) {
                            deleteIngredient(ing.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title="Excluir do Estoque"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Modal */}
      {movementModalIngredient && (
        <StockMovementModal
          ingredient={movementModalIngredient}
          initialType={movementType}
          onClose={() => setMovementModalIngredient(null)}
        />
      )}

      {/* Create / Edit Ingredient Modal */}
      {isNewIngredientModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-heading font-bold text-base text-slate-900">
                {editingIngredient ? 'Editar Insumo & Valores de Estoque' : 'Novo Insumo no Estoque'}
              </h3>
              <button
                onClick={() => setIsNewIngredientModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nome do Insumo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carne Bovina (Alcatra)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoria *</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Carnes, Padaria, Laticínios..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unidade de Medida *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-white cursor-pointer"
                  >
                    <option value="kg">kg (Quilograma)</option>
                    <option value="g">g (Grama)</option>
                    <option value="l">l (Litro)</option>
                    <option value="ml">ml (Mililitro)</option>
                    <option value="un">un (Unidade)</option>
                    <option value="porcao">porção (Porção)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estoque Atual</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-bold text-amber-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Custo / Unid (MT)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-bold text-[#F27D26]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Fornecedor Habitual</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Ex: Talho Central de Tete"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewIngredientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F27D26] hover:bg-orange-600 text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingIngredient ? 'Salvar Alterações' : 'Cadastrar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
