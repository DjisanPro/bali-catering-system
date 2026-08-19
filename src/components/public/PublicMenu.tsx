import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product } from '../../types';
import { formatMT } from '../../utils/formatters';
import { Search, Plus, Check, Clock, Flame, Sparkles } from 'lucide-react';

interface PublicMenuProps {
  onOpenCart?: () => void;
}

export const PublicMenu: React.FC<PublicMenuProps> = ({ onOpenCart }) => {
  const { categories, products, addToCart, setIsCartOpen } = useRestaurant();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setAddedItemIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        return matchesName || matchesDesc;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <section id="menu" className="py-20 md:py-28 bg-white border-b border-[#EAE5DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E86319] block">
            Cardápio Selecionado
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-zinc-950 tracking-tight">
            Escolha os seus pratos.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-sans leading-relaxed">
            Feitos na hora com carnes selecionadas, pão fresco e temperos autênticos de Tete.
          </p>
        </div>

        {/* Categories Bar & Search Filter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          {/* Minimal Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'bg-[#FAF8F5] text-zinc-600 hover:bg-zinc-200/70 border border-[#EAE5DC]'
              }`}
            >
              Todos ({products.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#E86319] text-white shadow-sm'
                    : 'bg-[#FAF8F5] text-zinc-600 hover:bg-zinc-200/70 border border-[#EAE5DC]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Minimal Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar no cardápio..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full border border-[#EAE5DC] bg-[#FAF8F5] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#E86319] focus:bg-white transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 hover:text-zinc-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Product Cards Grid - Clean, Image-Focused Editorial Style */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 max-w-sm mx-auto">
            <p className="text-sm font-semibold">Nenhum prato encontrado com esta busca.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-3 text-xs font-bold text-[#E86319] hover:underline"
            >
              Ver todo o cardápio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredProducts.map((product) => {
              const isAdded = addedItemIds[product.id];
              return (
                <div
                  key={product.id}
                  className="group flex flex-col justify-between bg-white text-left transition-all"
                >
                  <div>
                    {/* Big Photograph with Rounded Corners */}
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#F4F1EA] mb-4">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      {/* Subtle Top Badges */}
                      {product.isSpecialty && (
                        <div className="absolute top-3 left-3 bg-[#E86319] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-xs">
                          Especialidade
                        </div>
                      )}

                      {/* Prep time */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[10px] font-medium text-white bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3 text-[#E86319]" />
                        <span>~{product.preparationTimeMinutes} min</span>
                      </div>
                    </div>

                    {/* Information & Clean Typography */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-serif font-bold text-lg sm:text-xl text-zinc-950 leading-snug group-hover:text-[#E86319] transition-colors">
                          {product.name}
                        </h3>
                        <span className="font-sans font-black text-base sm:text-lg text-zinc-950 shrink-0">
                          {formatMT(product.price)}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 font-sans">
                        {product.description || 'Preparado no ponto perfeito com ingredientes frescos de Tete.'}
                      </p>
                    </div>
                  </div>

                  {/* Clean CTA Button */}
                  <div className="pt-4 mt-auto">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.isAvailable}
                      className={`w-full py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        !product.isAvailable
                          ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                          : isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-950 hover:bg-[#E86319] text-white shadow-2xs hover:shadow-orange-500/20'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Adicionado!</span>
                        </>
                      ) : !product.isAvailable ? (
                        <span>Indisponível hoje</span>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Adicionar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
