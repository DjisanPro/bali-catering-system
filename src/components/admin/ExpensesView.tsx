import React, { useMemo, useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Expense } from '../../types';
import { Plus, Trash2, Pencil, TrendingDown, Receipt } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

const CATEGORIES = [
  'Energia',
  'Carvão',
  'Transporte',
  'Manutenção',
  'Compras',
  'Embalagens',
  'Água',
  'Gás',
  'Salários',
  'Impostos',
  'Outros Custos Operacionais',
];

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, updateExpense, removeExpense, currentUser } = useRestaurant();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [responsible, setResponsible] = useState('');
  const [notes, setNotes] = useState('');
  const [filterCategory, setFilterCategory] = useState('TODAS');

  const filtered = useMemo(() => {
    if (filterCategory === 'TODAS') return expenses;
    return expenses.filter((e) => e.category === filterCategory);
  }, [expenses, filterCategory]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [filtered]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) {
      return;
    }
    const payload = {
      description: description.trim(),
      category,
      amount: amt,
      expenseDate: new Date(expenseDate + 'T12:00:00').toISOString(),
      responsible: responsible.trim() || currentUser?.name || undefined,
      notes: notes.trim() || undefined,
    };
    if (editingId) {
      await updateExpense(editingId, payload);
    } else {
      await addExpense(payload);
    }
    setIsFormOpen(false);
    setEditingId(null);
    setDescription('');
    setAmount('');
    setNotes('');
    setResponsible('');
  };

  const handleEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setDescription(exp.description);
    setCategory(exp.category || CATEGORIES[0]);
    setAmount(String(exp.amount));
    setExpenseDate((exp.expenseDate || '').slice(0, 10) || new Date().toISOString().slice(0, 10));
    setResponsible(exp.responsible || '');
    setNotes(exp.notes || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (exp: Expense) => {
    if (window.confirm(`Remover a despesa "${exp.description}" (${exp.amount} MT)?`)) {
      await removeExpense(exp.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            Despesas
          </h2>
          <p className="text-xs text-slate-500">
            Registe compras, energia, carvão, transporte e outros custos operacionais.
          </p>
        </div>
        <button
          onClick={() => { setIsFormOpen(true); setEditingId(null); setDescription(''); setAmount(''); setNotes(''); setResponsible(''); }}
          className="px-4 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Despesa
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Despesas (filtro)</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{totalAmount.toLocaleString('pt-MZ')} MT</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registos</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Categoria</p>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="mt-1 w-full text-sm font-bold text-slate-800 border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          >
            <option value="TODAS">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-600" />
                {editingId ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer">×</button>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Descrição *</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Compra de carvão"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Categoria</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Valor (MT) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Data</label>
                <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Responsável</label>
                <input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder={currentUser?.name || ''} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Observações</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: 3 sacos para o fim de semana" rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs" />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer">
                Cancelar
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 cursor-pointer">
                {editingId ? 'Guardar Alterações' : 'Registar Despesa'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wide">Descrição</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wide">Categoria</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wide">Data</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wide">Responsável</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wide text-right">Valor</th>
                <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wide text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Nenhuma despesa registada.
                  </td>
                </tr>
              )}
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {exp.description}
                    {exp.notes && <p className="text-[10px] text-slate-400 font-normal">{exp.notes}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">{exp.category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{exp.expenseDate ? formatDateTime(exp.expenseDate) : '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{exp.responsible || '—'}</td>
                  <td className="px-4 py-3 text-right font-black text-rose-600">{Number(exp.amount).toLocaleString('pt-MZ')} MT</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(exp)} className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 cursor-pointer" title="Editar">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(exp)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Remover">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};