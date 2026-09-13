import React from 'react';
import { X, Phone, Mail, MapPin, Calendar, CreditCard, ShoppingCart, Clock, CheckCircle2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Customer } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onRecordPayment: (cust: Customer) => void;
  onNewSale: (cust: Customer) => void;
  onEdit: (cust: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onRecordPayment,
  onNewSale,
  onEdit,
}) => {
  const { sales, payments, settings } = useBusiness();

  if (!isOpen || !customer) return null;

  const customerSales = sales.filter((s) => s.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0a1526] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-2xl overflow-hidden border border-blue-900/80 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/60 bg-[#071120]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400">{customer.id}</span>
              <h2 className="text-lg font-bold text-white">{customer.name}</h2>
            </div>
            <p className="text-xs text-slate-400">Customer profile & transaction history</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(customer)}
              className="px-3 py-1.5 text-xs font-semibold theme-btn-secondary rounded-lg"
            >
              Edit Profile
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-[#071120] rounded-xl border border-blue-900/60">
              <div className="text-[11px] font-semibold text-slate-400">Total Purchases</div>
              <div className="text-base font-bold text-white font-mono mt-1">
                {formatCurrency(customer.totalPurchases, settings.currency)}
              </div>
            </div>
            <div className="p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-500/30">
              <div className="text-[11px] font-semibold text-emerald-400">Total Paid</div>
              <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                {formatCurrency(customer.totalPaid, settings.currency)}
              </div>
            </div>
            <div
              className={`p-3.5 rounded-xl border ${
                customer.totalPending > 0
                  ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                  : 'bg-[#071120] border-blue-900/60 text-slate-400'
              }`}
            >
              <div className="text-[11px] font-semibold">Khata Pending Due</div>
              <div className="text-base font-extrabold font-mono mt-1">
                {formatCurrency(customer.totalPending, settings.currency)}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-[#071120] rounded-xl p-4 border border-blue-900/60 space-y-2 text-xs text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-cyan-400/70 shrink-0" />
                <span>{customer.phone || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cyan-400/70 shrink-0" />
                <span>{customer.email || 'No email recorded'}</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-4 h-4 text-cyan-400/70 shrink-0" />
                <span>{customer.address || 'No address provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Customer since {formatDate(customer.createdDate)}</span>
              </div>
            </div>
            {customer.notes && (
              <div className="pt-2 border-t border-blue-900/40 text-slate-400 italic">
                "{customer.notes}"
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onNewSale(customer);
              }}
              className="flex-1 py-2.5 px-4 theme-btn-primary rounded-xl flex items-center justify-center gap-2 text-xs font-bold"
            >
              <ShoppingCart className="w-4 h-4" />
              Create Sale
            </button>
            {customer.totalPending > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onRecordPayment(customer);
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Collect Payment ({formatCurrency(customer.totalPending, settings.currency)})
              </button>
            )}
          </div>

          {/* Transaction History Tabs */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Purchase History ({customerSales.length})
              </h3>
              {customerSales.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">No sales recorded yet.</div>
              ) : (
                <div className="border border-blue-900/60 rounded-xl overflow-hidden divide-y divide-blue-900/40 max-h-40 overflow-y-auto">
                  {customerSales.map((sale) => (
                    <div key={sale.id} className="p-2.5 text-xs flex justify-between items-center bg-[#071120] hover:bg-[#0b1c36] transition-colors">
                      <div>
                        <div className="font-semibold text-white font-mono">{sale.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-400">{formatDate(sale.saleDate)} • {sale.items.length} items</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-cyan-300 font-mono">{formatCurrency(sale.grandTotal, settings.currency)}</div>
                        <div className="text-[10px] text-slate-400">
                          {sale.pendingAmount > 0 ? (
                            <span className="text-amber-400 font-semibold font-mono">Due: {formatCurrency(sale.pendingAmount, settings.currency)}</span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">Fully Paid</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Khata Payment Receipts ({customerPayments.length})
              </h3>
              {customerPayments.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">No payment transactions recorded yet.</div>
              ) : (
                <div className="border border-blue-900/60 rounded-xl overflow-hidden divide-y divide-blue-900/40 max-h-36 overflow-y-auto">
                  {customerPayments.map((pay) => (
                    <div key={pay.id} className="p-2.5 text-xs flex justify-between items-center bg-[#071120] hover:bg-[#0b1c36] transition-colors">
                      <div>
                        <div className="font-semibold text-emerald-400 font-mono">{pay.receiptNumber}</div>
                        <div className="text-[11px] text-slate-400">{formatDateTime(pay.paymentDate)} via {pay.paymentMethod}</div>
                      </div>
                      <div className="font-bold text-emerald-400 font-mono">
                        +{formatCurrency(pay.amount, settings.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
