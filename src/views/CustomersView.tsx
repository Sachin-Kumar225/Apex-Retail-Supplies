import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ShoppingCart,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Customer } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CustomersViewProps {
  onOpenAddCustomer: () => void;
  onEditCustomer: (cust: Customer) => void;
  onSelectCustomer: (cust: Customer) => void;
  onRecordPayment: (cust: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenAddCustomer,
  onEditCustomer,
  onSelectCustomer,
  onRecordPayment,
}) => {
  const { customers, deleteCustomer, settings } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING' | 'SETTLED'>('ALL');

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'PENDING' && cust.totalPending > 0) ||
      (filterType === 'SETTLED' && cust.totalPending <= 0);

    return matchesSearch && matchesFilter;
  });

  const totalReceivables = customers.reduce((sum, c) => sum + c.totalPending, 0);
  const pendingCount = customers.filter((c) => c.totalPending > 0).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-card p-5 sm:p-6 theme-card-hover">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Customer Directory
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-950/70 text-cyan-300 rounded-full border border-cyan-500/30">
              {customers.length} total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Maintain customer contacts, purchase records, and credit ledger balances
          </p>
        </div>

        <button
          onClick={onOpenAddCustomer}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold theme-btn-primary rounded-xl self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="theme-card p-4.5 theme-card-hover">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Registered Customers</div>
          <div className="text-2xl font-black text-white mt-1">{customers.length}</div>
          <div className="text-xs text-cyan-400/80 mt-1">In active business directory</div>
        </div>

        <div className="theme-card p-4.5 theme-card-hover border-amber-500/30">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Customers with Pending Dues</div>
          <div className="text-2xl font-black text-amber-300 mt-1">{pendingCount}</div>
          <div className="text-xs text-amber-400/80 mt-1 font-mono">
            Total Khata Due: {formatCurrency(totalReceivables, settings.currency)}
          </div>
        </div>

        <div className="theme-card p-4.5 theme-card-hover border-emerald-500/30">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Settled Customers</div>
          <div className="text-2xl font-black text-emerald-300 mt-1">
            {customers.length - pendingCount}
          </div>
          <div className="text-xs text-emerald-400/80 mt-1">Zero outstanding balances</div>
        </div>
      </div>

      {/* Search & Filter Pills */}
      <div className="theme-card p-4 theme-card-hover flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs theme-input pl-10 pr-4 py-2.5"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
              filterType === 'ALL'
                ? 'theme-btn-primary'
                : 'theme-btn-secondary'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('PENDING')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
              filterType === 'PENDING'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-500/30'
            }`}
          >
            Pending Dues ({pendingCount})
          </button>
          <button
            onClick={() => setFilterType('SETTLED')}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
              filterType === 'SETTLED'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-500/30'
            }`}
          >
            Settled ({customers.length - pendingCount})
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="theme-card p-5 theme-card-hover flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div
                  onClick={() => onSelectCustomer(cust)}
                  className="cursor-pointer group flex-1"
                >
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                    {cust.name}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{cust.id}</div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditCustomer(cust)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-blue-900/40 transition-colors"
                    title="Edit Customer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${cust.name}?`)) {
                        deleteCustomer(cust.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                {cust.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
                    <span>{cust.phone}</span>
                  </div>
                )}
                {cust.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
                    <span className="truncate">{cust.email}</span>
                  </div>
                )}
                {cust.address && (
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
                    <span className="truncate">{cust.address}</span>
                  </div>
                )}
              </div>

              {/* Ledger Summary */}
              <div className="mt-4 pt-3 border-t border-blue-900/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Total Purchases</div>
                  <div className="font-bold text-white font-mono">
                    {formatCurrency(cust.totalPurchases, settings.currency)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Khata Pending</div>
                  <div
                    className={`font-black font-mono ${
                      cust.totalPending > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatCurrency(cust.totalPending, settings.currency)}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-4 pt-3 border-t border-blue-900/60 flex items-center gap-2">
              <button
                onClick={() => onSelectCustomer(cust)}
                className="flex-1 py-1.5 text-xs font-semibold theme-btn-secondary rounded-xl text-center"
              >
                View History
              </button>
              {cust.totalPending > 0 && (
                <button
                  onClick={() => onRecordPayment(cust)}
                  className="py-1.5 px-3 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-[0_0_10px_rgba(52,211,153,0.3)] transition-all duration-200 hover:-translate-y-0.5"
                >
                  Collect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
