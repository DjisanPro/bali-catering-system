import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatMT } from '../../utils/formatters';
import { Plus, Check, Flame, Sparkles } from 'lucide-react';

export const PublicSpotlightProduct: React.FC = () => {
  const { products, addToCart, setIsCartOpen } = useRestaurant();
  const [isAdded, setIsAdded] = useState(false);

  // Find Bali Burger or first specialty product
  const spotlightProduct =
    products.find((p) => p.isSpecialty && p.name.toLowerCase().includes('burger')) ||
    products.find((p) => p.isSpecialty) ||
    products[0];

  if (!spotlightProduct) return null;

  const handleAdd = () => {
    addToCart(spotlightProduct, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <section id="destaque" className="py-20 md:py-28 bg-[#F4EFE6] border-b border-[#E5DFD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Large Editorial Photograph */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3] bg-zinc-900">
              <img
                src={spotlightProduct.imageUrl || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=85"}
                alt={spotlightProduct.name}
                className="w-full h-full object-cover editorial-img hover:scale-105 transition-transform duration-700"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs text-zinc-950 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#E86319]" />
                <span>Prato de Assinatura</span>
              </div>
            </div>
          </div>

          {/* Editorial Content Block */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E86319] block mb-2">
                Destaque do Mês
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-zinc-950 leading-tight">
                {spotlightProduct.name}
              </h2>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-sans font-black text-zinc-950">
                {formatMT(spotlightProduct.price)}
              </span>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Preço Especial
              </span>
            </div>

            <p className="text-sm sm:text-base text-zinc-700 leading-relaxed font-sans">
              {spotlightProduct.description ||
                '180g de carne bovina nobre prensada artesanalmente, queijo cheddar derretido, fatias crocantes de bacon, ovo frito e o molho secreto Bali.'}
            </p>

            <div className="pt-2">
              <button
                onClick={handleAdd}
                className={`px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-md ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#E86319] hover:bg-[#D45512] text-white hover:shadow-orange-500/20'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Adicionado à Sacola</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Adicionar ao Pedido</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
