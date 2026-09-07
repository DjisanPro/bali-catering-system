import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { ArrowRight, MessageSquare, Clock, MapPin } from 'lucide-react';

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
    <section id="hero" className="reveal relative overflow-hidden bg-[#FAF8F5]">
      {/* Ambient background glow — subtle warm radial */}
      <div
        aria-hidden="true"
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.13] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #E86319 0%, transparent 65%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 md:pt-20 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Editorial Content */}
          <div className="lg:col-span-6 space-y-7 text-left">
            <div className="inline-block">
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#E86319] bg-white/70 px-4 py-1.5 rounded-full border border-[#EAD9C8] shadow-2xs">
                Bali Catering Service · Tete
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-serif font-black text-[#1C1917] leading-[1.05] tracking-tight">
              Sabor que faz{' '}
              <span className="italic font-medium text-[#E86319]">voltar.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#57534E] leading-relaxed max-w-lg font-sans">
              Grelhados no carvão, hambúrgueres artesanais, sandes de carne assada e doces regionais de Malambe. A autêntica tradição gastronómica servida com dedicação em Tete.
            </p>

            {/* CTAs — primary + secondary */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                onClick={onExploreMenu || (() => handleScroll('menu'))}
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-[#E86319] hover:bg-[#C74F0E] text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_8px_24px_-6px_rgb(232_99_25/0.4)] hover:shadow-[0_12px_28px_-6px_rgb(232_99_25/0.5)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
              >
                <span>Ver Menu</span>
                <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>

              <a
                href={`https://wa.me/${config.whatsappPrimary}?text=Ol%C3%A1%20Bali%20Catering!%20Gostaria%20de%20fazer%20um%20pedido.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full bg-white hover:bg-[#FAF8F5] text-[#1C1917] border border-[#E5DED2] font-bold text-xs uppercase tracking-widest transition-all shadow-2xs hover:shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#E86319]" />
                <span>Fazer Pedido</span>
              </a>
            </div>

            {/* Fast info strip — hairline separated */}
            <div className="pt-6 border-t border-[#EAE5DC] flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-[#57534E] font-medium">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#E86319]" />
                <div>
                  <span className="block font-bold text-[#1C1917] text-sm">Nuras, Hotel Estrela</span>
                  <span className="text-[11px]">Tete, Moçambique</span>
                </div>
              </div>
              <div className="w-px h-8 bg-[#E5DED2] hidden sm:block"></div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#E86319]" />
                <div>
                  <span className="block font-bold text-[#1C1917] text-sm">Terça a Domingo</span>
                  <span className="text-[11px]">Cozinha & Takeaway</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Hero Image with Double-Bezel frame */}
          <div className="lg:col-span-6">
            <div className="p-2.5 rounded-[2.25rem] bg-[#1C1917]/[0.03] border border-[#1C1917]/[0.06]">
              <div className="relative rounded-[2rem] overflow-hidden bg-[#1C1917] aspect-[4/3] sm:aspect-[16/12] shadow-[0_24px_60px_-15px_rgb(28_25_23/0.35)]">
                <img
                  src="https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=1200&auto=format&fit=crop&q=85"
                  alt="Frango Assado no Carvão de Tete"
                  className="w-full h-full object-cover editorial-img"
                  loading="eager"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/70 via-transparent to-transparent"></div>

                {/* Floating gastronomic badge — glass */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-[#1C1917]/80 backdrop-blur-md border border-white/10 text-white flex items-center justify-between">
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
                    <span className="text-lg font-black text-white font-sans tabular-nums">500 MT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating secondary badge — rotated accent */}
            <div className="hidden md:flex absolute -bottom-4 left-8 rotate-[-3deg] px-5 py-3 rounded-2xl bg-white border border-[#EAD9C8] shadow-lg items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-[#E86319]">Grelhados 100%</span>
                <span className="text-xs font-bold text-[#1C1917]">no carvão</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};