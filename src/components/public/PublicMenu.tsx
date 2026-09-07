import React, { useState, useMemo } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product } from '../../types';
import { formatMT } from '../../utils/formatters';
import { Search, Plus, Check, Clock } from 'lucide-react';

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
    }, 1600);
    if (onOpenCart) onOpenCart();
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = (product.description || '').toLowerCase().includes(q);
        return matchesName || matchesDesc;
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <section id="menu" className="reveal py-20 md:py-28 bg-white border-b border-[#EAE5DC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header — editorial, sem eyebrow repetido */}
            <div className="max-w-2xl mb-14 space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-[#1C1917] tracking-tight">
                Escolha os seus pratos.
              </h2>
          <p className="text-sm sm:text-base text-[#57534E] font-sans leading-relaxed max-w-lg">
            Feitos na hora com carnes selecionadas, pão fresco e temperos autênticos de Tete.
          </p>
        </div>

        {/* Categories Bar & Search — refined */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-[0.97] ${
                selectedCategory === 'all'
                  ? 'bg-[#1C1917] text-white shadow-sm'
                  : 'bg-[#FAF8F5] text-[#57534E] hover:bg-[#F0ECE4] border border-[#EAE5DC]'
              }`}
            >
              Todos ({products.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer active:scale-[0.97] ${
                  selectedCategory === cat.id
                    ? 'bg-[#E86319] text-white shadow-sm'
                    : 'bg-[#FAF8F5] text-[#57534E] hover:bg-[#F0ECE4] border border-[#EAE5DC]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar no cardápio..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full border border-[#EAE5DC] bg-[#FAF8F5] text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#E86319] focus:bg-white focus:ring-2 focus:ring-[#E86319]/10 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#A8A29E] hover:text-[#1C1917] cursor-pointer"
                aria-label="Limpar pesquisa"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Product Cards — Double-Bezel, image-led */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-[#57534E] max-w-sm mx-auto">
            <p className="text-sm font-semibold">Nenhum prato encontrado com esta busca.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-3 text-xs font-bold text-[#E86319] hover:underline cursor-pointer"
            >
              Ver todo o cardápio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 sm:gap-x-10">
            {filteredProducts.map((product) => {
              const isAdded = addedItemIds[product.id];
              return (
                <article
                  key={product.id}
                  className="group flex flex-col text-left"
                >
                  {/* Double-Bezel image frame */}
                  <div className="p-1.5 rounded-[1.75rem] bg-[#FAF8F5] border border-[#EAE5DC] transition-colors duration-300 group-hover:border-[#EAD9C8] mb-5">
                    <div className="relative aspect-[4/3] rounded-[1.4rem] overflow-hidden bg-[#F4F1EA]">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                      {/* Specialty badge */}
                      {product.isSpecialty && (
                        <div className="absolute top-3 left-3 bg-[#E86319] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-xs">
                          Especialidade
                        </div>
                      )}

                      {/* Prep time */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[10px] font-medium text-white bg-[#1C1917]/70 backdrop-blur-xs px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3 text-[#E86319]" />
                        <span>~{product.preparationTimeMinutes} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 px-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-serif font-bold text-lg sm:text-xl text-[#1C1917] leading-snug group-hover:text-[#E86319] transition-colors">
                        {product.name}
                      </h3>
                      <span className="font-sans font-black text-base sm:text-lg text-[#1C1917] shrink-0 tabular-nums">
                        {formatMT(product.price)}
                      </span>
                    </div>

                    <p className="text-xs text-[#57534E] leading-relaxed line-clamp-2 font-sans">
                      {product.description || 'Preparado no ponto perfeito com ingredientes frescos de Tete.'}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="pt-4 mt-auto px-1">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.isAvailable}
                      className={`w-full py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] ${
                        !product.isAvailable
                          ? 'bg-[#F5F5F4] text-[#A8A29E] cursor-not-allowed'
                          : isAdded
                          ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                          : 'bg-[#1C1917] hover:bg-[#E86319] text-white shadow-2xs hover:shadow-[0_8px_20px_-6px_rgb(232_99_25/0.4)]'
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
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};