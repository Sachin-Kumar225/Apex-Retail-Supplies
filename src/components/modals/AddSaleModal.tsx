import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
}

interface SaleRow {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({
  isOpen,
  onClose,
  preselectedCustomerId,
}) => {
  const { customers, products, settings, addSale } = useBusiness();

  const [customerId, setCustomerId] = useState(preselectedCustomerId || (customers[0]?.id ?? ''));
  const [items, setItems] = useState<SaleRow[]>([
    {
      productId: products[0]?.id || '',
      quantity: 1,
      unitPrice: products[0]?.sellingPrice || 0,
    },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(settings.defaultTaxRate || 0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [hasCustomPaidAmount, setHasCustomPaidAmount] = useState(false);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Calculate totals
  const subtotal = items.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const taxAmount = Number(((discountedSubtotal * taxRate) / 100).toFixed(2));
  const grandTotal = Number((discountedSubtotal + taxAmount).toFixed(2));

  // Current effective paid
  const effectivePaid = hasCustomPaidAmount ? paidAmount : grandTotal;
  const pendingAmount = Math.max(0, Number((grandTotal - effectivePaid).toFixed(2)));

  const handleProductChange = (index: number, newProductId: string) => {
    const prod = products.find((p) => p.id === newProductId);
    const updated = [...items];
    updated[index] = {
      productId: newProductId,
      quantity: updated[index].quantity,
      unitPrice: prod?.sellingPrice || 0,
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, qty);
    setItems(updated);
  };

  const handlePriceChange = (index: number, price: number) => {
    const updated = [...items];
    updated[index].unitPrice = Math.max(0, price);
    setItems(updated);
  };

  const addItemRow = () => {
    const defaultProd = products[0];
    setItems([
      ...items,
      {
        productId: defaultProd?.id || '',
        quantity: 1,
        unitPrice: defaultProd?.sellingPrice || 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerId) {
      setErrorMsg('Please select a customer.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Please add at least one item to this sale.');
      return;
    }

    // Stock availability validation
    if (!settings.enableNegativeStock) {
      for (const row of items) {
        const prod = products.find((p) => p.id === row.productId);
        if (prod && prod.stockQuantity < row.quantity) {
          setErrorMsg(
            `Insufficient stock for "${prod.name}". Available: ${prod.stockQuantity} units, requested: ${row.quantity} units.`
          );
          return;
        }
      }
    }

    const sale = addSale({
      customerId,
      items,
      discount,
      taxRate,
      paidAmount: effectivePaid,
      paymentMethod,
      notes,
      saleDate,
    });

    if (sale) {
      onClose();
    } else {
      setErrorMsg('Failed to process sale. Please check values.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0a1526] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-2xl overflow-hidden border border-blue-900/80 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/60 bg-[#071120]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Record New Sale</h2>
              <p className="text-xs text-slate-400">Auto-deducts stock and updates customer balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors"
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Customer and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer <span className="text-rose-400">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full text-xs theme-input px-3 py-2.5"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0b1b36] text-white">
                    {c.name} ({c.phone || 'No phone'}) {c.totalPending > 0 ? `• Due: ${formatCurrency(c.totalPending, settings.currency)}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sale Date
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
                className="w-full text-xs theme-input px-3 py-2"
              />
            </div>
          </div>

          {/* Product Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Products / Items <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>

            <div className="border border-blue-900/70 rounded-xl overflow-hidden bg-[#071120]/60">
              <div className="divide-y divide-blue-900/50">
                {items.map((row, idx) => {
                  const currentProd = products.find((p) => p.id === row.productId);
                  const isLowStock = currentProd && currentProd.stockQuantity < row.quantity;
                  return (
                    <div key={idx} className="p-3 grid grid-cols-12 gap-2.5 items-center">
                      <div className="col-span-12 sm:col-span-5">
                        <select
                          value={row.productId}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full text-xs theme-input px-2.5 py-2"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id} className="bg-[#0b1b36] text-white">
                              {p.name} (In Stock: {p.stockQuantity})
                            </option>
                          ))}
                        </select>
                        {isLowStock && (
                          <span className="text-[10px] text-rose-400 font-medium">
                            Only {currentProd?.stockQuantity} available!
                          </span>
                        )}
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                          className="w-full text-xs theme-input px-2.5 py-2 text-center font-mono font-bold text-white"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <div className="relative">
                          <span className="absolute left-2 top-2 text-[10px] text-slate-400 font-mono">
                            {settings.currency}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={row.unitPrice}
                            onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-full text-xs theme-input pl-6 pr-1 py-2 text-right font-mono"
                          />
                        </div>
                      </div>
                      <div className="col-span-3 sm:col-span-2 text-right text-xs font-semibold text-cyan-300 font-mono">
                        {formatCurrency(row.quantity * row.unitPrice, settings.currency)}
                      </div>
                      <div className="col-span-1 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Discount and Tax */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Discount ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-xs theme-input px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Tax / GST (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-xs theme-input px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const m = e.target.value as PaymentMethod;
                  setPaymentMethod(m);
                  if (m === 'Credit') {
                    setHasCustomPaidAmount(true);
                    setPaidAmount(0);
                  } else if (!hasCustomPaidAmount) {
                    setPaidAmount(grandTotal);
                  }
                }}
                className="w-full text-xs theme-input px-2.5 py-2"
              >
                <option value="Cash" className="bg-[#0b1b36] text-white">Cash</option>
                <option value="UPI" className="bg-[#0b1b36] text-white">UPI</option>
                <option value="Card" className="bg-[#0b1b36] text-white">Card</option>
                <option value="Bank Transfer" className="bg-[#0b1b36] text-white">Bank Transfer</option>
                <option value="Credit" className="bg-[#0b1b36] text-white">Credit (Khata)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Amount Paid ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                max={grandTotal}
                step="0.01"
                value={effectivePaid}
                onChange={(e) => {
                  setHasCustomPaidAmount(true);
                  setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0));
                }}
                className="w-full text-xs theme-input px-3 py-2 font-mono font-bold text-emerald-300"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Sale / Delivery Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Delivered to customer address, warranty info..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs theme-input px-3 py-2"
            />
          </div>

          {/* Calculation summary badge */}
          <div className="p-4 bg-[#071120] rounded-xl border border-blue-900/70 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono text-white">{formatCurrency(subtotal, settings.currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount:</span>
                <span className="font-mono">-{formatCurrency(discount, settings.currency)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Tax ({taxRate}%):</span>
                <span className="font-mono text-white">+{formatCurrency(taxAmount, settings.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-white border-t border-blue-900/60 pt-1.5">
              <span>Grand Total:</span>
              <span className="text-cyan-300 font-mono">{formatCurrency(grandTotal, settings.currency)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1 border-t border-dashed border-blue-900/50">
              <span className="text-emerald-400">Paid Now:</span>
              <span className="text-emerald-400 font-mono">{formatCurrency(effectivePaid, settings.currency)}</span>
            </div>
            {pendingAmount > 0 && (
              <div className="flex justify-between font-semibold text-amber-400">
                <span>Added to Khata (Due):</span>
                <span className="font-mono">{formatCurrency(pendingAmount, settings.currency)}</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold theme-btn-secondary rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold theme-btn-primary rounded-xl"
            >
              Confirm & Create Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
