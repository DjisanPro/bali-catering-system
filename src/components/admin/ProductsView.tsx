import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product } from '../../types';
import { formatMT } from '../../utils/formatters';
import {
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Copy,
  Sparkles,
  Flame,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutGrid,
  List,
  UtensilsCrossed,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { ProductModal } from './ProductModal';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    createProduct,
    updateProduct,
    deleteProduct,
    showToast,
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || catId;
  };

  const handleDuplicate = (p: Product) => {
    createProduct({
      ...p,
      name: `${p.name} (Cópia)`,
      isAvailable: true,
    });
    showToast('Prato Duplicado', `Criada cópia de "${p.name}". Pode editá-la agora.`);
  };

  // Metrics summary
  const totalProducts = products.length;
  const availableProducts = products.filter((p) => p.isAvailable).length;
  const specialtyCount = products.filter((p) => p.isSpecialty).length;
  const avgMargin = Math.round(
    products.reduce((acc, p) => {
      const cost = p.costPrice || 0;
      return acc + (p.price > 0 ? ((p.price - cost) / p.price) * 100 : 0);
    }, 0) / (totalProducts || 1)
  );

  return (
    <div className="space-y-6">
      {/* Top Stat Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total no Cardápio
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-slate-900 font-heading">{totalProducts}</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {availableProducts} Ativos
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Especialidades Bali
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-[#E86319] font-heading">{specialtyCount}</span>
            <Flame className="w-4 h-4 text-[#E86319]" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Margem Média Bruta
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-emerald-600 font-heading">{avgMargin}%</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Categorias Ativas
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-slate-900 font-heading">
              {categories.length}
            </span>
            <UtensilsCrossed className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search & Category Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por prato ou ingrediente..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todas as Categorias ({products.length})</option>
            {categories.map((c) => {
              const count = products.filter((p) => p.categoryId === c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* View Switcher & Action Button */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização em Galeria"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsNewModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#E86319] hover:bg-orange-600 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Prato / Produto</span>
          </button>
        </div>
      </div>

      {/* Render Product Cards (Grid Mode) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const cost = product.costPrice || 0;
            const margin =
              product.price > 0
                ? Math.round(((product.price - cost) / product.price) * 100)
                : 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col hover:shadow-md hover:border-orange-200 transition-all group"
              >
                {/* Photo & Badges */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                      {getCategoryName(product.categoryId)}
                    </span>

                    <button
                      onClick={() =>
                        updateProduct(product.id, { isAvailable: !product.isAvailable })
                      }
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md transition-all cursor-pointer ${
                        product.isAvailable
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-slate-900/80 text-slate-300'
                      }`}
                    >
                      {product.isAvailable ? 'Disponível' : 'Pausado'}
                    </button>
                  </div>

                  {/* Bottom Image Overlay Details */}
                  <div className="absolute bottom-3 inset-x-3 flex items-end justify-between text-white">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {product.isSpecialty && (
                          <span className="bg-[#E86319] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                            Especialidade
                          </span>
                        )}
                        {product.isSeasonal && (
                          <span className="bg-amber-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Sazonal
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-200 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#E86319]" /> ~{product.preparationTimeMinutes} min
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-300 block font-medium">Preço</span>
                      <span className="text-lg font-black text-white font-heading">
                        {formatMT(product.price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="font-heading font-extrabold text-sm text-slate-900 leading-snug group-hover:text-[#E86319] transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {product.description || 'Sem descrição cadastrada.'}
                    </p>
                  </div>

                  {/* Financial & Insumos Breakdown */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Custo (CMV)</span>
                      <span className="font-bold text-slate-700">{formatMT(cost)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Margem</span>
                      <span
                        className={`font-black ${
                          margin >= 50
                            ? 'text-emerald-600'
                            : margin >= 30
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {margin}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Ficha Técnica</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#E86319]" />
                        {product.ingredients?.length || 0} itens
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleDuplicate(product)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Duplicar Prato"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicar</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Tem certeza que deseja apagar o prato "${product.name}" do cardápio?`
                            )
                          ) {
                            deleteProduct(product.id);
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remover Prato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setEditingProduct(product)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#E86319]" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Render Table (Table Mode) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Prato / Produto</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Preço Venda</th>
                  <th className="p-3.5">Custo (CMV)</th>
                  <th className="p-3.5">Margem Bruta</th>
                  <th className="p-3.5">Ficha Técnica</th>
                  <th className="p-3.5">Disponível</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const cost = product.costPrice || 0;
                  const margin =
                    product.price > 0
                      ? Math.round(((product.price - cost) / product.price) * 100)
                      : 0;
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product & Photo */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{product.name}</span>
                              {product.isSpecialty && (
                                <span className="bg-orange-100 text-[#E86319] text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                                  Especial
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> ~{product.preparationTimeMinutes} min
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {getCategoryName(product.categoryId)}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="p-3.5 font-bold text-slate-900">
                        {formatMT(product.price)}
                      </td>

                      {/* Cost Price */}
                      <td className="p-3.5 font-semibold text-slate-600">
                        {cost > 0 ? formatMT(cost) : '-'}
                      </td>

                      {/* Gross Profit Margin */}
                      <td className="p-3.5">
                        {cost > 0 ? (
                          <span
                            className={`font-black text-[11px] px-2 py-0.5 rounded-md ${
                              margin >= 50
                                ? 'bg-emerald-100 text-emerald-800'
                                : margin >= 30
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {margin}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Recipe count */}
                      <td className="p-3.5">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-[11px] font-semibold text-slate-600 hover:text-orange-600 flex items-center gap-1"
                        >
                          <Layers className="w-3.5 h-3.5 text-orange-500" />
                          <span>{product.ingredients?.length || 0} insumos</span>
                        </button>
                      </td>

                      {/* Available Toggle */}
                      <td className="p-3.5">
                        <button
                          onClick={() =>
                            updateProduct(product.id, { isAvailable: !product.isAvailable })
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            product.isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {product.isAvailable ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Ativo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              <span>Pausado</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleDuplicate(product)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Duplicar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#E86319]" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir "${product.name}"?`)) {
                              deleteProduct(product.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          title="Excluir"
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
      )}

      {/* Product Modal */}
      {(isNewModalOpen || editingProduct) && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setIsNewModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
};
