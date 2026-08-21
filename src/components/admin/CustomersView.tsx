import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Customer } from '../../types';
import { formatMT, formatDateTime } from '../../utils/formatters';
import {
  Users,
  Search,
  Phone,
  MessageCircle,
  ShoppingBag,
  DollarSign,
  MapPin,
  Calendar,
  UserPlus,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Mail,
  FileText,
} from 'lucide-react';
import { CustomerModal } from './CustomerModal';

export const CustomersView: React.FC = () => {
  const { customers, orders, deleteCustomer, showToast } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDelete = (c: Customer) => {
    if (
      window.confirm(
        `Tem certeza que deseja remover o cliente "${c.name}" da base de dados?`
      )
    ) {
      deleteCustomer(c.id);
    }
  };

  // Metrics
  const totalCustomers = customers.length;
  const activeOrdersCount = orders.length;
  const totalRevenue = customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Stat Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total de Clientes
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-slate-900 font-heading">
              {totalCustomers}
            </span>
            <Users className="w-4 h-4 text-[#E86319]" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Pedidos Registados
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-slate-900 font-heading">
              {activeOrdersCount}
            </span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Volume Acumulado Clientes
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-black text-orange-600 font-heading">
              {formatMT(totalRevenue)}
            </span>
            <DollarSign className="w-4 h-4 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Top Controls & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, telefone, bairro..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização em Cartões"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#E86319] hover:bg-[#D45512] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {customers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-[#E86319] flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 font-serif">
              Nenhum cliente cadastrado
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Registe os contactos dos seus clientes para manter histórico de pedidos, endereços para entrega em Tete e comunicação direta via WhatsApp.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="px-6 py-3 rounded-xl bg-[#E86319] hover:bg-[#D45512] text-white font-bold text-xs shadow-md shadow-orange-500/20 inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar Primeiro Cliente</span>
          </button>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <p className="text-sm font-semibold">Nenhum cliente encontrado para "{searchQuery}".</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs font-bold text-[#E86319] hover:underline"
          >
            Limpar busca
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            return (
              <div
                key={customer.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:shadow-xs hover:border-orange-200 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header: Name, Avatar & Action buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-[#E86319] flex items-center justify-center font-serif font-black text-sm">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {customer.name}
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">
                          {customer.phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar Cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(customer)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover Cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats: Orders count & Total spent */}
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Pedidos
                      </span>
                      <span className="font-black text-slate-900 text-sm">
                        {customer.totalOrders || 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Gasto Total
                      </span>
                      <span className="font-black text-orange-600 text-sm">
                        {formatMT(customer.totalSpent || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Location, Email & Notes */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mt-3">
                    {customer.address ? (
                      <div className="flex items-start gap-1.5 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic">
                        <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        <span>Sem endereço cadastrado</span>
                      </div>
                    )}

                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}

                    {customer.notes && (
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-1 border border-amber-200/60">
                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                        <span className="line-clamp-2">{customer.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions (Call & WhatsApp) */}
                <div className="flex gap-2 pt-3 border-t border-slate-100 mt-3">
                  <a
                    href={`tel:${customer.phone.replace(/\s+/g, '')}`}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Ligar</span>
                  </a>

                  <a
                    href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(
                      customer.name
                    )}!%20Aqui%20%C3%A9%20do%20Bali%20Catering%20Service.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Telefone</th>
                  <th className="p-3.5">Endereço</th>
                  <th className="p-3.5 text-center">Pedidos</th>
                  <th className="p-3.5">Total Gasto</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-[#E86319] flex items-center justify-center font-bold text-xs">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{customer.name}</div>
                          {customer.email && (
                            <div className="text-[10px] text-slate-400">{customer.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">{customer.phone}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      {customer.address || '-'}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-900">
                      {customer.totalOrders || 0}
                    </td>
                    <td className="p-3.5 font-black text-orange-600">
                      {formatMT(customer.totalSpent || 0)}
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <a
                        href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg inline-flex items-center"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Modal for Create / Edit */}
      {isModalOpen && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }}
        />
      )}
    </div>
  );
};
