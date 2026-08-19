import React, { useState } from 'react';
import { Camera, Sparkles, Image as ImageIcon } from 'lucide-react';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  src: string;
  aspect: 'tall' | 'wide' | 'square' | 'large';
  caption: string;
}

const EDITORIAL_PHOTOS: GalleryItem[] = [
  {
    id: '1',
    title: 'Grelhados no Carvão',
    category: 'Cozinha da Brasa',
    src: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=85',
    aspect: 'large',
    caption: 'Fogo real, cortes nobres marinados e o ponto perfeito.',
  },
  {
    id: '2',
    title: 'Sandes de Carne Assada',
    category: 'Lanches Artesanais',
    src: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=85',
    aspect: 'tall',
    caption: 'Pão rústico crocante e fatias tenras de carne grelhada.',
  },
  {
    id: '3',
    title: 'Mousse de Malambe Tradicional',
    category: 'Sobremesas de Tete',
    src: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=85',
    aspect: 'square',
    caption: 'O sabor autêntico do fruto de embondeiro.',
  },
  {
    id: '4',
    title: 'Hambúrguer Artesanal Bali',
    category: 'Especialidades',
    src: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&auto=format&fit=crop&q=85',
    aspect: 'wide',
    caption: 'Hambúrguer suculento com bacon estaladiço e queijo cheddar.',
  },
  {
    id: '5',
    title: 'Sumos Naturais e Cerveja 2M',
    category: 'Bebidas Frescas',
    src: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=85',
    aspect: 'square',
    caption: 'Sumo de malambe bem gelado para o calor de Tete.',
  },
  {
    id: '6',
    title: 'Serviço Completo de Catering',
    category: 'Eventos & Festas',
    src: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=1000&auto=format&fit=crop&q=85',
    aspect: 'wide',
    caption: 'Buffets impecáveis e máquinas de entretenimento para celebrações.',
  },
];

// Lazy-loaded Image component with smooth fade-in
const LazyEditorialImage: React.FC<{ item: GalleryItem; className?: string }> = ({
  item,
  className = '',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-[#EAE5DC] group ${className}`}>
      <img
        src={item.src}
        alt={item.title}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-700 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        } group-hover:scale-105`}
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#E86319] block">
          {item.category}
        </span>
        <h4 className="font-serif text-lg font-bold text-white">{item.title}</h4>
        <p className="text-xs text-zinc-300 mt-1 line-clamp-2">{item.caption}</p>
      </div>
    </div>
  );
};

export const PublicEditorialGallery: React.FC = () => {
  return (
    <section id="galeria" className="py-20 md:py-28 bg-[#FAF8F5] border-b border-[#EAE5DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#E86319] block">
              Galeria de Destaque
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-zinc-950 tracking-tight">
              A essência dos nossos pratos.
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-zinc-500 max-w-md font-sans leading-relaxed">
            Fotografias reais das nossas especialidades confeccionadas diariamente em Tete com rigor e paixão gastronómica.
          </p>
        </div>

        {/* Asymmetrical Editorial Masonry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          {/* Item 1: Big Hero Photo (Large - 7 cols) */}
          <div className="md:col-span-7 rounded-3xl overflow-hidden shadow-sm aspect-[16/11]">
            <LazyEditorialImage item={EDITORIAL_PHOTOS[0]} className="w-full h-full" />
          </div>

          {/* Item 2: Tall Vertical Photo (5 cols) */}
          <div className="md:col-span-5 rounded-3xl overflow-hidden shadow-sm aspect-[4/5]">
            <LazyEditorialImage item={EDITORIAL_PHOTOS[1]} className="w-full h-full" />
          </div>

          {/* Item 3: Square Photo (4 cols) */}
          <div className="md:col-span-4 rounded-3xl overflow-hidden shadow-sm aspect-square">
            <LazyEditorialImage item={EDITORIAL_PHOTOS[2]} className="w-full h-full" />
          </div>

          {/* Item 4: Wide Photo (4 cols) */}
          <div className="md:col-span-4 rounded-3xl overflow-hidden shadow-sm aspect-square">
            <LazyEditorialImage item={EDITORIAL_PHOTOS[3]} className="w-full h-full" />
          </div>

          {/* Item 5: Square/Wide Photo (4 cols) */}
          <div className="md:col-span-4 rounded-3xl overflow-hidden shadow-sm aspect-square">
            <LazyEditorialImage item={EDITORIAL_PHOTOS[4]} className="w-full h-full" />
          </div>

          {/* Item 6: Full-width Wide Event Catering Showcase (12 cols) */}
          <div className="md:col-span-12 rounded-3xl overflow-hidden shadow-sm aspect-[21/9] sm:aspect-[24/9]">
            <LazyEditorialImage item={EDITORIAL_PHOTOS[5]} className="w-full h-full" />
          </div>
        </div>
      </div>
    </section>
  );
};
