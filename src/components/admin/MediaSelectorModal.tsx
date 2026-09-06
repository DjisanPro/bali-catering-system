import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '../../types';
import { storageService, validateImageFile } from '../../services/storageService';
import {
  X,
  Upload,
  Search,
  Check,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

interface MediaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaUrl: string, altText?: string) => void;
  title?: string;
}

export const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Selecionar Imagem da Biblioteca',
}) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [selectedAlt, setSelectedAlt] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      storageService.getMediaLibrary().then((items) => {
        if (items.length > 0) {
          setMediaList(items);
        } else {
          // Fallback presets if empty
          setMediaList([
            {
              id: 'MED-P1',
              fileName: 'frango-assado-carvao.jpg',
              fileUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=900&auto=format&fit=crop&q=85',
              fileType: 'image/jpeg',
              fileSize: 420000,
              uploadedBy: 'Sistema',
              altText: 'Frango Assado no Carvão Inteiro',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'MED-P2',
              fileName: 'bali-burger-gourmet.jpg',
              fileUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&auto=format&fit=crop&q=85',
              fileType: 'image/jpeg',
              fileSize: 520000,
              uploadedBy: 'Sistema',
              altText: 'Bali Burger Especial',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'MED-P3',
              fileName: 'sandes-carne-assada.jpg',
              fileUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&auto=format&fit=crop&q=85',
              fileType: 'image/jpeg',
              fileSize: 310000,
              uploadedBy: 'Sistema',
              altText: 'Sandes de Carne Assada',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'MED-P4',
              fileName: 'hero-banner-bali.jpg',
              fileUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=85',
              fileType: 'image/jpeg',
              fileSize: 890000,
              uploadedBy: 'Sistema',
              altText: 'Ambiente Gourmet Bali',
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error || 'Ficheiro inválido.');
      return;
    }

    try {
      setIsUploading(true);
      const newMedia = await storageService.uploadImage(file, 'Administrador');
      setMediaList((prev) => [newMedia, ...prev]);
      setSelectedUrl(newMedia.fileUrl);
      setSelectedAlt(newMedia.altText || file.name);
    } catch (err: any) {
      alert(err.message || 'Erro no upload.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl, selectedAlt);
      onClose();
    }
  };

  const filteredMedia = mediaList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.fileName.toLowerCase().includes(q) || (m.altText && m.altText.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
      />

      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 text-base">{title}</h3>
            <p className="text-xs text-slate-500">Escolha uma fotografia da biblioteca ou faça upload imediato.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar: Upload & Search */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-[#F27D26] hover:bg-[#d96716] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'A Enviar...' : 'Novo Upload'}</span>
          </button>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar imagem..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#F27D26]"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[400px] border border-slate-100 rounded-2xl p-2">
          {filteredMedia.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <ImageIcon className="w-8 h-8 mb-2" />
              <p className="text-xs">Nenhuma imagem correspondente</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {filteredMedia.map((item) => {
                const isSelected = selectedUrl === item.fileUrl;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedUrl(item.fileUrl);
                      setSelectedAlt(item.altText || item.fileName);
                    }}
                    className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer border transition-all ${
                      isSelected
                        ? 'border-[#F27D26] ring-3 ring-[#F27D26]/40 shadow-sm scale-[0.98]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={item.fileUrl}
                      alt={item.altText || item.fileName}
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-[#F27D26] text-white p-1 rounded-full shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-1.5 pt-4 text-[10px] text-white font-medium truncate">
                      {item.fileName}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
          <span className="text-xs text-slate-500">
            {selectedUrl ? '1 imagem selecionada' : 'Nenhuma imagem selecionada'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selectedUrl}
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-[#F27D26] hover:bg-[#d96716] text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Confirmar Seleção
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
