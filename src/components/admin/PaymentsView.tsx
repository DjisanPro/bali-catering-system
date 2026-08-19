import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { PaymentMethod } from '../../types';
import { formatMT, formatDateTime, getPaymentMethodLabel } from '../../utils/formatters';
import {
  CreditCard,
  PlusCircle,
  Search,
  DollarSign,
  Smartphone,
  CheckCircle,
  X,
} from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { payments, logPayment } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);

  // Form
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState<PaymentMethod>('MPESA');
  const [orderId, setOrderId] = useState('AVULSO');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  const mpesaTotal = payments
    .filter((p) => p.method === 'MPESA')
    .reduce((sum, p) => sum + p.amount, 0);

  const emolaTotal = payments
    .filter((p) => p.method === 'EMOLA')
    .reduce((sum, p) => sum + p.amount, 0);

  const posTotal = payments
    .filter((p) => p.method === 'POS_CARD')
    .reduce((sum, p) => sum + p.amount, 0);

  const cashTotal = payments
    .filter((p) => p.method === 'CASH')
    .reduce((sum, p) => sum + p.amount, 0);

  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== 'all' && p.method !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.orderId.toLowerCase().includes(q) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount) || 0;
    if (num <= 0) return;

    logPayment({
      orderId: orderId.trim() || 'AVULSO',
      amount: num,
      method,
      status: 'PAID',
      transactionReference: reference.trim() || `TX-${Date.now().toString().slice(-6)}`,
      notes: notes.trim() || 'Recebimento de caixa manual',
    });

    setIsNewPaymentModalOpen(false);
    setAmount('500');
    setReference('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards by Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
            Total Recebido
          </span>
          <div className="text-xl font-black font-serif mt-1">{formatMT(totalReceived)}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {payments.length} transações
          </span>
        </div>

        {/* M-Pesa */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-red-600">
            <span>📱 M-Pesa</span>
          </div>
          <div className="text-lg font-black text-slate-900 font-serif mt-1">
            {formatMT(mpesaTotal)}
          </div>
        </div>

        {/* E-Mola */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600">
            <span>📱 E-Mola</span>
          </div>
          <div className="text-lg font-black text-slate-900 font-serif mt-1">
            {formatMT(emolaTotal)}
          </div>
        </div>

        {/* POS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600">
            <span>💳 POS / Cartão</span>
          </div>
          <div className="text-lg font-black text-slate-900 font-serif mt-1">
            {formatMT(posTotal)}
          </div>
        </div>

        {/* Cash */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
            <span>💵 Dinheiro</span>
          </div>
          <div className="text-lg font-black text-slate-900 font-serif mt-1">
            {formatMT(cashTotal)}
          </div>
        </div>
      </div>

      {/* Filter and New Payment Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por referência, pedido, notas..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Todos os Métodos</option>
            <option value="MPESA">M-Pesa</option>
            <option value="EMOLA">E-Mola</option>
            <option value="POS_CARD">POS / Cartão</option>
            <option value="CASH">Dinheiro</option>
            <option value="BANK_TRANSFER">Transferência</option>
          </select>
        </div>

        <button
          onClick={() => setIsNewPaymentModalOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registar Recebimento</span>
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Data & Hora</th>
                <th className="p-3.5">Ref. / Pedido</th>
                <th className="p-3.5">Método de Pagamento</th>
                <th className="p-3.5">Valor (MT)</th>
                <th className="p-3.5">Código Transação</th>
                <th className="p-3.5">Observações</th>
                <th className="p-3.5">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-slate-500">
                    {formatDateTime(pay.createdAt)}
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-900">
                    {pay.orderId}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-800">
                    {getPaymentMethodLabel(pay.method)}
                  </td>
                  <td className="p-3.5 font-black text-slate-900">
                    {formatMT(pay.amount)}
                  </td>
                  <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                    {pay.transactionReference || '-'}
                  </td>
                  <td className="p-3.5 text-slate-600 text-[11px] max-w-xs truncate">
                    {pay.notes || '-'}
                  </td>
                  <td className="p-3.5">
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Concluído
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Modal */}
      {isNewPaymentModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-serif font-bold text-base text-slate-900">
                Registar Recebimento no Caixa
              </h3>
              <button
                onClick={() => setIsNewPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Valor Recebido (MT) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-black text-lg text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Forma de Pagamento *</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold bg-white"
                >
                  <option value="MPESA">📱 M-Pesa</option>
                  <option value="EMOLA">📱 E-Mola</option>
                  <option value="POS_CARD">💳 POS / Cartão</option>
                  <option value="CASH">💵 Dinheiro / Numerário</option>
                  <option value="BANK_TRANSFER">🏦 Transferência Bancária</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Identificador / Pedido / Cliente</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Ex: BCS-2026-003 ou Aluguer Máquina"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Código da Transação / SMS</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: MP892837493"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observações</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Sinal de 50% evento catering..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs"
                >
                  Confirmar Entrada no Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
