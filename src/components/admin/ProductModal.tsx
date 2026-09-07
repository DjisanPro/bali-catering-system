import React, { useState, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Product, RecipeIngredient } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Flame,
  Layers,
  Check,
  Calendar,
  DollarSign,
  Clock,
  Tag,
  FileText,
  Percent,
} from 'lucide-react';

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
}

// Curated high-res culinary image presets with categorized collections
const FOOD_PHOTO_PRESETS = [
  {
    category: 'Grelhados & Carnes',
    items: [
      {
        label: 'Frango Assado no Carvão Inteiro',
        url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Meio Frango Grelhado com Fritas',
        url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Bife à Bali com Molho Cremoso',
        url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Costeletas / Espetadas Suculentas',
        url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&auto=format&fit=crop&q=85',
      },
    ],
  },
  {
    category: 'Hambúrgueres Artesanais',
    items: [
      {
        label: 'Bali Burger Especial (180g Bacon & Ovo)',
        url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Classic Double Cheeseburger',
        url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Crispy Chicken Burger Dourado',
        url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Smash Burger com Queijo Derretido',
        url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=900&auto=format&fit=crop&q=85',
      },
    ],
  },
  {
    category: 'Sanduíches & Tostas',
    items: [
      {
        label: 'Sandes de Carne Assada Baguete',
        url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Sandes de Frango Grelhado',
        url: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Sandes de Omelete com Queijo',
        url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Tosta Mista Queijo e Fiambre',
        url: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Tosta de Queijo e Tomate com Orégano',
        url: 'https://images.unsplash.com/photo-1621800043295-a73fe2f76e2c?w=900&auto=format&fit=crop&q=85',
      },
    ],
  },
  {
    category: 'Tradicionais & Dobrada',
    items: [
      {
        label: 'Dobrada Tradicional com Feijão Branco',
        url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Caldeirada Moçambicana / Guisado',
        url: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=900&auto=format&fit=crop&q=85',
      },
    ],
  },
  {
    category: 'Sobremesas & Malambe',
    items: [
      {
        label: 'Mousse de Malambe Tradicional (Baobab)',
        url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Pudim de Leite Condensado Caseiro',
        url: 'https://images.unsplash.com/photo-1517427294546-5aa121f68e8a?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Gelado Artesanal & Sobremesa Fina',
        url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=900&auto=format&fit=crop&q=85',
      },
    ],
  },
  {
    category: 'Bebidas & Sumos',
    items: [
      {
        label: 'Sumo Natural de Malambe Gelado',
        url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Sumo Natural de Maracujá Fresco',
        url: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Refrigerante Lata Gelado',
        url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Chá Gelado com Limão e Hortelã',
        url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Água Mineral Natural 500ml',
        url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=900&auto=format&fit=crop&q=85',
      },
    ],
  },
  {
    category: 'Eventos & Equipamentos',
    items: [
      {
        label: 'Aluguer de Máquina de Gelados Soft',
        url: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Aluguer de Máquina de Pipocas Cinema',
        url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=900&auto=format&fit=crop&q=85',
      },
      {
        label: 'Serviço de Buffet & Catering para Eventos',
        url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=900&auto=format&fit=crop&q=85',
      },
    ],
  },
];

const DAYS_OF_WEEK = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { categories, ingredients, createProduct, updateProduct, showToast } = useRestaurant();

  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '250');
  const [imageUrl, setImageUrl] = useState(
    product?.imageUrl || FOOD_PHOTO_PRESETS[0].items[0].url
  );
  const [preparationTimeMinutes, setPreparationTimeMinutes] = useState(
    product?.preparationTimeMinutes?.toString() || '15'
  );
  const [isAvailable, setIsAvailable] = useState(product ? product.isAvailable : true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured || false);
  const [isSpecialty, setIsSpecialty] = useState(product?.isSpecialty || false);
  const [isSeasonal, setIsSeasonal] = useState(product?.isSeasonal || false);
  const [availabilityDays, setAvailabilityDays] = useState<string[]>(
    product?.availabilityDays || ['Domingo', 'Segunda']
  );

  // Photo studio active tab
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>(
    FOOD_PHOTO_PRESETS[0].category
  );
  const [activePhotoTab, setActivePhotoTab] = useState<'presets' | 'url' | 'upload'>('presets');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recipe ingredients
  const [recipe, setRecipe] = useState<RecipeIngredient[]>(product?.ingredients || []);
  const [selectedIngId, setSelectedIngId] = useState('');
  const [ingQuantity, setIngQuantity] = useState('1');

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A foto deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          showToast('Foto Carregada', 'Foto do produto selecionada com sucesso.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDayToggle = (day: string) => {
    setAvailabilityDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddIngredient = () => {
    if (!selectedIngId) return;
    const ing = ingredients.find((i) => i.id === selectedIngId);
    if (!ing) return;

    const existingIdx = recipe.findIndex((r) => r.ingredientId === selectedIngId);
    const qty = parseFloat(ingQuantity) || 1;

    if (existingIdx >= 0) {
      setRecipe((prev) =>
        prev.map((r, idx) => (idx === existingIdx ? { ...r, quantity: qty } : r))
      );
    } else {
      setRecipe((prev) => [
        ...prev,
        {
          ingredientId: ing.id,
          ingredientName: ing.name,
          unit: ing.unit,
          quantity: qty,
        },
      ]);
    }

    setSelectedIngId('');
    setIngQuantity('1');
  };

  const handleRemoveIngredient = (ingId: string) => {
    setRecipe((prev) => prev.filter((r) => r.ingredientId !== ingId));
  };

  // Calculated cost
  const calculatedCost = recipe.reduce((total, r) => {
    const ing = ingredients.find((i) => i.id === r.ingredientId);
    return total + (ing ? ing.costPerUnit * r.quantity : 0);
  }, 0);

  const numPrice = parseFloat(price) || 0;
  const grossMargin =
    numPrice > 0 ? Math.round(((numPrice - calculatedCost) / numPrice) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numPrep = parseInt(preparationTimeMinutes) || 10;

    if (product) {
      const ok = updateProduct(product.id, {
        name: name.trim(),
        categoryId,
        description: description.trim(),
        price: numPrice,
        costPrice: Math.round(calculatedCost),
        imageUrl: imageUrl.trim(),
        preparationTimeMinutes: numPrep,
        isAvailable,
        isFeatured,
        isSpecialty,
        isSeasonal,
        availabilityDays: isSeasonal ? availabilityDays : undefined,
        ingredients: recipe,
      });
      if (!ok) return;
    } else {
      const created = createProduct({
        name: name.trim(),
        categoryId,
        description: description.trim(),
        price: numPrice,
        costPrice: Math.round(calculatedCost),
        imageUrl: imageUrl.trim(),
        preparationTimeMinutes: numPrep,
        isAvailable,
        isFeatured,
        isSpecialty,
        isSeasonal,
        availabilityDays: isSeasonal ? availabilityDays : undefined,
        ingredients: recipe,
      });
      if (!created) return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-orange-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#E86319] border border-orange-200 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 tracking-tight">
                {product ? 'Editar Prato / Produto do Cardápio' : 'Cadastrar Novo Prato / Produto'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Gestão completa de preços, fotografia, ficha técnica e disponibilidade.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1 scrollbar-thin">
          {/* Section 1: Main Details */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#E86319] flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>1. Informações Principais do Produto</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Nome do Prato / Produto *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Bali Burger Especial (180g)"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Categoria no Menu *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white text-slate-800"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-800 font-bold mb-1">
                  Preço de Venda (MT) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    MT
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="5"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="350"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-[#E86319] focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Tempo Estimado de Preparo</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    value={preparationTimeMinutes}
                    onChange={(e) => setPreparationTimeMinutes(e.target.value)}
                    placeholder="15"
                    className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    min
                  </span>
                </div>
              </div>

              {/* Profit Margin Preview Box */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Margem Bruta Estimada
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span
                    className={`font-black text-sm ${
                      grossMargin >= 50
                        ? 'text-emerald-600'
                        : grossMargin >= 30
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  >
                    {grossMargin}%
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Custo CMV: {Math.round(calculatedCost)} MT
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Descrição Gastronómica & Detalhes do Prato
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o método de confeção (ex: grelhado no carvão de Tete), corte da carne, acompanhamentos inclusos..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Photo Studio & Presets */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#E86319] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>2. Fotografia do Prato / Galeria em Alta Definição</span>
              </h4>

              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('presets')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    activePhotoTab === 'presets'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Galeria Curada
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('upload')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                    activePhotoTab === 'upload'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Carregar do Dispositivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhotoTab('url')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    activePhotoTab === 'url'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Link Web
                </button>
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="flex flex-col sm:flex-row gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200 shadow-2xs">
                <img
                  src={imageUrl}
                  alt="Pré-visualização"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                  Foto Ativa
                </span>
              </div>

              <div className="flex-1 space-y-2">
                {activePhotoTab === 'presets' && (
                  <div className="space-y-2">
                    {/* Category Selector Tabs */}
                    <div className="flex flex-wrap gap-1.5">
                      {FOOD_PHOTO_PRESETS.map((cat) => (
                        <button
                          key={cat.category}
                          type="button"
                          onClick={() => setSelectedPhotoCategory(cat.category)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            selectedPhotoCategory === cat.category
                              ? 'bg-[#E86319] text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat.category}
                        </button>
                      ))}
                    </div>

                    {/* Preset Photos Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {FOOD_PHOTO_PRESETS.find(
                        (c) => c.category === selectedPhotoCategory
                      )?.items.map((item) => {
                        const isSelected = imageUrl === item.url;
                        return (
                          <div
                            key={item.url}
                            onClick={() => setImageUrl(item.url)}
                            className={`relative rounded-lg overflow-hidden border-2 cursor-pointer group h-16 transition-all ${
                              isSelected
                                ? 'border-[#E86319] ring-2 ring-orange-200 scale-95'
                                : 'border-transparent hover:border-orange-300'
                            }`}
                          >
                            <img
                              src={item.url}
                              alt={item.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              referrerPolicy="no-referrer"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-orange-600/30 flex items-center justify-center">
                                <Check className="w-5 h-5 text-white font-bold" />
                              </div>
                            )}
                            <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent text-[8px] font-bold text-white px-1 py-0.5 truncate">
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePhotoTab === 'upload' && (
                  <div className="space-y-2 py-2">
                    <p className="text-[11px] text-slate-600">
                      Selecione uma fotografia gastronómica guardada no seu computador, tablet ou telemóvel.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:border-orange-500 text-slate-800 font-bold text-xs flex items-center gap-2 shadow-2xs cursor-pointer hover:bg-orange-50/50 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-[#E86319]" />
                      <span>Escolher Ficheiro de Imagem</span>
                    </button>
                  </div>
                )}

                {activePhotoTab === 'url' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Endereço URL Direto da Fotografia
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white font-mono"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Status & Special Badges */}
          <div className="space-y-3 pt-2">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#E86319] flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. Estado Operacional & Destaques de Marketing</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-orange-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Disponível para Venda</span>
                  <span className="text-[10px] text-slate-500">Exibido no cardápio público</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-orange-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Destaque na Home</span>
                  <span className="text-[10px] text-slate-500">Aparece na secção inicial</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-orange-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={isSpecialty}
                  onChange={(e) => setIsSpecialty(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Especialidade Bali</span>
                  <span className="text-[10px] text-slate-500">Selo dourado de assinatura</span>
                </div>
              </label>
            </div>

            {/* Seasonal Dishes Option */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSeasonal}
                  onChange={(e) => setIsSeasonal(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded cursor-pointer"
                />
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Prato Sazonal / Disponível apenas em dias específicos (ex: Dobrada)</span>
                </span>
              </label>

              {isSeasonal && (
                <div className="pt-2 border-t border-amber-200/60">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                    Dias da Semana em que este prato é servido:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = availabilityDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Recipe & Stock Consumption */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div>
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#E86319] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>4. Ficha Técnica & Dedução Automática de Estoque</span>
                </h4>
                <p className="text-[10px] text-slate-500">
                  Defina os insumos consumidos para baixar automaticamente o estoque ao confirmar pedidos.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold">Custo CMV Total:</span>
                <span className="font-black text-slate-900 text-xs font-mono">
                  {Math.round(calculatedCost)} MT
                </span>
              </div>
            </div>

            {/* Add ingredient controls */}
            <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <select
                value={selectedIngId}
                onChange={(e) => setSelectedIngId(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium"
              >
                <option value="">Selecione um insumo para adicionar...</option>
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit}) — Custo: {ing.costPerUnit} MT/{ing.unit} (Estoque: {ing.currentStock} {ing.unit})
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                min="0.001"
                value={ingQuantity}
                onChange={(e) => setIngQuantity(e.target.value)}
                placeholder="Qtd"
                className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-xs text-center font-bold"
              />

              <button
                type="button"
                onClick={handleAddIngredient}
                disabled={!selectedIngId}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Adicionar Insumo
              </button>
            </div>

            {/* Current recipe ingredients list */}
            {recipe.length > 0 ? (
              <div className="space-y-1.5">
                {recipe.map((r) => {
                  const ing = ingredients.find((i) => i.id === r.ingredientId);
                  const lineCost = ing ? Math.round(ing.costPerUnit * r.quantity) : 0;
                  return (
                    <div
                      key={r.ingredientId}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-orange-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#E86319]"></span>
                        <span className="font-bold text-slate-800">{r.ingredientName}</span>
                        <span className="text-slate-500 font-medium ml-1 bg-slate-100 px-2 py-0.5 rounded-md text-[10px]">
                          {r.quantity} {r.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700 font-mono">{lineCost} MT</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(r.ingredientId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remover insumo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic p-2 bg-slate-50/50 rounded-xl text-center border border-dashed border-slate-200">
                Nenhum ingrediente configurado. A dedução de estoque será manual para este item.
              </p>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-xs py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#E86319] hover:bg-orange-600 text-white font-bold shadow-md hover:shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{product ? 'Salvar Alterações' : 'Cadastrar Produto no Cardápio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
