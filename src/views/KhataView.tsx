import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  History,
  ArrowDownLeft,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Customer, Payment } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

interface KhataViewProps {
  onOpenCollectPayment: (customer?: Customer) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const KhataView: React.FC<KhataViewProps> = ({
  onOpenCollectPayment,
  onSelectCustomer,
}) => {
  const { customers, payments, settings } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [copiedCustId, setCopiedCustId] = useState<string | null>(null);

  const pendingCustomers = customers
    .filter((c) => c.totalPending > 0)
    .sort((a, b) => b.totalPending - a.totalPending);

  const filteredPending = pendingCustomers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalKhataOwed = customers.reduce((sum, c) => sum + c.totalPending, 0);
  const totalCollectedAllTime = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleCopyReminder = (cust: Customer) => {
    const message = `Dear ${cust.name}, this is a gentle reminder from ${settings.businessName} regarding your outstanding balance of ${formatCurrency(cust.totalPending, settings.currency)}. Please settle at your earliest convenience via UPI or cash. Thank you!`;
    navigator.clipboard.writeText(message);
    setCopiedCustId(cust.id);
    setTimeout(() => setCopiedCustId(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-card p-5 sm:p-6 theme-card-hover">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Payments & Digital Khata
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-950/70 text-amber-300 rounded-full border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
              Ledger Book
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track customer credit balances, collect pending dues, and send payment reminders
          </p>
        </div>

        <button
          onClick={() => onOpenCollectPayment()}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/50 self-start sm:self-auto border border-emerald-400/30"
        >
          <Plus className="w-4 h-4" />
          Record Payment
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="theme-card p-4 border-amber-500/30 hover:border-amber-400/50 theme-card-hover">
          <div className="text-[11px] font-semibold text-amber-400">Total Khata Receivables (Due)</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono tracking-tight">
            {formatCurrency(totalKhataOwed, settings.currency)}
          </div>
          <div className="text-xs text-amber-400/70 mt-1">
            Across {pendingCustomers.length} debtor {pendingCustomers.length === 1 ? 'account' : 'accounts'}
          </div>
        </div>

        <div className="theme-card p-4 border-emerald-500/30 hover:border-emerald-400/50 theme-card-hover">
          <div className="text-[11px] font-semibold text-emerald-400">Total Khata Collections</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono tracking-tight">
            {formatCurrency(totalCollectedAllTime, settings.currency)}
          </div>
          <div className="text-xs text-emerald-500 mt-1">
            {payments.length} successful payment receipts logged
          </div>
        </div>

        <div className="theme-card p-4 theme-card-hover">
          <div className="text-[11px] font-semibold text-slate-400">Settled Customers Ratio</div>
          <div className="text-2xl font-black text-white mt-1 font-mono tracking-tight">
            {customers.length > 0
              ? `${Math.round(((customers.length - pendingCustomers.length) / customers.length) * 100)}%`
              : '100%'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {customers.length - pendingCustomers.length} of {customers.length} completely paid
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-blue-900/50">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'border-amber-400 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Pending Receivables ({pendingCustomers.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-cyan-400 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Receipt History ({payments.length})
        </button>
      </div>

      {activeTab === 'pending' ? (
        <>
          {/* Search bar */}
          <div className="theme-card p-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-cyan-400/70 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search customers with pending balances..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs theme-input pl-9 pr-4 py-2.5"
              />
            </div>
          </div>

          {/* Pending List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPending.length === 0 ? (
              <div className="col-span-2 py-16 text-center text-slate-500 text-xs theme-card">
                No customers with outstanding balances found. Great job!
              </div>
            ) : (
              filteredPending.map((cust) => (
                <div
                  key={cust.id}
                  className="theme-card border-amber-500/30 hover:border-amber-400/50 hover:shadow-[0_0_18px_rgba(245,158,11,0.12)] transition-all duration-200 hover:-translate-y-0.5 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div
                        onClick={() => onSelectCustomer(cust)}
                        className="cursor-pointer group"
                      >
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {cust.name}
                        </h3>
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-cyan-400/70" />
                          <span>{cust.phone || 'No phone recorded'}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400">
                          Due Balance
                        </div>
                        <div className="text-xl font-black text-amber-300 font-mono">
                          {formatCurrency(cust.totalPending, settings.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-blue-950/80 flex items-center justify-between text-xs text-slate-400">
                      <span>Total Purchases: <strong className="text-slate-200">{formatCurrency(cust.totalPurchases, settings.currency)}</strong></span>
                      <span>Total Paid: <strong className="text-emerald-400">{formatCurrency(cust.totalPaid, settings.currency)}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-blue-950/80 flex items-center gap-2">
                    <button
                      onClick={() => handleCopyReminder(cust)}
                      className="flex-1 py-2 text-xs font-semibold theme-btn-secondary rounded-xl flex items-center justify-center gap-1.5"
                      title="Copy WhatsApp / SMS reminder template"
                    >
                      {copiedCustId === cust.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Copy Reminder</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onOpenCollectPayment(cust)}
                      className="flex-1 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Collect Dues
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Payment History Table */
        <div className="theme-card overflow-hidden">
          {payments.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No payments collected yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-blue-900/60 bg-[#071120] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3.5 px-4">Receipt #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Notes / Ref</th>
                    <th className="py-3.5 px-4 text-right">Amount Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-950/70">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-950/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        {p.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {formatDateTime(p.paymentDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-cyan-300 border border-cyan-500/20 font-medium text-[11px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {p.notes || 'Khata clearance'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                        +{formatCurrency(p.amount, settings.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
