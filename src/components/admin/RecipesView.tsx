import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product, RecipeIngredient } from '../../types';
import { formatMT } from '../../utils/formatters';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle,
  Sparkles,
  Info,
} from 'lucide-react';

export const RecipesView: React.FC = () => {
  const { products, ingredients, updateProductRecipe } = useRestaurant();
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [activeIngredientId, setActiveIngredientId] = useState('');
  const [ingredientQty, setIngredientQty] = useState('1');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleAddIngredientToRecipe = () => {
    if (!selectedProduct || !activeIngredientId) return;
    const ing = ingredients.find((i) => i.id === activeIngredientId);
    if (!ing) return;

    const currentRecipe = [...(selectedProduct.ingredients || [])];
    const existingIndex = currentRecipe.findIndex((r) => r.ingredientId === activeIngredientId);
    const qty = parseFloat(ingredientQty) || 1;

    if (existingIndex >= 0) {
      currentRecipe[existingIndex].quantity = qty;
    } else {
      currentRecipe.push({
        ingredientId: ing.id,
        ingredientName: ing.name,
        unit: ing.unit,
        quantity: qty,
      });
    }

    updateProductRecipe(selectedProduct.id, currentRecipe);
    setActiveIngredientId('');
    setIngredientQty('1');
  };

  const handleRemoveIngredientFromRecipe = (ingId: string) => {
    if (!selectedProduct) return;
    const updated = (selectedProduct.ingredients || []).filter((r) => r.ingredientId !== ingId);
    updateProductRecipe(selectedProduct.id, updated);
  };

  // Cost calculation
  const recipeItems = selectedProduct?.ingredients || [];
  const totalCMV = recipeItems.reduce((sum, item) => {
    const ing = ingredients.find((i) => i.id === item.ingredientId);
    return sum + (ing ? ing.costPerUnit * item.quantity : 0);
  }, 0);

  const sellingPrice = selectedProduct?.price || 0;
  const grossProfit = sellingPrice - totalCMV;
  const marginPercent = sellingPrice > 0 ? Math.round((grossProfit / sellingPrice) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Informational banner */}
      <div className="bg-amber-500/10 border border-amber-300/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Fichas Técnicas & Baixa Automática:</strong> Ao vincular insumos a um prato, o sistema calcula o Custo de Mercadorias Vendidas (CMV) em tempo real e deduz automaticamente as quantidades do estoque a cada pedido confirmado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (4 cols): Product List Selector */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <h3 className="font-serif font-bold text-sm text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600" />
            <span>Selecione o Prato / Produto</span>
          </h3>

          <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1 scrollbar-thin">
            {products.map((p) => {
              const isSelected = p.id === selectedProduct?.id;
              const itemsCount = p.ingredients?.length || 0;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/60 shadow-2xs ring-1 ring-orange-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="truncate">
                      <h4 className="font-bold text-xs text-slate-900 truncate">{p.name}</h4>
                      <span className="text-[10px] text-slate-500">{formatMT(p.price)}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      itemsCount > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {itemsCount} {itemsCount === 1 ? 'insumo' : 'insumos'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right (8 cols): Recipe Editor & Margin Calculator */}
        {selectedProduct ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Financial Metrics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Preço de Venda
                </span>
                <div className="text-xl font-black text-slate-900 font-serif mt-1">
                  {formatMT(sellingPrice)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Custo de Insumos (CMV)
                </span>
                <div className="text-xl font-black text-orange-600 font-serif mt-1">
                  {formatMT(totalCMV)}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Margem Bruta
                </span>
                <div className="text-xl font-black text-emerald-600 font-serif mt-1 flex items-center gap-1">
                  <span>{marginPercent}%</span>
                  <span className="text-xs font-bold text-slate-500">
                    (+{formatMT(grossProfit)})
                  </span>
                </div>
              </div>
            </div>

            {/* Recipe Composition Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Ficha Técnica: {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Composição quantitativa de matéria-prima por porção unitária.
                  </p>
                </div>
              </div>

              {/* Add Ingredient Input Strip */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Adicionar Insumo à Receita
                </span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={activeIngredientId}
                    onChange={(e) => setActiveIngredientId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none"
                  >
                    <option value="">Selecione o ingrediente...</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit}) - {ing.costPerUnit} MT/{ing.unit}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0.001"
                      value={ingredientQty}
                      onChange={(e) => setIngredientQty(e.target.value)}
                      placeholder="Qtd necessária"
                      className="w-32 px-3 py-2 rounded-lg border border-slate-200 text-xs text-center bg-white"
                    />

                    <button
                      type="button"
                      onClick={handleAddIngredientToRecipe}
                      disabled={!activeIngredientId}
                      className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 text-white font-bold text-xs transition-colors shrink-0"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Ingredients List Table */}
              {recipeItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">
                    Este prato ainda não possui ingredientes vinculados. Adicione os insumos acima.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Ingrediente / Insumo</th>
                        <th className="p-3">Qtd / Porção</th>
                        <th className="p-3">Custo Unitário</th>
                        <th className="p-3">Custo Total</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recipeItems.map((item) => {
                        const ing = ingredients.find((i) => i.id === item.ingredientId);
                        const unitCost = ing ? ing.costPerUnit : 0;
                        const lineTotal = unitCost * item.quantity;
                        return (
                          <tr key={item.ingredientId} className="hover:bg-slate-50/60">
                            <td className="p-3 font-bold text-slate-900">{item.ingredientName}</td>
                            <td className="p-3 font-semibold text-slate-700">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-3 text-slate-600">{formatMT(unitCost)}/{item.unit}</td>
                            <td className="p-3 font-bold text-orange-600">{formatMT(lineTotal)}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRemoveIngredientFromRecipe(item.ingredientId)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Remover da ficha"
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
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-xs">Selecione um produto para visualizar a ficha técnica.</p>
          </div>
        )}
      </div>
    </div>
  );
};
