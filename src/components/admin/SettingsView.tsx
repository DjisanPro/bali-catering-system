import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantConfig } from '../../types';
import { formatMT } from '../../utils/formatters';
import { BaliLogo } from '../common/BaliLogo';
import {
  Settings,
  Save,
  RotateCcw,
  Download,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  Award,
  Lock,
  KeyRound,
  CheckCircle,
  AlertCircle,
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

  const handleExportJSON = () => {
    const fullBackup = {
      exportDate: new Date().toISOString(),
      restaurant: 'Bali Catering Service - Tete',
      config,
      products,
      ingredients,
      orders,
      payments,
      customers,
      stockMovements,
      auditLogs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bali_catering_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup Exportado', 'Ficheiro JSON de backup descarregado com sucesso.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
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

      {/* Database & Backup Management */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 font-heading">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Gestão de Dados & Cópia de Segurança (Backup)</span>
        </h3>
        <p className="text-slate-500">
          O sistema armazena todos os registos (cardápio, estoque, fichas técnicas, pedidos e clientes) localmente com alta disponibilidade e sem dependência de internet.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#F27D26]" />
            <span>Exportar Backup Completo (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  'ATENÇÃO: Deseja restaurar a base de dados padrão do Bali Catering Service? Todos os dados atuais serão substituídos pelos originais.'
                )
              ) {
                resetAllData();
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Dados Originais de Fábrica</span>
          </button>
        </div>
      </div>
    </div>
  );
};
