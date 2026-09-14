import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedCustomerId,
}) => {
  const { customers, recordPayment, settings } = useBusiness();

  const [customerId, setCustomerId] = useState(
    preselectedCustomerId || customers.find((c) => c.totalPending > 0)?.id || customers[0]?.id || ''
  );
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [notes, setNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedCustomer = customers.find((c) => c.id === customerId);

  useEffect(() => {
    if (preselectedCustomerId) {
      setCustomerId(preselectedCustomerId);
      const cust = customers.find((c) => c.id === preselectedCustomerId);
      if (cust && cust.totalPending > 0) {
        setAmount(cust.totalPending);
      }
    } else if (selectedCustomer && selectedCustomer.totalPending > 0 && amount === '') {
      setAmount(selectedCustomer.totalPending);
    }
  }, [preselectedCustomerId, isOpen]);

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust && cust.totalPending > 0) {
      setAmount(cust.totalPending);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerId) {
      setErrorMsg('Please select a customer.');
      return;
    }

    if (amount === '' || Number(amount) <= 0) {
      setErrorMsg('Please enter a payment amount greater than zero.');
      return;
    }

    const rec = recordPayment({
      customerId,
      amount: Number(amount),
      paymentMethod,
      notes: notes.trim(),
      date: paymentDate ? new Date(`${paymentDate}T12:00:00`).toISOString() : new Date().toISOString(),
    });

    if (rec) {
      onClose();
    } else {
      setErrorMsg('Could not process payment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-[#0a1526] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-md overflow-hidden border border-blue-900/80">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/60 bg-[#071120]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Record Khata Payment</h2>
              <p className="text-xs text-slate-400">Collect dues and update digital ledger</p>
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
              Customer <span className="text-rose-400">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full text-xs theme-input px-3 py-2.5"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0b1b36] text-white">
                  {c.name} — Pending Due: {formatCurrency(c.totalPending, settings.currency)}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-amber-300">Current Outstanding Balance</div>
                <div className="text-xs text-amber-400/80">Phone: {selectedCustomer.phone || 'N/A'}</div>
              </div>
              <div className="text-lg font-extrabold text-amber-400 font-mono">
                {formatCurrency(selectedCustomer.totalPending, settings.currency)}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount Received ({settings.currency}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full text-xs theme-input px-3.5 py-2 font-mono font-bold text-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs theme-input px-3 py-2"
              >
                <option value="UPI" className="bg-[#0b1b36] text-white">UPI</option>
                <option value="Cash" className="bg-[#0b1b36] text-white">Cash</option>
                <option value="Card" className="bg-[#0b1b36] text-white">Card</option>
                <option value="Bank Transfer" className="bg-[#0b1b36] text-white">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full text-xs theme-input px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes / Transaction ID
            </label>
            <input
              type="text"
              placeholder="e.g. GooglePay ref #30294, Cheque deposited..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs theme-input px-3.5 py-2"
            />
          </div>

          {selectedCustomer && amount !== '' && (
            <div className="p-3 bg-[#071120] border border-blue-900/60 rounded-xl text-xs flex justify-between text-slate-400">
              <span>Remaining Balance After Payment:</span>
              <span className="font-bold text-white font-mono">
                {formatCurrency(
                  Math.max(0, selectedCustomer.totalPending - (Number(amount) || 0)),
                  settings.currency
                )}
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
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all active:scale-95"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
