import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { BaliLogo } from '../common/BaliLogo';
import { ShoppingBag, Menu as MenuIcon, X, Phone } from 'lucide-react';

interface PublicHeaderProps {
  onOpenCart?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ onOpenCart, onNavigateSection }) => {
  const { config, cartTotalItems, setIsCartOpen } = useRestaurant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      setIsCartOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#EAE5DC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div
            onClick={() => handleNavClick('hero')}
            className="cursor-pointer py-1 select-none flex items-center gap-3"
          >
            <BaliLogo variant="horizontal" size="sm" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => handleNavClick('menu')}
              className="text-xs font-semibold uppercase tracking-widest text-zinc-700 hover:text-[#E86319] transition-colors cursor-pointer"
            >
              Cardápio
            </button>
            <button
              onClick={() => handleNavClick('destaque')}
              className="text-xs font-semibold uppercase tracking-widest text-zinc-700 hover:text-[#E86319] transition-colors cursor-pointer"
            >
              Especialidades
            </button>
            <button
              onClick={() => handleNavClick('dobrada')}
              className="text-xs font-semibold uppercase tracking-widest text-zinc-700 hover:text-[#E86319] transition-colors cursor-pointer"
            >
              Dia de Dobrada
            </button>
            <button
              onClick={() => handleNavClick('galeria')}
              className="text-xs font-semibold uppercase tracking-widest text-zinc-700 hover:text-[#E86319] transition-colors cursor-pointer"
            >
              Galeria
            </button>
            <button
              onClick={() => handleNavClick('servicos')}
              className="text-xs font-semibold uppercase tracking-widest text-zinc-700 hover:text-[#E86319] transition-colors cursor-pointer"
            >
              Eventos & Aluguer
            </button>
            <button
              onClick={() => handleNavClick('localizacao')}
              className="text-xs font-semibold uppercase tracking-widest text-zinc-700 hover:text-[#E86319] transition-colors cursor-pointer"
            >
              Localização
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              onClick={handleCartClick}
              className="relative p-2.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-800 border border-[#E5E0D6] shadow-2xs transition-all cursor-pointer flex items-center justify-center"
              aria-label="Ver sacola de pedidos"
            >
              <ShoppingBag className="w-4 h-4 text-zinc-800" />
              {cartTotalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E86319] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {cartTotalItems}
                </span>
              )}
            </button>

            {/* Primary Order CTA */}
            <button
              onClick={() => handleNavClick('menu')}
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#E86319] hover:bg-[#D45512] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer hover:shadow-[#E86319]/20"
            >
              Fazer Pedido
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#EAE5DC] space-y-2 bg-[#FAF8F5] animate-in fade-in slide-in-from-top-2 duration-200">
            <button
              onClick={() => handleNavClick('menu')}
              className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-white"
            >
              Cardápio Completo
            </button>
            <button
              onClick={() => handleNavClick('destaque')}
              className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-white"
            >
              Especialidades
            </button>
            <button
              onClick={() => handleNavClick('dobrada')}
              className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-white"
            >
              Dia de Dobrada
            </button>
            <button
              onClick={() => handleNavClick('galeria')}
              className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-white"
            >
              Galeria Gastronómica
            </button>
            <button
              onClick={() => handleNavClick('servicos')}
              className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-white"
            >
              Eventos & Aluguer
            </button>
            <button
              onClick={() => handleNavClick('localizacao')}
              className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-800 hover:bg-white"
            >
              Localização & Contactos
            </button>

            <div className="pt-2 px-4 flex flex-col gap-2">
              <a
                href={`tel:${config.phones[0]}`}
                className="w-full py-2.5 rounded-full border border-zinc-300 text-zinc-800 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-[#E86319]" />
                <span>Ligar: {config.phones[0]}</span>
              </a>
              <button
                onClick={() => handleNavClick('menu')}
                className="w-full py-3 rounded-full bg-[#E86319] text-white text-xs font-bold uppercase tracking-wider text-center"
              >
                Fazer Pedido Agora
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
