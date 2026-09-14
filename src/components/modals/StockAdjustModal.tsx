import React, { useState, useEffect } from 'react';
import { X, ArrowUpDown, AlertCircle } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Product } from '../../types';

interface StockAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: Product | null;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  isOpen,
  onClose,
  selectedProduct,
}) => {
  const { products, adjustStock, settings } = useBusiness();

  const [productId, setProductId] = useState(selectedProduct?.id || products[0]?.id || '');
  const [type, setType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState<number | ''>(10);
  const [reason, setReason] = useState('Stock restock from supplier');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (selectedProduct) {
        setProductId(selectedProduct.id);
      } else if (products.length > 0 && (!productId || !products.some((p) => p.id === productId))) {
        setProductId(products[0].id);
      }
      setErrorMsg('');
    }
  }, [isOpen, selectedProduct, products]);

  if (!isOpen) return null;

  const currentProd = products.find((p) => p.id === productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!productId) {
      setErrorMsg('Please select a product.');
      return;
    }

    if (quantity === '' || Number(quantity) <= 0) {
      setErrorMsg('Please enter a quantity greater than zero.');
      return;
    }

    if (type === 'out' && !settings.enableNegativeStock && currentProd && currentProd.stockQuantity < Number(quantity)) {
      setErrorMsg(`Cannot remove ${quantity} units. Current stock is only ${currentProd.stockQuantity}.`);
      return;
    }

    const success = adjustStock(productId, type, Number(quantity), reason.trim() || 'Manual stock update');

    if (success) {
      onClose();
    } else {
      setErrorMsg('Could not process stock adjustment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-[#0a1526] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-md overflow-hidden border border-blue-900/80">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/60 bg-[#071120]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Stock Adjustment</h2>
              <p className="text-xs text-slate-400">Record stock-in, stock-out, or audit changes</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Product <span className="text-rose-400">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full text-xs theme-input px-3 py-2.5"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0b1b36] text-white">
                  {p.name} (Current: {p.stockQuantity} {p.stockQuantity <= p.minStockLevel ? '• Low Stock' : ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Adjustment Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('in');
                  setReason('Supplier restock delivery');
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  type === 'in'
                    ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                    : 'border-blue-900/60 bg-[#071120] text-slate-400 hover:bg-blue-900/30 hover:text-white'
                }`}
              >
                + Stock In
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('out');
                  setReason('Damaged / write-off / return');
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  type === 'out'
                    ? 'border-rose-500/60 bg-rose-950/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                    : 'border-blue-900/60 bg-[#071120] text-slate-400 hover:bg-blue-900/30 hover:text-white'
                }`}
              >
                - Stock Out
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('adjustment');
                  setReason('Physical audit reconciliation');
                }}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                  type === 'adjustment'
                    ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                    : 'border-blue-900/60 bg-[#071120] text-slate-400 hover:bg-blue-900/30 hover:text-white'
                }`}
              >
                Audit Set
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {type === 'adjustment' ? 'New Exact Stock Count' : 'Quantity to Apply'} <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min={type === 'adjustment' ? 0 : 1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full text-xs theme-input px-3.5 py-2.5 font-mono font-bold text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reason / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. PO #8492, Damaged in shipment, Audit"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs theme-input px-3.5 py-2.5"
            />
          </div>

          {currentProd && (
            <div className="p-3 bg-[#071120] border border-blue-900/60 rounded-xl text-xs flex justify-between items-center text-slate-400">
              <span>Current Stock: <strong className="text-white font-mono">{currentProd.stockQuantity}</strong></span>
              <span>
                Resulting Stock:{' '}
                <strong className="text-cyan-300 font-bold font-mono">
                  {type === 'in'
                    ? currentProd.stockQuantity + (Number(quantity) || 0)
                    : type === 'out'
                    ? Math.max(0, currentProd.stockQuantity - (Number(quantity) || 0))
                    : Number(quantity) || 0}
                </strong>
              </span>
            </div>
          )}

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
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
