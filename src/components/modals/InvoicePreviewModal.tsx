import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { settings } = useBusiness();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const textContent = `=====================================================
TAX INVOICE - ${settings.businessName.toUpperCase()}
=====================================================
Invoice #: ${invoice.invoiceNumber}
Date: ${formatDate(invoice.invoiceDate)}
Due Date: ${invoice.dueDate ? formatDate(invoice.dueDate) : 'On Receipt'}

BILL TO:
${invoice.customerName}
Phone: ${invoice.customerPhone || 'N/A'}
Address: ${invoice.customerAddress || 'N/A'}

ITEMS:
${invoice.items
  .map(
    (it, i) =>
      `${i + 1}. ${it.productName} (x${it.quantity}) @ ${formatCurrency(it.unitPrice, settings.currency)} = ${formatCurrency(it.subtotal, settings.currency)}`
  )
  .join('\n')}

Subtotal: ${formatCurrency(invoice.subtotal, settings.currency)}
Discount: -${formatCurrency(invoice.discount, settings.currency)}
Tax (${invoice.taxRate}%): +${formatCurrency(invoice.taxAmount, settings.currency)}
-----------------------------------------------------
Grand Total: ${formatCurrency(invoice.grandTotal, settings.currency)}
Amount Paid: ${formatCurrency(invoice.paidAmount, settings.currency)}
Balance Due: ${formatCurrency(invoice.balanceDue, settings.currency)}
Status: ${invoice.status.toUpperCase()}
=====================================================
${settings.address}
Phone: ${settings.phone} | GSTIN: ${settings.gstin}
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${invoice.invoiceNumber}.txt`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0a1526] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-3xl overflow-hidden border border-blue-900/80 my-6">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-blue-900/60 bg-[#071120] no-print">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-sm font-mono">Invoice: {invoice.invoiceNumber}</span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                invoice.status === 'Paid'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                  : invoice.status === 'Partial'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
              }`}
            >
              {invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold theme-btn-secondary rounded-lg"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownloadText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold theme-btn-secondary rounded-lg"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Export
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Canvas */}
        <div ref={printRef} className="p-8 sm:p-10 bg-[#071120] text-slate-200 print:bg-white print:text-slate-900 print:p-0 print:m-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b border-blue-900/60 print:border-slate-200 gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center tracking-tighter shadow-[0_0_15px_rgba(59,130,246,0.5)] print:shadow-none">
                  {settings.businessName.charAt(0) || 'B'}
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-white print:text-slate-900 tracking-tight">
                    {settings.businessName}
                  </h1>
                  <p className="text-xs text-slate-400 print:text-slate-500 font-medium">{settings.ownerName}</p>
                </div>
              </div>
              <div className="text-xs text-slate-400 print:text-slate-500 space-y-0.5">
                <p>{settings.address}</p>
                <p>Phone: {settings.phone} • Email: {settings.email}</p>
                {settings.gstin && <p className="font-mono text-cyan-300 print:text-slate-600">GSTIN / Tax ID: {settings.gstin}</p>}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <div className="text-2xl font-black text-cyan-400 print:text-blue-600 tracking-tight">INVOICE</div>
              <div className="font-mono text-sm font-bold text-white print:text-slate-900">{invoice.invoiceNumber}</div>
              <div className="text-xs text-slate-400 print:text-slate-500">Date: {formatDate(invoice.invoiceDate)}</div>
              {invoice.dueDate && (
                <div className="text-xs text-slate-400 print:text-slate-500">Due: {formatDate(invoice.dueDate)}</div>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="py-6 border-b border-blue-900/60 print:border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold text-cyan-400/80 print:text-slate-400 uppercase tracking-wider mb-1">
                Billed To
              </div>
              <div className="text-sm font-bold text-white print:text-slate-900">{invoice.customerName}</div>
              <div className="text-xs text-slate-300 print:text-slate-600">{invoice.customerAddress || 'No address provided'}</div>
              <div className="text-xs text-slate-400 print:text-slate-500 mt-0.5">Phone: {invoice.customerPhone || 'N/A'}</div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[11px] font-bold text-cyan-400/80 print:text-slate-400 uppercase tracking-wider mb-1">
                Payment Status
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                {invoice.status === 'Paid' ? (
                  <span className="text-emerald-400 print:text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Fully Paid
                  </span>
                ) : invoice.status === 'Partial' ? (
                  <span className="text-amber-400 print:text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Partial Payment
                  </span>
                ) : (
                  <span className="text-rose-400 print:text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Payment Due
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-900/60 print:border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/40 print:divide-slate-100">
                {invoice.items.map((it, idx) => (
                  <tr key={idx} className="text-slate-300 print:text-slate-800">
                    <td className="py-3">
                      <div className="font-semibold text-white print:text-slate-900">{it.productName}</div>
                      <div className="text-[10px] text-cyan-400/70 print:text-slate-400 font-mono">SKU: {it.sku}</div>
                    </td>
                    <td className="py-3 text-center font-medium font-mono">{it.quantity}</td>
                    <td className="py-3 text-right font-mono text-slate-400 print:text-slate-600">
                      {formatCurrency(it.unitPrice, settings.currency)}
                    </td>
                    <td className="py-3 text-right font-bold text-cyan-300 print:text-slate-900 font-mono">
                      {formatCurrency(it.subtotal, settings.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary / Calculations */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-blue-900/60 print:border-slate-200 gap-6">
            <div className="max-w-xs text-xs text-slate-400 print:text-slate-500 space-y-2">
              <div>
                <span className="font-bold text-slate-300 print:text-slate-700">Notes & Terms:</span>
                <p className="mt-0.5 leading-relaxed text-slate-400 print:text-slate-600">{invoice.notes || 'Thank you for your business!'}</p>
              </div>
              <div className="pt-2 text-[11px] text-slate-500 print:text-slate-400">
                Computer-generated invoice. No physical signature required.
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 print:text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono text-white print:text-slate-900">{formatCurrency(invoice.subtotal, settings.currency)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-400 print:text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(invoice.discount, settings.currency)}</span>
                </div>
              )}
              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-slate-400 print:text-slate-600">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span className="font-mono text-white print:text-slate-900">+{formatCurrency(invoice.taxAmount, settings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white print:text-slate-900 pt-2 border-t border-blue-900/60 print:border-slate-200">
                <span>Grand Total:</span>
                <span className="text-cyan-300 print:text-blue-600 font-mono">
                  {formatCurrency(invoice.grandTotal, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-300 print:text-slate-700 font-semibold pt-1 border-t border-dashed border-blue-900/50 print:border-slate-200">
                <span>Amount Paid:</span>
                <span className="text-emerald-400 print:text-emerald-700 font-mono">
                  {formatCurrency(invoice.paidAmount, settings.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-rose-400 print:text-rose-600 pt-1">
                <span>Balance Due:</span>
                <span className="font-mono">{formatCurrency(invoice.balanceDue, settings.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
