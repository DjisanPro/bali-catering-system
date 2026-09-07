import React from 'react';

export const PublicHighlightsBar: React.FC = () => {
  const highlights = [
    {
      title: '24H',
      subtitle: 'Aberto quase todo o dia',
    },
    {
      title: 'TAKEAWAY',
      subtitle: 'Peça e leve consigo pronto',
    },
    {
      title: 'TETE',
      subtitle: 'Nuras – Hotel Estrela',
    },
    {
      title: 'BRASA',
      subtitle: 'Grelhados 100% no carvão',
    },
  ];

  return (
    <section className="reveal border-y border-[#EAE5DC] bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-[#EAE5DC]">
          {highlights.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col items-center text-center justify-center ${
                index > 0 ? 'pt-4 sm:pt-0' : ''
              } ${index % 2 === 1 ? 'border-l sm:border-l-0 pl-3 sm:pl-0' : ''}`}
            >
              <span className="font-serif font-black text-2xl sm:text-3xl text-zinc-950 tracking-tight text-[#E86319]">
                {item.title}
              </span>
              <span className="text-xs text-zinc-500 font-medium mt-0.5 tracking-wide">
                {item.subtitle}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
