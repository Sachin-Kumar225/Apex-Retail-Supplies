import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Download,
  TrendingDown,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Expense, ExpenseCategory } from '../types';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';

interface ExpensesViewProps {
  onOpenAddExpense: () => void;
  onEditExpense: (e: Expense) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  onOpenAddExpense,
  onEditExpense,
}) => {
  const { expenses, deleteExpense, settings, metrics } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const categories = ['ALL', 'Rent', 'Electricity', 'Salary', 'Transport', 'Purchase', 'Marketing', 'Maintenance', 'Other'];

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || exp.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalExpenseVal = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category to find top expense
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  const handleExportCSV = () => {
    const rows = filteredExpenses.map((e) => ({
      Date: e.date,
      Category: e.category,
      Description: e.description,
      Amount: e.amount,
      PaymentMethod: e.paymentMethod,
      Notes: e.notes || '',
    }));
    exportToCSV(`business_expenses_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-card p-5 sm:p-6 theme-card-hover">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Expense Tracker
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-950/70 text-rose-300 rounded-full border border-rose-500/30">
              {expenses.length} receipts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor overhead, supplier payments, utility bills, and salary disbursements
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
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold theme-btn-primary rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="theme-card p-4.5 theme-card-hover">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today's Expenses</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {formatCurrency(metrics.todayExpenses, settings.currency)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Logged for today</div>
        </div>

        <div className="theme-card p-4.5 theme-card-hover border-rose-500/30">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Monthly Expenses</div>
          <div className="text-2xl font-black text-rose-300 mt-1 font-mono">
            {formatCurrency(metrics.monthlyExpenses, settings.currency)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total this calendar month</div>
        </div>

        <div className="theme-card p-4.5 theme-card-hover">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Top Expense Category</div>
          <div className="text-2xl font-black text-cyan-300 mt-1 truncate">
            {topCategoryEntry ? topCategoryEntry[0] : 'N/A'}
          </div>
          <div className="text-xs text-rose-400 mt-1 font-mono font-medium">
            {topCategoryEntry ? formatCurrency(topCategoryEntry[1], settings.currency) : 'No expenses'}
          </div>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="theme-card p-4 theme-card-hover space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search expenses by description, receipt reference, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs theme-input pl-10 pr-4 py-2.5"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                categoryFilter === cat
                  ? 'theme-btn-primary'
                  : 'theme-btn-secondary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="theme-card overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No expenses recorded for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-900/60 bg-[#071120] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/40">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-blue-900/20 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/50 text-cyan-300 font-bold text-[11px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">
                      <div className="font-semibold text-white">{exp.description}</div>
                      {exp.notes && <div className="text-[10px] text-slate-400 italic">{exp.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400 text-sm whitespace-nowrap">
                      {formatCurrency(exp.amount, settings.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-blue-900/40 rounded-lg transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete this expense?`)) {
                              deleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
