import React, { useState } from 'react';
import { Customer } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { X, User, Phone, MapPin, Mail, FileText, CheckCircle2 } from 'lucide-react';

interface CustomerModalProps {
  customer?: Customer | null;
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ customer, onClose }) => {
  const { createCustomer, updateCustomer } = useRestaurant();

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '+258 ');
  const [address, setAddress] = useState(customer?.address || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [notes, setNotes] = useState(customer?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor introduza o nome do cliente.');
      return;
    }
    if (!phone.trim() || phone.trim() === '+258') {
      setError('Por favor introduza o número de telefone/WhatsApp.');
      return;
    }

    if (customer) {
      const ok = updateCustomer(customer.id, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim(),
        notes: notes.trim(),
      });
      if (!ok) return;
    } else {
      const created = createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim(),
        notes: notes.trim(),
      });
      if (!created) return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#E86319] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {customer ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <p className="text-xs text-slate-500">
                {customer
                  ? 'Atualize os dados e preferências do cliente'
                  : 'Registe um novo cliente no Bali Catering Service'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Nome Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: Carlos Alberto Munguambe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Telefone / WhatsApp */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Telefone / WhatsApp *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                placeholder="+258 84 123 4567"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Endereço / Bairro */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Endereço / Bairro / Ponto de Referência
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Bairro Francisco Manyanga, Rua 4, perto da Escola..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Email (Opcional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Notas / Preferências
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Prefere pagamento por M-Pesa, gosta de frango bem passado, etc."
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#E86319] hover:bg-[#D45512] text-white font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{customer ? 'Salvar Alterações' : 'Criar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
