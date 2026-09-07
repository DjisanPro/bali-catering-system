import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatMT } from '../../utils/formatters';
import { Calendar, Plus, Check, Sparkles } from 'lucide-react';

export const PublicDobradaPromo: React.FC = () => {
  const { products, addToCart } = useRestaurant();
  const [isAdded, setIsAdded] = useState(false);

  // Find dobrada product
  const dobradaProduct =
    products.find((p) => p.name.toLowerCase().includes('dobrada')) || {
      id: 'dobrada-promo',
      name: 'Dobrada Tradicional com Feijão Branco',
      price: 350,
      description: 'Feita à moda tradicional de Tete com feijão branco selecionado, temperos autênticos e piripiri fresco.',
      imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&auto=format&fit=crop&q=85',
      categoryId: 'tradicional',
      preparationTimeMinutes: 20,
      isAvailable: true,
      costPrice: 150,
    };

  const handleAdd = () => {
    addToCart(dobradaProduct, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <section id="dobrada" className="reveal py-20 md:py-28 bg-[#1C1917] text-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text and Promo info */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#E86319] text-xs font-bold uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" />
              <span>Domingo + Segunda</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-white leading-tight">
              Dia de <span className="italic text-[#E86319]">Dobrada.</span>
            </h2>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-sans max-w-md">
              A verdadeira dobrada moçambicana, cozida lentamente em lume brando com feijão branco e caldo encorpado. Um clássico gastronómico imperdível de Tete.
            </p>

            <div className="flex items-baseline gap-4 pt-2">
              <span className="text-4xl sm:text-5xl font-black text-white font-sans">
                {formatMT(dobradaProduct.price)}
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#E86319]">
                Dose Generosa
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleAdd}
                className={`px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-lg ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#E86319] hover:bg-[#D45512] text-white hover:shadow-orange-500/30'
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
                    <span>Garantir Minha Dose</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Big Photography Showcase */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[16/10] bg-zinc-950 border border-white/10">
              <img
                src={dobradaProduct.imageUrl || "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&auto=format&fit=crop&q=85"}
                alt="Dobrada Tradicional com Feijão Branco"
                className="w-full h-full object-cover editorial-img hover:scale-105 transition-transform duration-700"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between text-xs text-zinc-300">
                <span className="font-semibold">Feijão Branco & Piripiri de Tete</span>
                <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white font-bold">
                  Especial de Fim de Semana
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
