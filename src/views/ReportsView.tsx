import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Award,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { formatCurrency, formatDate, exportToCSV } from '../utils/formatters';
import {
  TrendLineChart,
  TopProductsChart,
  ExpenseCategoryChart,
} from '../components/charts/BusinessCharts';

type TimeRange = 'today' | '7days' | 'month' | 'year' | 'all';

export const ReportsView: React.FC = () => {
  const { sales, expenses, products, customers, settings } = useBusiness();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  // Filtered dataset based on time range
  const { filteredSales, filteredExpenses } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const fSales = sales.filter((s) => {
      const sDate = new Date(s.saleDate);
      if (timeRange === 'today') return s.saleDate.startsWith(todayStr);
      if (timeRange === '7days') return sDate >= sevenDaysAgo;
      if (timeRange === 'month') return sDate.getFullYear() === currentYear && sDate.getMonth() === currentMonth;
      if (timeRange === 'year') return sDate.getFullYear() === currentYear;
      return true;
    });

    const fExpenses = expenses.filter((e) => {
      const eDate = new Date(e.date);
      if (timeRange === 'today') return e.date.startsWith(todayStr);
      if (timeRange === '7days') return eDate >= sevenDaysAgo;
      if (timeRange === 'month') return eDate.getFullYear() === currentYear && eDate.getMonth() === currentMonth;
      if (timeRange === 'year') return eDate.getFullYear() === currentYear;
      return true;
    });

    return { filteredSales: fSales, filteredExpenses: fExpenses };
  }, [sales, expenses, timeRange]);

  const totalSales = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

  // Chart data for trend
  const trendData = useMemo(() => {
    const buckets: Record<string, { sales: number; expenses: number; profit: number }> = {};

    filteredSales.forEach((s) => {
      const key = s.saleDate.split('T')[0];
      if (!buckets[key]) buckets[key] = { sales: 0, expenses: 0, profit: 0 };
      buckets[key].sales += s.grandTotal;
    });

    filteredExpenses.forEach((e) => {
      const key = e.date.split('T')[0];
      if (!buckets[key]) buckets[key] = { sales: 0, expenses: 0, profit: 0 };
      buckets[key].expenses += e.amount;
    });

    const sortedKeys = Object.keys(buckets).sort();
    if (sortedKeys.length === 0) {
      return [
        { label: 'Start', sales: 0, expenses: 0, profit: 0 },
        { label: 'End', sales: 0, expenses: 0, profit: 0 },
      ];
    }

    return sortedKeys.map((key) => {
      const item = buckets[key];
      const d = new Date(key);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        label,
        sales: Number(item.sales.toFixed(2)),
        expenses: Number(item.expenses.toFixed(2)),
        profit: Number((item.sales - item.expenses).toFixed(2)),
      };
    });
  }, [filteredSales, filteredExpenses]);

  // Top products
  const topProductsData = useMemo(() => {
    const map: Record<string, { name: string; category: string; totalSold: number; revenue: number }> = {};
    filteredSales.forEach((s) => {
      s.items.forEach((it) => {
        if (!map[it.productId]) {
          const p = products.find((prod) => prod.id === it.productId);
          map[it.productId] = {
            name: it.productName,
            category: p?.category || 'General',
            totalSold: 0,
            revenue: 0,
          };
        }
        map[it.productId].totalSold += it.quantity;
        map[it.productId].revenue += it.subtotal;
      });
    });
    return Object.values(map);
  }, [filteredSales, products]);

  // Expense categories
  const expenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([category, amount]) => ({ category, amount }));
  }, [filteredExpenses]);

  // Top customers
  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; count: number; spend: number }> = {};
    filteredSales.forEach((s) => {
      if (!map[s.customerId]) {
        map[s.customerId] = { name: s.customerName, count: 0, spend: 0 };
      }
      map[s.customerId].count += 1;
      map[s.customerId].spend += s.grandTotal;
    });
    return Object.values(map).sort((a, b) => b.spend - a.spend).slice(0, 5);
  }, [filteredSales]);

  const handleExportFullReport = () => {
    const summaryRow = [
      {
        ReportTimeframe: timeRange.toUpperCase(),
        GeneratedAt: new Date().toISOString(),
        TotalSales: totalSales,
        TotalExpenses: totalExpenses,
        NetProfit: netProfit,
        ProfitMarginPct: profitMargin.toFixed(2),
        TotalTransactions: filteredSales.length,
      },
    ];
    exportToCSV(`business_financial_report_${timeRange}_${new Date().toISOString().split('T')[0]}`, summaryRow);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-card p-5 sm:p-6 theme-card-hover">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Business Reports & Analytics
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-950/70 text-cyan-300 rounded-full border border-cyan-500/30">
              P&L Audits
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Profit and loss analysis, customer value ranking, and inventory throughput
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportFullReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold theme-btn-secondary rounded-xl"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export Summary
          </button>
        </div>
      </div>

      {/* Time Range Pills */}
      <div className="theme-card p-3 theme-card-hover flex items-center gap-2 overflow-x-auto">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 hidden sm:block">
          Timeframe:
        </div>
        {[
          { id: 'today', label: "Today" },
          { id: '7days', label: 'Last 7 Days' },
          { id: 'month', label: 'This Month' },
          { id: 'year', label: 'This Year' },
          { id: 'all', label: 'All Time' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setTimeRange(btn.id as TimeRange)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 whitespace-nowrap ${
              timeRange === btn.id
                ? 'theme-btn-primary'
                : 'theme-btn-secondary'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* P&L Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="theme-card p-5 theme-card-hover">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Sales Revenue</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {formatCurrency(totalSales, settings.currency)}
          </div>
          <div className="text-xs text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {filteredSales.length} total orders
          </div>
        </div>

        <div className="theme-card p-5 theme-card-hover border-rose-500/30">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Total Operating Expenses</div>
          <div className="text-2xl font-black text-rose-300 mt-1 font-mono">
            {formatCurrency(totalExpenses, settings.currency)}
          </div>
          <div className="text-xs text-rose-400 mt-1 font-medium flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            {filteredExpenses.length} expense items
          </div>
        </div>

        <div className="theme-card p-5 theme-card-hover border-cyan-500/30">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Business Profit</div>
          <div
            className={`text-2xl font-black mt-1 font-mono ${
              netProfit >= 0 ? 'text-cyan-300' : 'text-rose-400'
            }`}
          >
            {formatCurrency(netProfit, settings.currency)}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            Net return after overhead
          </div>
        </div>

        <div className="theme-card p-5 theme-card-hover">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Profit Margin</div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            {profitMargin.toFixed(1)}%
          </div>
          <div className="text-xs text-cyan-400/80 mt-1">Profit percentage on revenue</div>
        </div>
      </div>

      {/* Trend Visualizer */}
      <div className="theme-card p-5 sm:p-6 theme-card-hover">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white">Period Revenue & Profit Trajectory</h2>
            <p className="text-xs text-slate-400">Visual progression across selected timeframe</p>
          </div>
        </div>
        <TrendLineChart data={trendData} currency={settings.currency} />
      </div>

      {/* 2-Column Analytics: Top Products & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products */}
        <div className="theme-card p-5 sm:p-6 theme-card-hover">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">Top Performing Products</h2>
            <p className="text-xs text-slate-400">Ranked by volume sold in this period</p>
          </div>
          {topProductsData.length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center">No sales in this period.</div>
          ) : (
            <TopProductsChart products={topProductsData} currency={settings.currency} />
          )}
        </div>

        {/* Customers */}
        <div className="theme-card p-5 sm:p-6 theme-card-hover">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Highest Spending Customers
            </h2>
            <p className="text-xs text-slate-400">Top clients by gross order value</p>
          </div>
          {topCustomers.length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center">No customer transactions in this period.</div>
          ) : (
            <div className="divide-y divide-blue-900/50">
              {topCustomers.map((c, i) => (
                <div key={c.name} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-950 text-cyan-300 border border-blue-800 font-bold text-[10px] flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[11px] text-slate-400">{c.count} orders placed</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-cyan-300 text-sm">
                    {formatCurrency(c.spend, settings.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expense breakdown */}
      <div className="theme-card p-5 sm:p-6 theme-card-hover">
        <div className="mb-4">
          <h2 className="text-base font-bold text-white">Expense Allocation in Period</h2>
          <p className="text-xs text-slate-400">Breakdown of operational disbursements</p>
        </div>
        <ExpenseCategoryChart categories={expenseCategories} currency={settings.currency} />
      </div>
    </div>
  );
};
