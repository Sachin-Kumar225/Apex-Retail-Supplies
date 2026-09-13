import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Filter,
  FileText,
  Trash2,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';
import { Sale, Invoice } from '../types';

interface SalesViewProps {
  onOpenAddSale: () => void;
  onOpenInvoicePreview: (inv: Invoice) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  onOpenAddSale,
  onOpenInvoicePreview,
}) => {
  const { sales, invoices, settings, deleteSale } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Filtered sales
  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod = methodFilter === 'ALL' || sale.paymentMethod === methodFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PAID' && sale.pendingAmount <= 0) ||
      (statusFilter === 'PENDING' && sale.pendingAmount > 0);

    return matchesSearch && matchesMethod && matchesStatus;
  });

  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCollected = sales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalPendingOnSales = sales.reduce((sum, s) => sum + s.pendingAmount, 0);

  const handleExportCSV = () => {
    const rows = filteredSales.map((s) => ({
      InvoiceNumber: s.invoiceNumber,
      Customer: s.customerName,
      Date: s.saleDate,
      Subtotal: s.subtotal,
      Discount: s.discount,
      TaxAmount: s.taxAmount,
      GrandTotal: s.grandTotal,
      PaidAmount: s.paidAmount,
      PendingAmount: s.pendingAmount,
      PaymentMethod: s.paymentMethod,
      Notes: s.notes || '',
    }));
    exportToCSV(`sales_report_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-card p-5 sm:p-6 theme-card-hover">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Sales Management</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-950/70 text-cyan-300 rounded-full border border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.15)]">
              {sales.length} transactions
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create sales orders, track paid status, and print customer invoices
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
            New Sale
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="theme-card p-4 theme-card-hover">
          <div className="text-[11px] font-semibold text-slate-400">Total Sales Value</div>
          <div className="text-xl font-black text-white mt-1 font-mono tracking-tight">
            {formatCurrency(totalSalesRevenue, settings.currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all recorded orders</div>
        </div>

        <div className="theme-card p-4 theme-card-hover">
          <div className="text-[11px] font-semibold text-emerald-400">Total Collected Cash/UPI</div>
          <div className="text-xl font-black text-emerald-400 mt-1 font-mono tracking-tight">
            {formatCurrency(totalCollected, settings.currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Directly received into business accounts</div>
        </div>

        <div className="theme-card p-4 theme-card-hover">
          <div className="text-[11px] font-semibold text-amber-400">Khata Credit Given (Unpaid)</div>
          <div className="text-xl font-black text-amber-300 mt-1 font-mono tracking-tight">
            {formatCurrency(totalPendingOnSales, settings.currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Recorded in customer ledgers</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="theme-card p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-cyan-400/70 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer name, invoice number, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs theme-input pl-9 pr-4 py-2.5"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs theme-input px-3 py-2.5 cursor-pointer"
          >
            <option value="ALL">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit">Credit (Khata)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs theme-input px-3 py-2.5 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Fully Paid</option>
            <option value="PENDING">Has Due Balance</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="theme-card overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No sales matching current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-900/60 bg-[#071120] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-950/70">
                {filteredSales.map((sale) => {
                  const matchedInvoice = invoices.find(
                    (inv) => inv.saleId === sale.id || inv.invoiceNumber === sale.invoiceNumber
                  );

                  return (
                    <tr key={sale.id} className="hover:bg-blue-950/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {formatDate(sale.saleDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100 whitespace-nowrap">
                        {sale.customerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="font-semibold text-slate-300">{sale.items.length}</span> line {sale.items.length === 1 ? 'item' : 'items'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-cyan-300 border border-cyan-500/20 font-medium text-[11px]">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {formatCurrency(sale.grandTotal, settings.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                        {formatCurrency(sale.paidAmount, settings.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        {sale.pendingAmount > 0 ? (
                          <span className="text-amber-300 font-bold">
                            {formatCurrency(sale.pendingAmount, settings.currency)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {matchedInvoice && (
                            <button
                              onClick={() => onOpenInvoicePreview(matchedInvoice)}
                              title="View & Print Invoice"
                              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-blue-950/60 rounded-lg transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete sale ${sale.invoiceNumber}? Stock will be restocked.`)) {
                                deleteSale(sale.id);
                              }
                            }}
                            title="Delete Sale"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
