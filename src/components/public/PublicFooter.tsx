import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { BaliLogo } from '../common/BaliLogo';
import { Lock, Phone, MapPin, Instagram, Facebook } from 'lucide-react';

interface PublicFooterProps {
  onAdminClick?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onAdminClick,
  onNavigateSection,
}) => {
  const { config } = useRestaurant();

  const handleNav = (sectionId: string) => {
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-[#1C1917] text-white pt-16 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand and Tagline */}
          <div className="md:col-span-5 space-y-4">
            <BaliLogo variant="horizontal" size="sm" />
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed font-sans pt-2">
              Restaurante e serviço de catering em Tete, Moçambique. Grelhados autênticos no carvão, hambúrgueres artesanais e eventos inesquecíveis.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#E86319] block">
              Navegação
            </span>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li>
                <button
                  onClick={() => handleNav('menu')}
                  className="hover:text-[#E86319] transition-colors cursor-pointer"
                >
                  Cardápio Completo
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('destaque')}
                  className="hover:text-[#E86319] transition-colors cursor-pointer"
                >
                  Prato de Assinatura
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('dobrada')}
                  className="hover:text-[#E86319] transition-colors cursor-pointer"
                >
                  Dia de Dobrada (Dom & Seg)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('galeria')}
                  className="hover:text-[#E86319] transition-colors cursor-pointer"
                >
                  Galeria Gastronómica
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('servicos')}
                  className="hover:text-[#E86319] transition-colors cursor-pointer"
                >
                  Aluguer de Máquinas & Catering
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="md:col-span-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#E86319] block">
              Contactos & Horário
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              <strong className="text-white">Local:</strong> {config.location}
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              <strong className="text-white">Telefones:</strong> {config.phones.join(' • ')}
            </p>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              <strong className="text-white">Horário:</strong> {config.openingHoursWeekday}
            </p>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-sans">
          <p>© {new Date().getFullYear()} Bali Catering Service. Todos os direitos reservados. Tete, Moçambique.</p>

          <div className="flex items-center gap-6">
            {/* Discrete Admin Link with Lock Icon */}
            {onAdminClick && (
              <button
                onClick={onAdminClick}
                className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 transition-colors text-[11px] font-medium cursor-pointer"
                title="Acesso reservado à gerência"
              >
                <Lock className="w-3 h-3 text-[#E86319]" />
                <span>Acesso Gerência</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
