import React, { useState } from 'react';
import {
  X,
  Calendar,
  IndianRupee,
  TrendingUp,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { DailyBusinessUpdatePayload } from '../../types';

interface DailyBusinessUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyBusinessUpdateModal: React.FC<DailyBusinessUpdateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    settings,
    customers,
    products,
    recordDailyBusinessUpdate,
    businessProfile,
  } = useBusiness();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [totalSales, setTotalSales] = useState<number | ''>('');
  const [moneyReceived, setMoneyReceived] = useState<number | ''>('');
  const [expenses, setExpenses] = useState<number | ''>('');
  const [expenseCategory, setExpenseCategory] = useState('Daily Supplies');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [supplierPayments, setSupplierPayments] = useState<number | ''>('');
  const [supplierName, setSupplierName] = useState('');
  const [customerPayments, setCustomerPayments] = useState<number | ''>('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Optional product breakdown
  const [showProductSection, setShowProductSection] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    { productId: string; productName: string; quantity: number; unitPrice: number }[]
  >([]);

  if (!isOpen) return null;

  const numSales = Number(totalSales) || 0;
  const numReceived = Number(moneyReceived) || 0;
  const numExpenses = Number(expenses) || 0;
  const numSupplierPayments = Number(supplierPayments) || 0;
  const numCustomerPayments = Number(customerPayments) || 0;

  // Derived calculations
  const totalInflow = numReceived + numCustomerPayments;
  const totalOutflow = numExpenses + numSupplierPayments;
  const netDailyCash = totalInflow - totalOutflow;
  const pendingCreditCreated = Math.max(0, numSales - numReceived);

  const handleAddProductItem = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setSelectedItems((prev) => [
      ...prev,
      {
        productId: firstProd.id,
        productName: firstProd.name,
        quantity: 1,
        unitPrice: firstProd.sellingPrice,
      },
    ]);
  };

  const handleRemoveProductItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setSelectedItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId: prod.id,
              productName: prod.name,
              unitPrice: prod.sellingPrice,
            }
          : item
      )
    );
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const handleItemPriceChange = (index: number, price: number) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unitPrice: Math.max(0, price) } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (numSales <= 0 && numExpenses <= 0 && numSupplierPayments <= 0 && numCustomerPayments <= 0) {
      setErrorMsg('Please enter at least one value for sales, expenses, or payments.');
      return;
    }

    const payload: DailyBusinessUpdatePayload = {
      date,
      totalSales: numSales,
      moneyReceived: numReceived > 0 ? numReceived : numSales,
      expenses: numExpenses,
      expenseCategory,
      expenseNotes,
      supplierPayments: numSupplierPayments,
      supplierName,
      customerPayments: numCustomerPayments,
      customerId: customerId || undefined,
      notes,
      optionalProducts: selectedItems.length > 0 ? selectedItems : undefined,
    };

    recordDailyBusinessUpdate(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0a1324] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/40 text-slate-200 overflow-hidden my-6">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Header */}
        <div className="relative z-10 px-6 py-5 border-b border-blue-900/50 flex items-center justify-between bg-[#080e1c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-cyan-950/50 border border-cyan-400/40">
              <Receipt className="w-5 h-5 text-cyan-100" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                Daily Business Update
                <span className="text-[10px] font-bold bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Quick Entry (30s)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Enter today's totals for sales, collections, expenses, and payments
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-950/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="relative z-10 p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Top Bar: Date & Target Benchmark */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#081224] border border-blue-900/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">Entry Date:</span>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#060c18] border border-blue-900/70 text-white focus:outline-none focus:border-cyan-500/60 font-mono"
              />
            </div>

            {businessProfile.approxDailySales > 0 && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span>Daily Sales Target:</span>
                <span className="text-cyan-300 font-bold font-mono">
                  {settings.currency}
                  {businessProfile.approxDailySales.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Core Daily Totals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Total Sales */}
            <div className="p-4 rounded-xl bg-[#081224] border border-blue-900/60 hover:border-cyan-500/30 transition-colors">
              <label className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  1. Total Sales Today
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Gross Revenue</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                  {settings.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={totalSales}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setTotalSales(val);
                    // auto-fill money received if empty
                    if (moneyReceived === '') {
                      setMoneyReceived(val);
                    }
                  }}
                  placeholder="e.g. 1500"
                  className="w-full text-sm pl-7 pr-3 py-2 rounded-lg bg-[#060c18] border border-blue-900/80 text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Total value of all items/services sold today
              </p>
            </div>

            {/* 2. Money Received */}
            <div className="p-4 rounded-xl bg-[#081224] border border-blue-900/60 hover:border-emerald-500/30 transition-colors">
              <label className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                  2. Money Received (Inflow)
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Cash + UPI</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                  {settings.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={moneyReceived}
                  onChange={(e) =>
                    setMoneyReceived(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 1200"
                  className="w-full text-sm pl-7 pr-3 py-2 rounded-lg bg-[#060c18] border border-blue-900/80 text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Actual money collected today in cash or online
              </p>
            </div>

            {/* 3. Operating Expenses */}
            <div className="p-4 rounded-xl bg-[#081224] border border-blue-900/60 hover:border-amber-500/30 transition-colors">
              <label className="flex items-center justify-between text-xs font-bold text-amber-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                  3. Today's Expenses
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Overhead</span>
              </label>
              <div className="relative mb-2">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                  {settings.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 180"
                  className="w-full text-sm pl-7 pr-3 py-2 rounded-lg bg-[#060c18] border border-blue-900/80 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="text-[11px] px-2 py-1.5 rounded-lg bg-[#060c18] border border-blue-900/70 text-slate-300 focus:outline-none"
                >
                  <option value="Daily Supplies">Daily Supplies</option>
                  <option value="Meals & Tea">Meals / Refreshment</option>
                  <option value="Transport">Transport / Delivery</option>
                  <option value="Utilities">Electricity / Internet</option>
                  <option value="Rent">Shop Rent Allocation</option>
                  <option value="Other">Other Expenses</option>
                </select>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  placeholder="Optional note"
                  className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#060c18] border border-blue-900/70 text-white focus:outline-none"
                />
              </div>
            </div>

            {/* 4. Supplier Payments */}
            <div className="p-4 rounded-xl bg-[#081224] border border-blue-900/60 hover:border-purple-500/30 transition-colors">
              <label className="flex items-center justify-between text-xs font-bold text-purple-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <IndianRupee className="w-4 h-4 text-purple-400" />
                  4. Supplier Payments (Paid Out)
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Vendors</span>
              </label>
              <div className="relative mb-2">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                  {settings.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={supplierPayments}
                  onChange={(e) =>
                    setSupplierPayments(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 400"
                  className="w-full text-sm pl-7 pr-3 py-2 rounded-lg bg-[#060c18] border border-blue-900/80 text-white font-mono font-bold focus:outline-none focus:border-purple-400"
                />
              </div>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier or distributor name (optional)"
                className="w-full text-[11px] px-2.5 py-1.5 rounded-lg bg-[#060c18] border border-blue-900/70 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Customer Payments (Khata Collections) */}
          <div className="p-4 rounded-xl bg-[#081224] border border-blue-900/60">
            <label className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                5. Customer Payments Received (Old Khata Recovery)
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Credit Collected</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                  {settings.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={customerPayments}
                  onChange={(e) =>
                    setCustomerPayments(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="e.g. 250"
                  className="w-full text-sm pl-7 pr-3 py-2 rounded-lg bg-[#060c18] border border-blue-900/80 text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg bg-[#060c18] border border-blue-900/70 text-slate-300 focus:outline-none"
              >
                <option value="">Top pending customer (auto-apply)</option>
                {customers
                  .filter((c) => c.totalPending > 0)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Pending: {settings.currency}
                      {c.totalPending.toLocaleString()})
                    </option>
                  ))}
              </select>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              Money collected from past credit customers today. Credits their ledger balance.
            </p>
          </div>

          {/* OPTIONAL Product-wise Breakdown */}
          <div className="rounded-xl border border-blue-900/60 bg-[#070e1c] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowProductSection((prev) => !prev)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-950/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-200">
                  Optional: Add Product-Wise Breakdown
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-slate-400 border border-blue-900">
                  {selectedItems.length > 0 ? `${selectedItems.length} items added` : 'Optional'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <span>{showProductSection ? 'Hide' : 'Expand'}</span>
                {showProductSection ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {showProductSection && (
              <div className="p-4 border-t border-blue-900/50 space-y-3 bg-[#060b17]">
                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    Product-wise entry is <strong>completely optional</strong>. If you leave this empty,
                    your daily total sales will be logged as a consolidated sale without affecting individual SKU stocks.
                  </span>
                </div>

                {selectedItems.length > 0 && (
                  <div className="space-y-2">
                    {selectedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg bg-[#081224] border border-blue-900/50"
                      >
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-md bg-[#060c18] border border-blue-900/60 text-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stock: {p.stockQuantity})
                            </option>
                          ))}
                        </select>

                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemQtyChange(idx, Number(e.target.value))}
                            placeholder="Qty"
                            className="w-full text-xs px-2 py-1.5 rounded-md bg-[#060c18] border border-blue-900/60 text-white text-center font-mono font-bold"
                          />
                        </div>

                        <div className="w-24">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                            placeholder="Price"
                            className="w-full text-xs px-2 py-1.5 rounded-md bg-[#060c18] border border-blue-900/60 text-white text-right font-mono"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProductItem(idx)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddProductItem}
                  className="px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 rounded-lg border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product Item</span>
                </button>
              </div>
            )}
          </div>

          {/* Real-Time Daily Financial Summary Preview */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#09152b] to-[#0d1e3d] border border-cyan-500/30 space-y-2.5">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                Today's Financial Summary Preview
              </span>
              <span className="text-[10px] text-cyan-300 font-mono">Live Calculations</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-[#060c18]/80 border border-blue-900/40">
                <span className="text-[10px] text-slate-400 block">Total Cash Inflow</span>
                <span className="font-mono font-bold text-emerald-300">
                  {settings.currency}
                  {totalInflow.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#060c18]/80 border border-blue-900/40">
                <span className="text-[10px] text-slate-400 block">Total Outflow</span>
                <span className="font-mono font-bold text-amber-300">
                  {settings.currency}
                  {totalOutflow.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#060c18]/80 border border-blue-900/40">
                <span className="text-[10px] text-slate-400 block">Net Cash Delta</span>
                <span
                  className={`font-mono font-bold ${
                    netDailyCash >= 0 ? 'text-cyan-300' : 'text-rose-400'
                  }`}
                >
                  {settings.currency}
                  {netDailyCash.toLocaleString()}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#060c18]/80 border border-blue-900/40">
                <span className="text-[10px] text-slate-400 block">Unpaid / Khata</span>
                <span className="font-mono font-bold text-orange-300">
                  {settings.currency}
                  {pendingCreditCreated.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-blue-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 theme-btn-primary rounded-xl text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.35)]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Daily Business Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
