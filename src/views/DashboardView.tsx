import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Users,
  AlertTriangle,
  Package,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Clock,
  ChevronRight,
  CreditCard,
  ShoppingCart,
  Receipt,
  FileText,
  PackagePlus,
  Zap,
  Target,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  TrendLineChart,
  TopProductsChart,
  ExpenseCategoryChart,
} from '../components/charts/BusinessCharts';
import { AiCommandCenter } from '../components/dashboard/AiCommandCenter';
import { DailyBusinessUpdateModal } from '../components/modals/DailyBusinessUpdateModal';
import { BusinessSetupModal } from '../components/modals/BusinessSetupModal';
import { Customer, Invoice } from '../types';

interface DashboardViewProps {
  onNavigate: (section: string) => void;
  onOpenAddSale: () => void;
  onOpenAddCustomer: () => void;
  onOpenAddProduct: () => void;
  onOpenAddExpense: () => void;
  onOpenInvoicePreview: (inv: Invoice) => void;
  onCollectPayment: (cust: Customer) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddSale,
  onOpenAddCustomer,
  onOpenAddProduct,
  onOpenAddExpense,
  onOpenInvoicePreview,
  onCollectPayment,
}) => {
  const { metrics, settings, sales, expenses, products, customers, invoices, businessProfile } =
    useBusiness();

  const [isDailyUpdateOpen, setIsDailyUpdateOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Compute 7-day trend data from real sales & expenses
  const trendData = React.useMemo(() => {
    const days = 7;
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

      const daySales = sales
        .filter((s) => s.saleDate.startsWith(dateStr))
        .reduce((sum, s) => sum + s.grandTotal, 0);

      const dayExpenses = expenses
        .filter((e) => e.date.startsWith(dateStr))
        .reduce((sum, e) => sum + e.amount, 0);

      const dayProfit = daySales - dayExpenses;

      result.push({
        label: dayLabel,
        sales: Number(daySales.toFixed(2)),
        expenses: Number(dayExpenses.toFixed(2)),
        profit: Number(dayProfit.toFixed(2)),
      });
    }
    return result;
  }, [sales, expenses]);

  // Top selling products
  const topProductsData = React.useMemo(() => {
    return products.map((p) => ({
      name: p.name,
      category: p.category,
      totalSold: p.totalSold || 0,
      revenue: (p.totalSold || 0) * p.sellingPrice,
    }));
  }, [products]);

  // Expense categories
  const expenseCategoriesData = React.useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [expenses]);

  // Recent transactions
  const recentSales = sales.slice(0, 5);
  // Pending payments list
  const pendingCustomers = customers.filter((c) => c.totalPending > 0).slice(0, 4);
  // Low stock products
  const lowStockList = products.filter((p) => p.stockQuantity <= p.minStockLevel).slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 theme-card p-5 sm:p-6 theme-card-hover">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Business Overview
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-bold bg-cyan-950/70 text-cyan-300 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.15)]">
              Live Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Welcome back, <span className="font-semibold text-cyan-300">{settings.ownerName}</span> • {settings.businessName}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsDailyUpdateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all duration-200 hover:-translate-y-0.5"
            title="Fast 30-second daily totals entry for sales, collections, expenses, supplier & customer payments"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            Daily Business Update
          </button>

          <button
            onClick={onOpenAddSale}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs theme-btn-primary rounded-xl"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add Sale
          </button>
          <button
            onClick={onOpenAddCustomer}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold theme-btn-secondary rounded-xl"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            Add Customer
          </button>
          <button
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold theme-btn-secondary rounded-xl"
          >
            <PackagePlus className="w-3.5 h-3.5 text-cyan-400" />
            Add Product
          </button>
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 hover:border-rose-400/50 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-rose-950/40"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
            Add Expense
          </button>

          <button
            onClick={() => setIsSetupModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            title="Review or edit your Business Setup Questionnaire & AI profile targets"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Business Profile Setup
          </button>
        </div>
      </div>

      {/* Personalized Business Targets & Goals Benchmark Strip */}
      <div className="rounded-2xl bg-linear-to-r from-[#071124] via-[#09152b] to-[#0c1e3d] border border-cyan-500/30 p-4 sm:p-5 shadow-lg shadow-cyan-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Business Info & Goals */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                Personalized Business Benchmarks:
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/30">
                {businessProfile.businessType || 'Retail Store'}
              </span>
              <span className="text-xs text-slate-400">
                {businessProfile.businessName}
              </span>
            </div>

            {/* Business Goals Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(businessProfile.businessGoals || []).map((goal, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-[#060c18] border border-blue-900/60 text-slate-300"
                >
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  {goal}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Targets Progress Bars */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-6 bg-[#060c18]/80 p-3 rounded-xl border border-blue-900/50">
            {/* Sales vs Daily Target */}
            <div className="min-w-[160px]">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-slate-400">Daily Sales vs Target</span>
                <span className="font-mono font-bold text-cyan-300">
                  {formatCurrency(metrics.todaySales, settings.currency)} /{' '}
                  {businessProfile.approxDailySales > 0
                    ? formatCurrency(businessProfile.approxDailySales, settings.currency)
                    : 'Target'}
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-linear-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (metrics.todaySales / Math.max(1, businessProfile.approxDailySales || 1)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-500 text-right mt-0.5 font-mono">
                {businessProfile.approxDailySales > 0
                  ? `${Math.round(
                      (metrics.todaySales / businessProfile.approxDailySales) * 100
                    )}% achieved today`
                  : 'Set target in setup'}
              </div>
            </div>

            {/* Quick Actions inside tracker */}
            <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-blue-900/60 pt-2 sm:pt-0 sm:pl-3">
              <button
                onClick={() => setIsDailyUpdateOpen(true)}
                className="px-3 py-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg transition-all"
              >
                + Log Today
              </button>
              <button
                onClick={() => setIsSetupModalOpen(true)}
                className="px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-white bg-blue-950/40 rounded-lg border border-blue-900/50 transition-all"
                title="Update questionnaire answers"
              >
                Edit Goals
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Business Command Center */}
      <AiCommandCenter
        onNavigate={onNavigate}
        onOpenAddSale={onOpenAddSale}
        onOpenAddExpense={onOpenAddExpense}
        onOpenAddProduct={onOpenAddProduct}
        onOpenAddCustomer={onOpenAddCustomer}
      />

      {/* Primary KPI Metrics: Today's Snapshot */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Today's Performance
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Today's Sales */}
          <div className="theme-card p-4 sm:p-5 theme-card-hover">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Today's Sales</span>
              <span className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_8px_rgba(52,211,153,0.2)]">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-white mt-2 font-mono tracking-tight">
              {formatCurrency(metrics.todaySales, settings.currency)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Live customer sales recorded today</div>
          </div>

          {/* Today's Expenses */}
          <div className="theme-card p-4 sm:p-5 theme-card-hover">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Today's Expenses</span>
              <span className="w-7 h-7 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.2)]">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-white mt-2 font-mono tracking-tight">
              {formatCurrency(metrics.todayExpenses, settings.currency)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Overhead & purchases logged today</div>
          </div>

          {/* Today's Profit */}
          <div className="theme-card p-4 sm:p-5 theme-card-hover">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Today's Net Profit</span>
              <span className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                <IndianRupee className="w-4 h-4" />
              </span>
            </div>
            <div
              className={`text-2xl font-black mt-2 font-mono tracking-tight ${
                metrics.todayProfit >= 0 ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]' : 'text-rose-400'
              }`}
            >
              {formatCurrency(metrics.todayProfit, settings.currency)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Net difference (Sales minus Expenses)</div>
          </div>
        </div>
      </div>

      {/* Monthly & Store Health Metrics */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Monthly Aggregates & Operational Metrics
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {/* Monthly Sales */}
          <div className="theme-card p-4 theme-card-hover">
            <div className="text-[11px] font-semibold text-slate-400">Monthly Sales</div>
            <div className="text-lg font-bold text-white mt-1 font-mono">
              {formatCurrency(metrics.monthlySales, settings.currency)}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Current billing month
            </div>
          </div>

          {/* Monthly Expenses */}
          <div className="theme-card p-4 theme-card-hover">
            <div className="text-[11px] font-semibold text-slate-400">Monthly Expenses</div>
            <div className="text-lg font-bold text-white mt-1 font-mono">
              {formatCurrency(metrics.monthlyExpenses, settings.currency)}
            </div>
            <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingDown className="w-3 h-3" /> Store operating costs
            </div>
          </div>

          {/* Monthly Profit */}
          <div className="theme-card p-4 theme-card-hover">
            <div className="text-[11px] font-semibold text-slate-400">Monthly Net Profit</div>
            <div
              className={`text-lg font-bold mt-1 font-mono ${
                metrics.monthlyProfit >= 0 ? 'text-cyan-300' : 'text-rose-400'
              }`}
            >
              {formatCurrency(metrics.monthlyProfit, settings.currency)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              Margin: {metrics.monthlySales > 0 ? ((metrics.monthlyProfit / metrics.monthlySales) * 100).toFixed(1) : 0}%
            </div>
          </div>

          {/* Pending Khata Payments */}
          <div
            onClick={() => onNavigate('payments')}
            className="theme-card p-4 border-amber-500/30 hover:border-amber-400/50 hover:shadow-[0_0_18px_rgba(245,158,11,0.15)] cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-300">
              <span>Khata Dues (Pending)</span>
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-black text-amber-300 mt-1 font-mono">
              {formatCurrency(metrics.pendingPayments, settings.currency)}
            </div>
            <div className="text-[11px] text-amber-400 mt-1 font-medium underline flex items-center gap-1">
              Collect outstanding dues →
            </div>
          </div>

          {/* Total Customers */}
          <div
            onClick={() => onNavigate('customers')}
            className="theme-card p-4 theme-card-hover cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Total Customers</span>
              <Users className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1 font-mono">
              {metrics.totalCustomers}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Active customer accounts</div>
          </div>

          {/* Total Products */}
          <div
            onClick={() => onNavigate('products')}
            className="theme-card p-4 theme-card-hover cursor-pointer"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>Catalog SKUs</span>
              <Package className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-lg font-bold text-white mt-1 font-mono">
              {metrics.totalProducts}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Tracked inventory items</div>
          </div>

          {/* Low Stock Alerts */}
          <div
            onClick={() => onNavigate('products')}
            className={`rounded-xl p-4 border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer sm:col-span-2 lg:col-span-2 ${
              metrics.lowStockProducts > 0
                ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400/60 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                : 'theme-card theme-card-hover'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className={metrics.lowStockProducts > 0 ? 'text-rose-300' : 'text-slate-400'}>
                Low / Out-of-Stock Items
              </span>
              <AlertTriangle className={`w-3.5 h-3.5 ${metrics.lowStockProducts > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className={`text-lg font-extrabold font-mono ${metrics.lowStockProducts > 0 ? 'text-rose-300' : 'text-white'}`}>
                {metrics.lowStockProducts} products
              </div>
              <div className="text-[11px] font-semibold text-rose-400 underline">
                View restock list →
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit 7-Day Trend Chart */}
        <div className="lg:col-span-2 theme-card p-5 sm:p-6 theme-card-hover">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-white">7-Day Sales, Expenses & Profit Trend</h2>
              <p className="text-xs text-slate-400">Live transaction progression over the last 7 days</p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Total 7-day Sales: <strong className="text-cyan-300 font-bold">{formatCurrency(trendData.reduce((s, d) => s + d.sales, 0), settings.currency)}</strong>
            </div>
          </div>
          <TrendLineChart data={trendData} currency={settings.currency} />
        </div>

        {/* Expense Category Distribution */}
        <div className="theme-card p-5 sm:p-6 theme-card-hover flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Expense Breakdown</h2>
                <p className="text-xs text-slate-400">Distribution by operational category</p>
              </div>
              <button
                onClick={() => onNavigate('expenses')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                View all
              </button>
            </div>
            <ExpenseCategoryChart categories={expenseCategoriesData} currency={settings.currency} />
          </div>

          <div className="mt-6 pt-4 border-t border-blue-950/70 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Total Recorded Expenses:</span>
            <span className="font-bold text-white font-mono">
              {formatCurrency(metrics.monthlyExpenses, settings.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Products + Low Stock Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-selling products */}
        <div className="theme-card p-5 sm:p-6 theme-card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Top-Selling Products</h2>
              <p className="text-xs text-slate-400">Ranked by total units sold</p>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Full catalog
            </button>
          </div>
          <TopProductsChart products={topProductsData} currency={settings.currency} />
        </div>

        {/* Low Stock Warning Section */}
        <div className="theme-card p-5 sm:p-6 theme-card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Low Stock Alerts
                {lowStockList.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/30">
                    {lowStockList.length} critical
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Products near or below minimum reorder thresholds</p>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Restock All
            </button>
          </div>

          {lowStockList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              All products are currently well-stocked above minimum thresholds.
            </div>
          ) : (
            <div className="divide-y divide-blue-950/70">
              {lowStockList.map((prod) => (
                <div key={prod.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-100">{prod.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      SKU: {prod.sku} • Min Safe: {prod.minStockLevel} units
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        prod.stockQuantity === 0
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      }`}
                    >
                      {prod.stockQuantity === 0 ? 'Out of Stock (0)' : `${prod.stockQuantity} remaining`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions & Pending Payments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="theme-card p-5 sm:p-6 theme-card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Transactions</h2>
              <p className="text-xs text-slate-400">Latest completed sales orders & invoices</p>
            </div>
            <button
              onClick={() => onNavigate('sales')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              View all sales
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No sales transactions yet.</div>
          ) : (
            <div className="divide-y divide-blue-950/70">
              {recentSales.map((sale) => {
                const matchedInvoice = invoices.find((inv) => inv.saleId === sale.id || inv.invoiceNumber === sale.invoiceNumber);
                return (
                  <div key={sale.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-100">{sale.customerName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {sale.invoiceNumber} • {formatDate(sale.saleDate)} • via {sale.paymentMethod}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-white font-mono">
                          {formatCurrency(sale.grandTotal, settings.currency)}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {sale.pendingAmount > 0 ? (
                            <span className="text-amber-400 font-semibold">
                              Due: {formatCurrency(sale.pendingAmount, settings.currency)}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">Settled</span>
                          )}
                        </div>
                      </div>
                      {matchedInvoice && (
                        <button
                          onClick={() => onOpenInvoicePreview(matchedInvoice)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-blue-950/60 transition-colors"
                          title="View Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Payments / Khata Quick Collect */}
        <div className="theme-card p-5 sm:p-6 theme-card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Pending Khata Receivables</h2>
              <p className="text-xs text-slate-400">Customers with outstanding account balances</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Open Khata ledger
            </button>
          </div>

          {pendingCustomers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No outstanding dues! All customer Khata balances are cleared.
            </div>
          ) : (
            <div className="divide-y divide-blue-950/70">
              {pendingCustomers.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-100">{c.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Phone: {c.phone || 'N/A'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-amber-300 font-mono text-sm">
                        {formatCurrency(c.totalPending, settings.currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">Total Due</div>
                    </div>
                    <button
                      onClick={() => onCollectPayment(c)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-lg transition-all hover:-translate-y-0.5 shadow-xs"
                    >
                      Collect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Business Update Modal */}
      <DailyBusinessUpdateModal
        isOpen={isDailyUpdateOpen}
        onClose={() => setIsDailyUpdateOpen(false)}
      />

      {/* Business Setup Questionnaire Modal */}
      <BusinessSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
      />
    </div>
  );
};
