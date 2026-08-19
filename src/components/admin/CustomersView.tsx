import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
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
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, orders } = useRestaurant();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Search Bar */}
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

        <div className="text-xs font-bold text-slate-500">
          Total de {customers.length} clientes registados
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => {
          const customerOrders = orders.filter(
            (o) => o.customerPhone.replace(/\s+/g, '') === customer.phone.replace(/\s+/g, '')
          );
          return (
            <div
              key={customer.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:shadow-xs transition-all"
            >
              {/* Header: Name & Avatar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-serif font-black text-sm">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{customer.name}</h4>
                    <span className="text-xs text-slate-500">{customer.phone}</span>
                  </div>
                </div>
              </div>

              {/* Stats: Orders count & Total spent */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Pedidos
                  </span>
                  <span className="font-black text-slate-900 text-sm">
                    {customer.totalOrders}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Gasto Total
                  </span>
                  <span className="font-black text-orange-600 text-sm">
                    {formatMT(customer.totalSpent)}
                  </span>
                </div>
              </div>

              {/* Location & Last Order */}
              <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3">
                {customer.address && (
                  <div className="flex items-start gap-1.5 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{customer.address}</span>
                  </div>
                )}

                {customer.lastOrderDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Último pedido: {formatDateTime(customer.lastOrderDate)}</span>
                  </div>
                )}
              </div>

              {/* Quick Actions (Call & WhatsApp) */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`tel:${customer.phone.replace(/\s+/g, '')}`}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Ligar</span>
                </a>

                <a
                  href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(customer.name)}!%20Aqui%20%C3%A9%20do%20Bali%20Catering%20Service.`}
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
    </div>
  );
};
