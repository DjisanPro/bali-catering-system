import React, { useState, useRef, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MediaItem } from '../../types';
import { storageService, validateImageFile, getImageDimensions } from '../../services/storageService';
import { formatDateTime } from '../../utils/formatters';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Copy,
  Check,
  Search,
  ExternalLink,
  Edit2,
  Save,
  X,
  AlertCircle,
  FileText,
  Maximize2,
  Filter,
  CheckCircle2,
} from 'lucide-react';

export const MediaLibraryView: React.FC = () => {
  const { showToast, currentUser, products, updateProduct } = useRestaurant();

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [altTextInput, setAltTextInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [assigningProductId, setAssigningProductId] = useState<string>('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [itemToReplace, setItemToReplace] = useState<MediaItem | null>(null);

  // Fallback culinary images if collection is currently empty
  const FALLBACK_DEFAULT_MEDIA: MediaItem[] = [
    {
      id: 'MED-PRESET-01',
      fileName: 'frango-assado-bali.jpg',
      fileUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=900&auto=format&fit=crop&q=85',
      fileType: 'image/jpeg',
      fileSize: 428000,
      mimeType: 'image/jpeg',
      width: 1200,
      height: 800,
      uploadedBy: 'Sistema Bali',
      altText: 'Frango Assado no Carvão Inteiro com Batatas e Salada',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'MED-PRESET-02',
      fileName: 'bali-special-burger.jpg',
      fileUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&auto=format&fit=crop&q=85',
      fileType: 'image/jpeg',
      fileSize: 580000,
      mimeType: 'image/jpeg',
      width: 1200,
      height: 900,
      uploadedBy: 'Sistema Bali',
      altText: 'Hambúrguer Artesanal Bali Especial com Queijo Cheddar',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'MED-PRESET-03',
      fileName: 'sandes-carne-baguete.jpg',
      fileUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&auto=format&fit=crop&q=85',
      fileType: 'image/jpeg',
      fileSize: 310000,
      mimeType: 'image/jpeg',
      width: 1080,
      height: 720,
      uploadedBy: 'Sistema Bali',
      altText: 'Sanduíche de Carne Assada em Pão Rústico',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'MED-PRESET-04',
      fileName: 'hero-banner-catering.jpg',
      fileUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=85',
      fileType: 'image/jpeg',
      fileSize: 890000,
      mimeType: 'image/jpeg',
      width: 1920,
      height: 1080,
      uploadedBy: 'Sistema Bali',
      altText: 'Ambiente Gourmet e Mesa de Degustação Bali Catering',
      createdAt: new Date().toISOString(),
    },
  ];

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const items = await storageService.getMediaLibrary();
      if (items.length > 0) {
        setMediaList(items);
      } else {
        setMediaList(FALLBACK_DEFAULT_MEDIA);
      }
    } catch (err) {
      console.warn('Error fetching media:', err);
      setMediaList(FALLBACK_DEFAULT_MEDIA);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(20);

    const file = files[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast('Ficheiro Inválido', validation.error || 'Erro na validação.', 'error');
      setIsUploading(false);
      return;
    }

    try {
      setUploadProgress(60);
      const newMedia = await storageService.uploadImage(
        file,
        currentUser?.name || 'Administrador',
        file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      );
      setUploadProgress(100);

      setMediaList((prev) => [newMedia, ...prev]);
      setSelectedItem(newMedia);
      showToast(
        'Upload Concluído',
        `Imagem "${file.name}" guardada no Firebase Storage e registada na Media Library.`,
        'success'
      );
    } catch (err: any) {
      console.error('Upload failed:', err);
      showToast('Erro no Upload', err.message || 'Não foi possível carregar o ficheiro.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReplaceImage = async (files: FileList | null) => {
    if (!files || files.length === 0 || !itemToReplace) return;

    const file = files[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast('Ficheiro Inválido', validation.error || 'Erro na validação.', 'error');
      return;
    }

    try {
      setIsUploading(true);
      const replacedMedia = await storageService.uploadImage(
        file,
        currentUser?.name || 'Administrador',
        itemToReplace.altText || file.name
      );

      // Remove old item from list & add new
      setMediaList((prev) => prev.map((m) => (m.id === itemToReplace.id ? replacedMedia : m)));
      setSelectedItem(replacedMedia);
      showToast('Imagem Substituída', `Imagem atualizada com o novo ficheiro "${file.name}".`, 'success');
    } catch (err: any) {
      showToast('Erro na Substituição', err.message || 'Falha ao substituir imagem.', 'error');
    } finally {
      setIsUploading(false);
      setItemToReplace(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = async (item: MediaItem) => {
    if (!window.confirm(`Tem a certeza que deseja eliminar a imagem "${item.fileName}"?`)) {
      return;
    }

    try {
      await storageService.deleteMedia(item);
      setMediaList((prev) => prev.filter((m) => m.id !== item.id));
      if (selectedItem?.id === item.id) setSelectedItem(null);
      showToast('Imagem Eliminada', 'O registo e o ficheiro foram removidos.', 'success');
    } catch (err) {
      showToast('Erro ao Eliminar', 'Não foi possível eliminar a imagem.', 'error');
    }
  };

  const handleSaveAltText = async (item: MediaItem) => {
    if (!altTextInput.trim()) return;
    try {
      await storageService.updateAltText(item.id, altTextInput.trim());
      setMediaList((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, altText: altTextInput.trim() } : m))
      );
      if (selectedItem?.id === item.id) {
        setSelectedItem((prev) => (prev ? { ...prev, altText: altTextInput.trim() } : null));
      }
      setEditingAltId(null);
      showToast('Texto Alternativo Salvo', 'Alt text atualizado com sucesso.', 'success');
    } catch (err) {
      showToast('Erro', 'Não foi possível atualizar o texto alternativo.', 'error');
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    showToast('Link Copiado', 'URL direto da imagem copiado para a área de transferência.');
  };

  const handleAssignToProduct = () => {
    if (!selectedItem || !assigningProductId) return;
    const targetProduct = products.find((p) => p.id === assigningProductId);
    if (!targetProduct) return;

    updateProduct(targetProduct.id, {
      imageUrl: selectedItem.fileUrl,
    });
    setIsAssignModalOpen(false);
    setAssigningProductId('');
    showToast(
      'Imagem Associada',
      `A imagem foi definida como foto principal do produto "${targetProduct.name}".`,
      'success'
    );
  };

  const filteredMedia = mediaList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.fileName.toLowerCase().includes(q) ||
      (m.altText && m.altText.toLowerCase().includes(q))
    );
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files)}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={replaceInputRef}
        onChange={(e) => handleReplaceImage(e.target.files)}
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-[#F27D26]">
              Firebase Storage
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Biblioteca de Mídia Oficial</span>
          </div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 mt-1">
            Gestão de Imagens & Media Library
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Faça upload, insira textos alternativos, consulte dimensões e associe fotos diretamente aos pratos do menu e ao CMS.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F27D26] hover:bg-[#d96716] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'A Carregar Imagem...' : 'Fazer Upload de Imagem'}</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Quick Area & Search Filter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="lg:col-span-2 border-2 border-dashed border-slate-200 hover:border-[#F27D26] bg-slate-50/50 hover:bg-orange-50/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#F27D26] flex items-center justify-center mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            Arraste e solte uma imagem aqui ou clique para selecionar
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Formatos aceites: JPG, PNG, WebP, GIF, SVG (Máximo 5MB por ficheiro)
          </p>
          {isUploading && (
            <div className="w-full max-w-xs mt-3">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#F27D26] h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Search & Stats Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pesquisar na Biblioteca
            </span>
            <div className="relative mt-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por nome ou alt text..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#F27D26]"
              />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total de Imagens:</span>
            <span className="font-bold text-slate-800">{mediaList.length} ficheiros</span>
          </div>
        </div>
      </div>

      {/* Main Grid & Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media Grid (2 columns on large) */}
        <div className="lg:col-span-2">
          {filteredMedia.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Nenhuma imagem encontrada</p>
              <p className="text-xs text-slate-400 mt-1">
                Tente uma pesquisa diferente ou faça o primeiro upload de fotografia.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredMedia.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setAltTextInput(item.altText || '');
                      setEditingAltId(null);
                    }}
                    className={`group relative bg-white rounded-xl border overflow-hidden cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#F27D26] ring-2 ring-[#F27D26]/30 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="aspect-square bg-slate-100 overflow-hidden relative">
                      <img
                        src={item.fileUrl}
                        alt={item.altText || item.fileName}
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Dimensions pill */}
                      {item.width && item.height && (
                        <div className="absolute bottom-1.5 left-1.5 bg-slate-950/70 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                          {item.width}×{item.height}
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-bold text-slate-800 truncate" title={item.fileName}>
                        {item.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center justify-between mt-0.5">
                        <span>{formatFileSize(item.fileSize)}</span>
                        <span>{item.fileType.split('/')[1]?.toUpperCase()}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Item Detail Inspector (Right Column) */}
        <div className="lg:col-span-1">
          {selectedItem ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 font-heading">
                  Detalhes do Ficheiro
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview with fallback */}
              <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
                <img
                  src={selectedItem.fileUrl}
                  alt={selectedItem.altText || selectedItem.fileName}
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Metadata specs */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nome:</span>
                  <span className="font-bold text-slate-800 max-w-[180px] truncate text-right">
                    {selectedItem.fileName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tipo MIME:</span>
                  <span className="font-mono text-slate-700">{selectedItem.mimeType || selectedItem.fileType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tamanho:</span>
                  <span className="font-bold text-slate-800">{formatFileSize(selectedItem.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dimensões:</span>
                  <span className="font-mono text-slate-700">
                    {selectedItem.width && selectedItem.height ? `${selectedItem.width} × ${selectedItem.height} px` : '800 × 600 px'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Enviado por:</span>
                  <span className="font-medium text-slate-700">{selectedItem.uploadedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Data:</span>
                  <span className="text-slate-700">{formatDateTime(selectedItem.createdAt)}</span>
                </div>
              </div>

              {/* Alt text editor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Texto Alternativo (Alt Text / Acessibilidade & SEO)
                </label>
                {editingAltId === selectedItem.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={altTextInput}
                      onChange={(e) => setAltTextInput(e.target.value)}
                      placeholder="Descreva o prato ou fotografia..."
                      className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F27D26]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveAltText(selectedItem)}
                      className="px-2.5 py-1.5 bg-[#F27D26] text-white text-xs font-bold rounded-lg hover:bg-[#d96716]"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                    <span className="text-slate-600 truncate mr-2">
                      {selectedItem.altText || <span className="italic text-slate-400">Sem texto alternativo</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAltId(selectedItem.id);
                        setAltTextInput(selectedItem.altText || '');
                      }}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                      title="Editar Alt Text"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(selectedItem.fileUrl, selectedItem.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {copiedId === selectedItem.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar URL Direto</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#F27D26]" />
                  <span>Associar a Produto do Cardápio</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setItemToReplace(selectedItem);
                      replaceInputRef.current?.click();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-500" />
                    <span>Substituir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMedia(selectedItem)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center text-slate-400">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">Selecione uma imagem na grelha para inspecionar dimensões, editar alt text ou associar a produtos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Associar Imagem a Produto */}
      {isAssignModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-extrabold text-slate-900 text-base">
                Associar Imagem a Produto
              </h3>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Definir esta imagem como fotografia principal para um prato do cardápio:
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Selecione o Prato:</label>
              <select
                value={assigningProductId}
                onChange={(e) => setAssigningProductId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F27D26]"
              >
                <option value="">-- Escolha um prato --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!assigningProductId}
                onClick={handleAssignToProduct}
                className="px-4 py-2 rounded-xl bg-[#F27D26] hover:bg-[#d96716] text-white text-xs font-bold disabled:opacity-50"
              >
                Confirmar Associação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
