import React, { useState, useRef } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantConfig, BackupPoint, BackupSource } from '../../types';
import { formatMT } from '../../utils/formatters';
import { BaliLogo } from '../common/BaliLogo';
import {
  Settings,
  Save,
  RotateCcw,
  Download,
  Upload,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Lock,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Cloud,
  CloudOff,
  RefreshCw,
  Database,
  History,
  Archive,
  FileCheck,
  Sparkles,
  Server,
  Layers,
  ArrowDownToLine,
  Check,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    config,
    updateConfig,
    updateAdminPin,
    resetAllData,
    products,
    ingredients,
    orders,
    payments,
    customers,
    auditLogs,
    stockMovements,
    backupPoints,
    cloudSyncState,
    createManualBackup,
    restoreBackupPoint,
    importBackupJSON,
    exportBackupJSON,
    verifyCloudStatus,
    isAutoBackupRunning,
    showToast,
  } = useRestaurant();

  const [form, setForm] = useState<RestaurantConfig>({ ...config });
  const [phonesStr, setPhonesStr] = useState(config.phones.join(', '));

  // Admin PIN management state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Manual backup label state
  const [manualBackupLabel, setManualBackupLabel] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupPoint | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCheckingCloud, setIsCheckingCloud] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPhones = phonesStr
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    updateConfig({
      ...form,
      phones: parsedPhones,
      defaultDeliveryFee: Number(form.defaultDeliveryFee) || 100,
    });
  };

  const handlePinChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!currentPin) {
      setPinError('Por favor, informe o código PIN atual.');
      return;
    }
    if (newPin.length < 4) {
      setPinError('O novo código PIN deve ter no mínimo 4 dígitos.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('O novo código PIN e a confirmação não coincidem.');
      return;
    }

    const res = updateAdminPin(currentPin, newPin);
    if (res.success) {
      setPinSuccess('Código PIN administrativo alterado com sucesso!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setTimeout(() => setPinSuccess(''), 4000);
    } else {
      setPinError(res.message);
    }
  };

  const handleTriggerManualBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await createManualBackup(manualBackupLabel || undefined);
      setManualBackupLabel('');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    setIsRestoring(true);
    try {
      await restoreBackupPoint(selectedBackupForRestore.id);
      setSelectedBackupForRestore(null);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        await importBackupJSON(content);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handlePingCloud = async () => {
    setIsCheckingCloud(true);
    try {
      await verifyCloudStatus();
    } finally {
      setIsCheckingCloud(false);
    }
  };

  const getSourceBadge = (source: BackupSource, isPreRestore?: boolean) => {
    if (isPreRestore) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
          Snapshot de Segurança
        </span>
      );
    }
    switch (source) {
      case 'AUTOMATIC_TIMER':
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
            Periódico Automático
          </span>
        );
      case 'CRITICAL_OPERATION':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
            Pós-Operação Crítica
          </span>
        );
      case 'MANUAL_ADMIN':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
            Manual (Admin)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
            Sistema
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Official Brand Identity Showcase */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#F27D26]" />
            <h3 className="font-bold text-sm text-slate-900 font-heading">
              Identidade Visual Oficial (Bali Catering Service)
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-[#F27D26] text-[11px] font-bold border border-orange-200">
            Marca Registada • Tete
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Full Logo Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Logotipo Principal Completo
            </span>
            <div className="p-3 bg-white rounded-lg shadow-2xs w-full flex items-center justify-center">
              <BaliLogo variant="full" size="lg" />
            </div>
            <p className="text-[11px] text-slate-500">Usado em comprovativos, cabeçalhos e documentos.</p>
          </div>

          {/* Horizontal Variant */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Logotipo Horizontal
            </span>
            <div className="p-4 bg-white rounded-lg shadow-2xs w-full flex items-center justify-center min-h-[110px]">
              <BaliLogo variant="horizontal" size="sm" />
            </div>
            <p className="text-[11px] text-slate-500">Usado na barra de navegação pública e menu lateral.</p>
          </div>

          {/* Icon Mark Variant */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ícone / Cloche Oficial
            </span>
            <div className="p-4 bg-white rounded-lg shadow-2xs w-full flex items-center justify-center min-h-[110px]">
              <BaliLogo variant="mark" size="lg" />
            </div>
            <p className="text-[11px] text-slate-500">Usado como favicon do website e selo de autenticidade.</p>
          </div>
        </div>
      </div>

      {/* Cloud Backup, Synchronization & Data Recovery Engine */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 font-heading">
              <Database className="w-5 h-5 text-[#F27D26]" />
              <span>Cópia de Segurança na Nuvem, Histórico Permanente & Recuperação</span>
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Proteção contínua e redundante: dados operacionais locais + backups automáticos na nuvem com snapshots reversíveis.
            </p>
          </div>

          {/* Cloud Health & Connectivity Badge */}
          <div className="flex items-center gap-3">
            {cloudSyncState.status === 'ONLINE' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                <Cloud className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Nuvem Conectada</span>
              </div>
            ) : cloudSyncState.status === 'SYNCING' ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                <span>Sincronizando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                <CloudOff className="w-4 h-4 text-amber-600" />
                <span>Modo Local Ativo</span>
              </div>
            )}

            <button
              type="button"
              onClick={handlePingCloud}
              disabled={isCheckingCloud}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Testar Conexão com Nuvem"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCheckingCloud ? 'animate-spin' : ''}`} />
              <span>Verificar Conexão</span>
            </button>
          </div>
        </div>

        {/* Protection Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <History className="w-3.5 h-3.5 text-blue-600" />
              Pontos de Recuperação
            </span>
            <p className="text-base font-bold text-slate-900">{backupPoints.length} versões salvas</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-purple-600" />
              Cópia Remota / Nuvem
            </span>
            <p className="text-base font-bold text-slate-900">{cloudSyncState.totalCloudBackups} na nuvem</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Última Sincronização
            </span>
            <p className="text-xs font-semibold text-slate-800">
              {new Date(cloudSyncState.lastSyncTimestamp || Date.now()).toLocaleTimeString('pt-PT')}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F27D26]" />
              Proteção de Restauração
            </span>
            <p className="text-xs font-semibold text-emerald-700">Snapshot Reversível Ativo</p>
          </div>
        </div>

        {/* Manual Backup Trigger Form */}
        <div className="p-4 rounded-xl bg-orange-50/40 border border-orange-200 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F27D26]" />
            <h4 className="font-bold text-xs text-slate-900">Criar Novo Ponto de Cópia Manualmente</h4>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="Ex: Antes do fecho de caixa, Ajuste de preçário de sábado..."
              value={manualBackupLabel}
              onChange={(e) => setManualBackupLabel(e.target.value)}
              className="flex-1 w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs"
            />
            <button
              type="button"
              onClick={handleTriggerManualBackup}
              disabled={isCreatingBackup}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#F27D26] hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isCreatingBackup ? 'Gerando Backup...' : 'Criar Ponto de Cópia'}</span>
            </button>
          </div>
        </div>

        {/* File Export & Import Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportBackupJSON}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#F27D26]" />
              <span>Descarregar Backup Completo (JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Importar Ficheiro JSON</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json,application/json"
              className="hidden"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  'ATENÇÃO: Deseja restaurar a base de dados padrão do Bali Catering Service? Todos os dados atuais serão substituídos pelos originais de fábrica.'
                )
              ) {
                resetAllData();
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrões de Fábrica</span>
          </button>
        </div>

        {/* Versioned Recovery Points History List */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <h4 className="font-bold text-xs text-slate-900">Histórico de Versões & Pontos de Recuperação</h4>
            </div>
            <span className="text-[11px] text-slate-400">
              {backupPoints.length} versões disponíveis para restauração
            </span>
          </div>

          {backupPoints.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
              Nenhum ponto de backup gerado ainda. O sistema cria pontos automáticos a cada operação crítica.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {backupPoints.map((point) => (
                <div
                  key={point.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    point.isPreRestoreSnapshot
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-white border-slate-200 hover:border-orange-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {point.id}
                      </span>
                      {getSourceBadge(point.source, point.isPreRestoreSnapshot)}
                      <span className="font-bold text-slate-800 text-xs">{point.label}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span>{new Date(point.timestamp).toLocaleString('pt-PT')}</span>
                      <span>•</span>
                      <span>Por: {point.performedBy}</span>
                      <span>•</span>
                      <span>Tamanho: {(point.sizeBytes / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-400">{point.checksum}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-600 font-medium">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                        {point.itemCounts.products} produtos
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                        {point.itemCounts.ingredients} insumos
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                        {point.itemCounts.orders} pedidos
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                        {point.itemCounts.payments} pagamentos
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded">
                        {point.itemCounts.customers} clientes
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedBackupForRestore(point)}
                      className="px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-[#F27D26] text-[#F27D26] hover:text-white font-bold text-xs border border-orange-200 hover:border-transparent flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 pb-2 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-amber-50">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-heading">
                  Confirmar Restauração de Dados
                </h3>
                <p className="text-slate-500 text-xs">Ponto: {selectedBackupForRestore.id}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-700">
              <p>
                <strong>Você está prestes a restaurar:</strong>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Versão: <strong>{selectedBackupForRestore.label}</strong></li>
                <li>Gerada em: <strong>{new Date(selectedBackupForRestore.timestamp).toLocaleString('pt-PT')}</strong></li>
                <li>Por: <strong>{selectedBackupForRestore.performedBy}</strong></li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Garantia de Segurança Reversível
              </span>
              <p className="text-[11px] text-emerald-700">
                Antes de aplicar a restauração, o sistema gerará automaticamente um <strong>Snapshot de Segurança</strong> do estado atual para permitir reversão instantânea.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBackupForRestore(null)}
                disabled={isRestoring}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-5 py-2.5 rounded-xl bg-[#F27D26] hover:bg-orange-600 text-white font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restaurando...' : 'Confirmar Restauração'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 font-heading">
              <Settings className="w-4 h-4 text-[#F27D26]" />
              <span>Configurações Gerais do Restaurante</span>
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Personalize contactos oficiais, taxa de entrega, endereços e regras operacionais.
            </p>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#F27D26] hover:bg-orange-600 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>

        {/* Identity & Slogan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Nome Comercial do Estabelecimento</label>
            <input
              type="text"
              required
              value={form.restaurantName}
              onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Slogan / Assinatura de Marca</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Location & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Endereço Principal</label>
            <input
              type="text"
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Detalhes do Ponto / Esplanada</label>
            <input
              type="text"
              value={form.locationDetails}
              onChange={(e) => setForm({ ...form, locationDetails: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Phone Contacts & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Telefones Oficiais (separados por vírgula)
            </label>
            <input
              type="text"
              value={phonesStr}
              onChange={(e) => setPhonesStr(e.target.value)}
              placeholder="+258 872 022 777, +258 874 660 777, +258 844 660 771"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              WhatsApp Principal para Pedidos (com código de país)
            </label>
            <input
              type="text"
              required
              value={form.whatsappPrimary}
              onChange={(e) => setForm({ ...form, whatsappPrimary: e.target.value })}
              placeholder="258872022777"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Delivery Fee & Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Taxa Padrão de Entrega (MT)</label>
            <input
              type="number"
              min="0"
              value={form.defaultDeliveryFee}
              onChange={(e) => setForm({ ...form, defaultDeliveryFee: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-[#F27D26] focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Horário Segunda a Sábado</label>
            <input
              type="text"
              value={form.openingHoursWeekday}
              onChange={(e) => setForm({ ...form, openingHoursWeekday: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Horário Domingos / Feriados</label>
            <input
              type="text"
              value={form.openingHoursWeekend}
              onChange={(e) => setForm({ ...form, openingHoursWeekend: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Operational Logic Toggle */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900">
              Baixa Automática de Estoque por Ficha Técnica
            </span>
            <p className="text-[11px] text-slate-500">
              Quando ativado, confirmar um pedido deduzirá automaticamente as quantidades de carne, pão, queijo, molhos e carvão.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoDeductStockOnConfirm}
              onChange={(e) => setForm({ ...form, autoDeductStockOnConfirm: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F27D26]"></div>
          </label>
        </div>
      </form>

      {/* Admin PIN Security Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#F27D26]" />
            <h3 className="font-bold text-sm text-slate-900 font-heading">
              Segurança & Código de Acesso do Administrador (PIN)
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Proteção Ativa
          </span>
        </div>

        <p className="text-slate-500 text-xs">
          O código PIN é exigido para aceder à área de gestão, alterar cardápio, preçários, estoque e relatórios financeiros. Altere-o regularmente para manter o sistema seguro.
        </p>

        <form onSubmit={handlePinChangeSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Código PIN Atual *</label>
              <input
                type="password"
                required
                placeholder="PIN atual"
                value={currentPin}
                onChange={(e) => {
                  setCurrentPin(e.target.value);
                  setPinError('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Novo Código PIN *</label>
              <input
                type="password"
                required
                placeholder="Novo PIN (min 4 dígitos)"
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value);
                  setPinError('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Confirmar Novo PIN *</label>
              <input
                type="password"
                required
                placeholder="Repita o novo PIN"
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value);
                  setPinError('');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {pinError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          {pinSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{pinSuccess}</span>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-[#F27D26]" />
              <span>Atualizar Código PIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
