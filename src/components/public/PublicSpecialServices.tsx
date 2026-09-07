import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MessageSquare, Check, Sparkles, PartyPopper } from 'lucide-react';

export const PublicSpecialServices: React.FC = () => {
  const { config } = useRestaurant();

  const services = [
    {
      id: 'sorvete',
      name: 'Máquina de Gelados Soft',
      price: '3.000 MT',
      period: 'por evento / dia',
      imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&auto=format&fit=crop&q=85',
      features: ['Instalação e operador inclusos', 'Gelado cremoso estilo soft', 'Ideal para aniversários e feiras'],
    },
    {
      id: 'pipoca',
      name: 'Máquina de Pipocas Profissional',
      price: '2.500 MT',
      period: 'por evento / dia',
      imageUrl: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&auto=format&fit=crop&q=85',
      features: ['Pipocas quentinhas na hora', 'Milho e óleo vegetal incluídos', 'Carrinho temático clássico'],
    },
    {
      id: 'combo',
      name: 'Combo Festa (Gelados + Pipocas)',
      price: '4.500 MT',
      period: 'melhor oferta',
      isPopular: true,
      imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&auto=format&fit=crop&q=85',
      features: ['As 2 máquinas no seu evento', 'Economia de 1.000 MT', 'Atendimento completo durante o evento'],
    },
  ];

  return (
    <section id="servicos" className="reveal py-20 md:py-28 bg-[#FAF8F5] border-b border-[#EAE5DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E86319] block">
            Catering & Festas
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-zinc-950 tracking-tight">
            Também fazemos eventos.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-sans leading-relaxed">
            Aluguer de máquinas de entretenimento gastronómico e serviço completo de catering para casamentos, conferências e celebrações em Tete.
          </p>
        </div>

        {/* Services Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl bg-white p-6 border transition-all flex flex-col justify-between ${
                item.isPopular
                  ? 'border-[#E86319] shadow-md ring-1 ring-orange-200'
                  : 'border-[#EAE5DC] shadow-2xs hover:border-zinc-300'
              }`}
            >
              <div>
                {/* Photo */}
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-100 mb-5">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {item.isPopular && (
                    <span className="absolute top-3 right-3 bg-[#E86319] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs">
                      Mais Procurado
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-left">
                  <h3 className="font-serif font-bold text-xl text-zinc-950">{item.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-zinc-950 font-sans">{item.price}</span>
                    <span className="text-xs text-zinc-400 font-medium font-sans">{item.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 pt-4 mt-4 border-t border-[#EAE5DC] text-xs text-zinc-600">
                  {item.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#E86319] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-6 border-t border-[#EAE5DC]">
                <a
                  href={`https://wa.me/${config.whatsappPrimary}?text=Ol%C3%A1%20Bali%20Catering!%20Gostaria%20de%20reservar%20o%20servi%C3%A7o%20de%20${encodeURIComponent(
                    item.name
                  )}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    item.isPopular
                      ? 'bg-[#E86319] hover:bg-[#D45512] text-white shadow-sm'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Reservar via WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
