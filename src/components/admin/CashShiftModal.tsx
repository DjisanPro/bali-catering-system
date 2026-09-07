import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRestaurant } from '../../context/RestaurantContext';
import { formatMT } from '../../utils/formatters';
import {
  X,
  Lock,
  Unlock,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Calculator,
} from 'lucide-react';

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashShiftModal: React.FC<CashShiftModalProps> = ({ isOpen, onClose }) => {
  const {
    currentCashShift,
    openCashShift,
    closeCashShift,
    addCashSupply,
    addCashBleed,
    getCashShiftSummary,
    currentUser,
    requestAdminElevation,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'STATUS' | 'OPEN' | 'SUPPLY' | 'BLEED' | 'CLOSE'>('STATUS');

  // Form states
  const [initialFloat, setInitialFloat] = useState('2000');
  const [openNotes, setOpenNotes] = useState('');

  const [supplyAmount, setSupplyAmount] = useState('');
  const [supplyReason, setSupplyReason] = useState('Reforço de troco para moedas e notas miúdas');

  const [bleedAmount, setBleedAmount] = useState('');
  const [bleedReason, setBleedReason] = useState('Recolha de segurança para cofre');

  const [countedCash, setCountedCash] = useState('');
  const [closeJustification, setCloseJustification] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  if (!isOpen) return null;

  const summary = getCashShiftSummary();

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(initialFloat);
    const created = openCashShift(num, openNotes);
    if (created) {
      setActiveTab('STATUS');
    }
  };

  const handleSupply = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(supplyAmount);
    if (addCashSupply(num, supplyReason)) {
      setSupplyAmount('');
      setActiveTab('STATUS');
    }
  };

  const handleBleed = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(bleedAmount);
    // Sangria exige confirmação de administrador se usuário for vendedor
    if (currentUser?.role === 'SELLER') {
      requestAdminElevation(
        () => {
          if (addCashBleed(num, bleedReason)) {
            setBleedAmount('');
            setActiveTab('STATUS');
          }
        },
        'Autorização para Sangria de Caixa',
        `Autorizar retirada de ${num} MT do caixa pelo vendedor ${currentUser.name}.`
      );
    } else {
      if (addCashBleed(num, bleedReason)) {
        setBleedAmount('');
        setActiveTab('STATUS');
      }
    }
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(countedCash);
    const closed = closeCashShift(num, closeJustification, closeNotes);
    if (closed) {
      setCountedCash('');
      onClose();
    }
  };

  const cashDiscrepancy = countedCash
    ? Number((Number(countedCash) - (currentCashShift?.expectedCash || 0)).toFixed(2))
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative"
      >
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-[#F27D26]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base tracking-tight text-white">
                Controlo de Caixa e Turnos
              </h3>
              <p className="text-xs text-slate-300">
                {currentCashShift
                  ? `Turno #${currentCashShift.shiftNumber} aberto por ${currentCashShift.openedBy}`
                  : 'Nenhum turno de caixa aberto no momento'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('STATUS')}
            className={`py-2 px-3 rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'STATUS'
                ? 'bg-white text-slate-900 border-t-2 border-orange-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Resumo do Caixa
          </button>

          {!currentCashShift ? (
            <button
              type="button"
              onClick={() => setActiveTab('OPEN')}
              className={`py-2 px-3 rounded-t-xl transition-all cursor-pointer ${
                activeTab === 'OPEN'
                  ? 'bg-white text-slate-900 border-t-2 border-orange-500 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Abrir Caixa
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('SUPPLY')}
                className={`py-2 px-3 rounded-t-xl transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'SUPPLY'
                    ? 'bg-white text-emerald-700 border-t-2 border-emerald-500 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                Suprimento
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('BLEED')}
                className={`py-2 px-3 rounded-t-xl transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'BLEED'
                    ? 'bg-white text-amber-700 border-t-2 border-amber-500 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                Sangria
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CLOSE')}
                className={`py-2 px-3 rounded-t-xl transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'CLOSE'
                    ? 'bg-white text-red-700 border-t-2 border-red-500 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-red-600" />
                Fechar Turno
              </button>
            </>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {/* 1. ABA RESUMO / STATUS */}
          {activeTab === 'STATUS' && (
            <div className="space-y-4">
              {currentCashShift ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block mb-1">
                        Dinheiro Esperado em Gaveta
                      </span>
                      <div className="text-xl font-black text-slate-900">
                        {formatMT(currentCashShift.expectedCash)}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Fundo inicial: {formatMT(currentCashShift.initialCashFloat)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Total Vendido no Turno
                      </span>
                      <div className="text-xl font-black text-emerald-600">
                        {formatMT(currentCashShift.totalSalesAmount)}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {currentCashShift.ordersCount} pedidos concluídos
                      </span>
                    </div>
                  </div>

                  {/* Detalhamento por método de pagamento */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                      Faturação por Método de Pagamento
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-600">💵 Dinheiro:</span>
                        <strong className="text-slate-900">
                          {formatMT(currentCashShift.paymentBreakdown.cash)}
                        </strong>
                      </div>
                      <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-600">📱 M-Pesa:</span>
                        <strong className="text-slate-900">
                          {formatMT(currentCashShift.paymentBreakdown.mpesa)}
                        </strong>
                      </div>
                      <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-600">📱 E-Mola:</span>
                        <strong className="text-slate-900">
                          {formatMT(currentCashShift.paymentBreakdown.emola)}
                        </strong>
                      </div>
                      <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-slate-600">💳 Cartão POS:</span>
                        <strong className="text-slate-900">
                          {formatMT(currentCashShift.paymentBreakdown.posCard)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('SUPPLY')}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-200 text-emerald-700 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      + Suprimento
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('BLEED')}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-amber-200 text-amber-700 font-bold text-xs bg-amber-50 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      - Sangria
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('CLOSE')}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Fechar Turno
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">
                      Caixa Atualmente Fechado
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      Para iniciar as operações de venda no PDV e registrar recebimentos em dinheiro, abra um turno com o fundo de troco.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('OPEN')}
                    className="py-3 px-6 rounded-2xl bg-[#F27D26] hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Abrir Novo Turno de Caixa</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. ABA ABERTURA DE CAIXA */}
          {activeTab === 'OPEN' && (
            <form onSubmit={handleOpenShift} className="space-y-4">
              <div className="p-3.5 bg-orange-50 rounded-2xl border border-orange-100 text-xs text-orange-900">
                <span className="font-bold block mb-1">Abertura de Turno Operacional</span>
                Indique o valor em dinheiro físico inserido na gaveta para servir de troco aos clientes.
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Fundo Inicial de Troco (Meticais)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs font-extrabold text-slate-400">MT</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={initialFloat}
                    onChange={(e) => setInitialFloat(e.target.value)}
                    required
                    placeholder="2000"
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-base font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {['1000', '2000', '3000', '5000'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setInitialFloat(val)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-100 text-slate-700 font-semibold cursor-pointer"
                    >
                      {val} MT
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Observações de Abertura (Opcional)
                </label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  placeholder="Ex: Turno da manhã, notas conferidas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4 text-[#F27D26]" />
                  <span>Confirmar Abertura</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. ABA SUPRIMENTO DE CAIXA */}
          {activeTab === 'SUPPLY' && (
            <form onSubmit={handleSupply} className="space-y-4">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900">
                <span className="font-bold block mb-1">Suprimento de Caixa (Entrada Extra)</span>
                Utilize para injetar dinheiro de troco adicional na gaveta durante o turno.
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Valor a Injetar (MT)
                </label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={supplyAmount}
                  onChange={(e) => setSupplyAmount(e.target.value)}
                  required
                  placeholder="Ex: 1000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Motivo / Justificativa
                </label>
                <input
                  type="text"
                  value={supplyReason}
                  onChange={(e) => setSupplyReason(e.target.value)}
                  required
                  placeholder="Motivo do suprimento"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Registar Suprimento</span>
                </button>
              </div>
            </form>
          )}

          {/* 4. ABA SANGRIA DE CAIXA */}
          {activeTab === 'BLEED' && (
            <form onSubmit={handleBleed} className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-900">
                <span className="font-bold block mb-1">Sangria de Caixa (Retirada Segura)</span>
                Retire o excesso de dinheiro físico da gaveta e transfira para o cofre com registo auditado.
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-xs">
                <span className="text-slate-500">Saldo disponível em gaveta:</span>
                <strong className="text-slate-900">{formatMT(currentCashShift?.expectedCash || 0)}</strong>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Valor a Retirar (MT)
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentCashShift?.expectedCash || 0}
                  step="10"
                  value={bleedAmount}
                  onChange={(e) => setBleedAmount(e.target.value)}
                  required
                  placeholder="Ex: 3000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Motivo da Sangria
                </label>
                <input
                  type="text"
                  value={bleedReason}
                  onChange={(e) => setBleedReason(e.target.value)}
                  required
                  placeholder="Ex: Recolha para cofre"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Registar Sangria</span>
                </button>
              </div>
            </form>
          )}

          {/* 5. ABA FECHAMENTO DE CAIXA */}
          {activeTab === 'CLOSE' && (
            <form onSubmit={handleCloseShift} className="space-y-4">
              <div className="p-3.5 bg-red-50 rounded-2xl border border-red-100 text-xs text-red-900">
                <span className="font-bold block mb-1">Fecho de Turno e Conferência Cega</span>
                Conte o dinheiro físico presente na gaveta e informe o valor real apurado.
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Saldo Esperado pelo Sistema:</span>
                  <strong className="text-slate-900">{formatMT(currentCashShift?.expectedCash || 0)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Faturado no Turno:</span>
                  <strong className="text-emerald-700">{formatMT(currentCashShift?.totalSalesAmount || 0)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Valor Contado Fisicamente (MT)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                  required
                  placeholder="Informe o valor contado na gaveta"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-base font-black bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {countedCash && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border ${
                    cashDiscrepancy === 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : cashDiscrepancy > 0
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <span>
                    {cashDiscrepancy === 0
                      ? '✓ Caixa Perfeito (Sem quebra nem sobra)'
                      : cashDiscrepancy > 0
                      ? `Sobra de Caixa: +${formatMT(cashDiscrepancy)}`
                      : `Quebra de Caixa: ${formatMT(cashDiscrepancy)}`}
                  </span>
                  <span>{cashDiscrepancy >= 0 ? 'Conferido' : 'Atenção'}</span>
                </div>
              )}

              {cashDiscrepancy !== 0 && countedCash && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Justificativa da Discrepância
                  </label>
                  <input
                    type="text"
                    value={closeJustification}
                    onChange={(e) => setCloseJustification(e.target.value)}
                    required
                    placeholder="Explique a diferença apurada na contagem"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Finalizar & Trancar Caixa</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
