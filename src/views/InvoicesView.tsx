import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Invoice } from '../types';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';

interface InvoicesViewProps {
  onOpenAddSale: () => void;
  onOpenInvoicePreview: (inv: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  onOpenAddSale,
  onOpenInvoicePreview,
}) => {
  const { invoices, settings, deleteInvoice } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Paid' | 'Partial' | 'Unpaid'>('ALL');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const handleExportCSV = () => {
    const rows = filteredInvoices.map((inv) => ({
      InvoiceNumber: inv.invoiceNumber,
      Customer: inv.customerName,
      Date: inv.invoiceDate,
      DueDate: inv.dueDate || '',
      Subtotal: inv.subtotal,
      Discount: inv.discount,
      TaxAmount: inv.taxAmount,
      GrandTotal: inv.grandTotal,
      PaidAmount: inv.paidAmount,
      BalanceDue: inv.balanceDue,
      Status: inv.status,
    }));
    exportToCSV(`invoices_list_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-card p-5 sm:p-6 theme-card-hover">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Invoices & Billing
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-950/70 text-cyan-300 rounded-full border border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.15)]">
              {invoices.length} invoices
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate, print, and track professional tax invoices for your customers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold theme-btn-secondary rounded-xl"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </button>
          <button
            onClick={onOpenAddSale}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs theme-btn-primary rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="theme-card p-4 theme-card-hover">
          <div className="text-[11px] font-semibold text-slate-400">Total Invoiced Amount</div>
          <div className="text-2xl font-black text-white mt-1 font-mono tracking-tight">
            {formatCurrency(totalInvoiced, settings.currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Sum of all generated bills</div>
        </div>

        <div className="theme-card p-4 border-emerald-500/30 hover:border-emerald-400/50 theme-card-hover">
          <div className="text-[11px] font-semibold text-emerald-400">Total Invoiced Payments</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono tracking-tight">
            {formatCurrency(totalPaid, settings.currency)}
          </div>
          <div className="text-xs text-emerald-500 mt-1">Collected on invoice dates</div>
        </div>

        <div className="theme-card p-4 border-amber-500/30 hover:border-amber-400/50 theme-card-hover">
          <div className="text-[11px] font-semibold text-amber-400">Outstanding Invoiced Balance</div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono tracking-tight">
            {formatCurrency(totalDue, settings.currency)}
          </div>
          <div className="text-xs text-amber-400/70 mt-1">Pending customer settlement</div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="theme-card p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-cyan-400/70 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by invoice number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs theme-input pl-9 pr-4 py-2.5"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'Paid', 'Partial', 'Unpaid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                  : 'bg-blue-950/60 text-slate-300 hover:bg-blue-900/60 border border-blue-900/40'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="theme-card overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No invoices found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-900/60 bg-[#071120] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Due</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-950/70">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-blue-950/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      {inv.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(inv.invoiceDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(inv.grandTotal, settings.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                      {formatCurrency(inv.paidAmount, settings.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold">
                      {inv.balanceDue > 0 ? (
                        <span className="text-amber-300 font-bold">
                          {formatCurrency(inv.balanceDue, settings.currency)}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-normal">$0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 shadow-[0_0_6px_rgba(52,211,153,0.15)]'
                            : inv.status === 'Partial'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/30 shadow-[0_0_6px_rgba(245,158,11,0.15)]'
                            : 'bg-rose-950/60 text-rose-300 border-rose-500/30 shadow-[0_0_6px_rgba(244,63,94,0.15)]'
                        }`}
                      >
                        {inv.status === 'Paid' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : inv.status === 'Partial' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenInvoicePreview(inv)}
                          title="View & Print Invoice"
                          className="p-1.5 text-cyan-400 hover:text-cyan-200 hover:bg-blue-950/60 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-[11px] hidden sm:inline">Preview</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber}?`)) {
                              deleteInvoice(inv.id);
                            }
                          }}
                          title="Delete Invoice"
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
