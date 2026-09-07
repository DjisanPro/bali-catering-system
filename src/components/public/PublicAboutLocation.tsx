import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MapPin, Phone, MessageSquare, Clock, Navigation, ExternalLink } from 'lucide-react';

export const PublicAboutLocation: React.FC = () => {
  const { config } = useRestaurant();

  return (
    <div>
      {/* 13. About Section (Editorial Split with generous space) */}
      <section className="reveal py-20 md:py-28 bg-white border-b border-[#EAE5DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: True culinary ethos & text */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E86319] block">
                Nossa Proposta
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-zinc-950 leading-tight">
                Culinária feita com rigor, brasa e carinho.
              </h2>

              <p className="text-base text-zinc-600 leading-relaxed font-sans">
                O <strong>Bali Catering Service</strong> nasceu com uma missão clara: servir comida saborosa, bem preparada e com atendimento de excelência em Tete.
              </p>

              <p className="text-sm text-zinc-600 leading-relaxed font-sans">
                Seja para um almoço rápido, um lanche de fim de tarde ou o serviço completo de catering para o seu evento, o nosso compromisso é oferecer pratos com ingredientes frescos, grelhados no carvão de verdade e sabor inconfundível.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-8 text-xs text-zinc-500 font-medium">
                <div>
                  <span className="block font-bold text-zinc-900 text-sm">Grelhados a Carvão</span>
                  <span className="text-[11px]">Sabor autêntico</span>
                </div>
                <div className="w-px h-8 bg-zinc-200"></div>
                <div>
                  <span className="block font-bold text-zinc-900 text-sm">Catering & Eventos</span>
                  <span className="text-[11px]">Estrutura completa</span>
                </div>
              </div>
            </div>

            {/* Right Column: High-End Food Preparation Image */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl overflow-hidden shadow-lg aspect-[4/3] bg-zinc-100">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=85"
                  alt="Preparo dos grelhados Bali Catering"
                  loading="lazy"
                  className="w-full h-full object-cover editorial-img hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 14. Location & 15. Contacts (Encontre-nos em Tete) */}
      <section id="localizacao" className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#EAE5DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E86319] block">
              Venha Conhecer-nos
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-zinc-950 tracking-tight">
              Encontre-nos em Tete.
            </h2>
            <p className="text-xl sm:text-2xl font-serif text-zinc-800 font-medium pt-2">
              Nuras – Hotel Estrela, Cidade de Tete
            </p>
            <p className="text-xs sm:text-sm text-zinc-500 font-sans max-w-lg mx-auto">
              Estamos situados no coração de Tete, com ambiente acolhedor, serviço de takeaway rápido e atendimento dedicado.
            </p>
          </div>

          {/* Simple, Non-SaaS Clean Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            {/* Address & Directions */}
            <div className="bg-white p-6 rounded-3xl border border-[#EAE5DC] text-center flex flex-col justify-between">
              <div className="space-y-2">
                <MapPin className="w-6 h-6 text-[#E86319] mx-auto" />
                <h4 className="font-serif font-bold text-base text-zinc-950">Endereço</h4>
                <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                  {config.location}
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#EAE5DC]">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    'Nuras Hotel Estrela Tete Mozambique'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E86319] hover:underline"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Como chegar no Google Maps</span>
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white p-6 rounded-3xl border border-[#EAE5DC] text-center flex flex-col justify-between">
              <div className="space-y-2">
                <Clock className="w-6 h-6 text-[#E86319] mx-auto" />
                <h4 className="font-serif font-bold text-base text-zinc-950">Horário</h4>
                <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                  {config.openingHoursWeekday}
                  <br />
                  {config.openingHoursWeekend}
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#EAE5DC]">
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Cozinha & Takeaway Abertos
                </span>
              </div>
            </div>

            {/* Direct Phone & WhatsApp */}
            <div className="bg-white p-6 rounded-3xl border border-[#EAE5DC] text-center flex flex-col justify-between">
              <div className="space-y-2">
                <Phone className="w-6 h-6 text-[#E86319] mx-auto" />
                <h4 className="font-serif font-bold text-base text-zinc-950">Contactos</h4>
                <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                  {config.phones.join(' • ')}
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#EAE5DC]">
                <a
                  href={`https://wa.me/${config.whatsappPrimary}?text=Ol%C3%A1%20Bali%20Catering!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E86319] hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chamar no WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
