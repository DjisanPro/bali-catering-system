import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ArrowRight, Utensils, Phone, MessageSquare } from 'lucide-react';

interface PublicHeroProps {
  onExploreMenu?: () => void;
}

export const PublicHero: React.FC<PublicHeroProps> = ({ onExploreMenu }) => {
  const { config } = useRestaurant();

  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-28 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Editorial Content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-block">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E86319] bg-orange-50/80 px-3 py-1 rounded-full border border-orange-200/60">
                Bali Catering Service • Tete
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-zinc-950 leading-[1.08] tracking-tight">
              Sabor que faz <span className="italic font-normal text-[#E86319]">voltar.</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-lg font-sans">
              Grelhados no carvão, hambúrgueres artesanais, sandes de carne assada e doces regionais de Malambe. A autêntica tradição gastronómica servida com dedicação em Tete.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreMenu || (() => handleScroll('menu'))}
                className="px-8 py-4 rounded-full bg-[#E86319] hover:bg-[#D45512] text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md hover:shadow-lg hover:shadow-orange-500/20 cursor-pointer flex items-center gap-2.5"
              >
                <span>Ver Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/${config.whatsappPrimary}?text=Ol%C3%A1%20Bali%20Catering!%20Gostaria%20de%20fazer%20um%20pedido.`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-4 rounded-full bg-white hover:bg-zinc-100 text-zinc-900 border border-[#E0DBD0] font-bold text-xs uppercase tracking-widest transition-all shadow-2xs cursor-pointer flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-[#E86319]" />
                <span>Fazer Pedido</span>
              </a>
            </div>

            {/* Fast info strip */}
            <div className="pt-6 border-t border-[#EAE5DC] flex flex-wrap items-center gap-8 text-xs text-zinc-500 font-medium">
              <div>
                <span className="block font-bold text-zinc-900 text-sm">Nuras – Hotel Estrela</span>
                <span className="text-[11px]">Tete, Moçambique</span>
              </div>
              <div className="w-px h-8 bg-zinc-200 hidden sm:block"></div>
              <div>
                <span className="block font-bold text-zinc-900 text-sm">Terça a Domingo</span>
                <span className="text-[11px]">Cozinha & Takeaway</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 aspect-[4/3] sm:aspect-[16/11]">
              <img
                src="https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=1200&auto=format&fit=crop&q=85"
                alt="Frango Assado no Carvão de Tete"
                className="w-full h-full object-cover editorial-img"
                loading="eager"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Floating gastronomic badge */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#E86319] block">
                    Especialidade da Brasa
                  </span>
                  <h3 className="font-serif text-base font-bold text-white">
                    Frango Assado no Carvão
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 block font-sans">A partir de</span>
                  <span className="text-lg font-black text-white font-sans">500 MT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
