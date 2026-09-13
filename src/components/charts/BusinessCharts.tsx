import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

interface TrendDataPoint {
  label: string;
  sales: number;
  expenses: number;
  profit: number;
}

export const TrendLineChart: React.FC<{
  data: TrendDataPoint[];
  currency: string;
  height?: number;
}> = ({ data, currency, height = 240 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data available</div>;
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.sales, d.expenses, d.profit, 100))) * 1.15;
  const paddingX = 42;
  const paddingY = 25;
  const width = 600;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const getX = (idx: number) => paddingX + (idx / Math.max(1, data.length - 1)) * graphWidth;
  const getY = (val: number) => paddingY + graphHeight - (Math.max(0, val) / maxVal) * graphHeight;

  // Generate SVG path for a line
  const makePath = (key: 'sales' | 'expenses' | 'profit') => {
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d[key]).toFixed(1)}`)
      .join(' ');
  };

  const salesPath = makePath('sales');
  const expensesPath = makePath('expenses');
  const profitPath = makePath('profit');

  // Closed area path for sales
  const salesArea = `${salesPath} L ${getX(data.length - 1)} ${paddingY + graphHeight} L ${getX(0)} ${paddingY + graphHeight} Z`;

  return (
    <div className="w-full relative select-none">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-end gap-4 mb-2.5 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#34d399]"></span>
          <span className="text-slate-300">Sales</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-[0_0_6px_#f43f5e]"></span>
          <span className="text-slate-300">Expenses</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_#22d3ee]"></span>
          <span className="text-slate-300">Net Profit</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingY + graphHeight * (1 - ratio);
          const value = maxVal * ratio;
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="rgba(30, 58, 102, 0.45)"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
                className="font-mono font-medium"
              >
                {currency}{Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <path d={salesArea} fill="url(#salesGrad)" />

        {/* Line Paths */}
        <path d={salesPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        <path d={expensesPath} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
        <path d={profitPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

        {/* Data points and X labels */}
        {data.map((d, i) => {
          const x = getX(i);
          const isHovered = hoverIndex === i;
          return (
            <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)} className="cursor-pointer">
              {/* Touch column for easy hover */}
              <rect
                x={x - graphWidth / (data.length * 2)}
                y={paddingY}
                width={graphWidth / data.length}
                height={graphHeight}
                fill="transparent"
              />

              {/* X Axis Label */}
              <text
                x={x}
                y={height - 5}
                textAnchor="middle"
                fontSize="11"
                fill={isHovered ? '#38bdf8' : '#94a3b8'}
                fontWeight={isHovered ? '700' : '500'}
              >
                {d.label}
              </text>

              {/* Dot on Sales */}
              <circle
                cx={x}
                cy={getY(d.sales)}
                r={isHovered ? 5 : 3.5}
                fill="#10b981"
                stroke="#080e1e"
                strokeWidth="2"
              />

              {/* Dot on Profit */}
              <circle
                cx={x}
                cy={getY(d.profit)}
                r={isHovered ? 5 : 3}
                fill="#22d3ee"
                stroke="#080e1e"
                strokeWidth="2"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="absolute z-20 bg-[#0c1527]/95 backdrop-blur-md border border-cyan-500/30 text-white rounded-xl shadow-2xl px-3.5 py-2.5 text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full transition-all duration-75 shadow-black/80"
          style={{
            left: `${(getX(hoverIndex) / width) * 100}%`,
            top: '40%',
          }}
        >
          <div className="font-bold text-cyan-300 border-b border-blue-900/60 pb-1 mb-1.5 flex items-center justify-between gap-4">
            <span>{data[hoverIndex].label}</span>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Report</span>
          </div>
          <div className="flex justify-between gap-4 text-emerald-400 py-0.5">
            <span className="text-slate-300">Sales:</span>
            <span className="font-bold font-mono">{formatCurrency(data[hoverIndex].sales, currency)}</span>
          </div>
          <div className="flex justify-between gap-4 text-rose-400 py-0.5">
            <span className="text-slate-300">Expenses:</span>
            <span className="font-bold font-mono">{formatCurrency(data[hoverIndex].expenses, currency)}</span>
          </div>
          <div className="flex justify-between gap-4 text-cyan-300 font-bold border-t border-blue-900/60 pt-1 mt-1">
            <span>Net Profit:</span>
            <span className="font-mono">{formatCurrency(data[hoverIndex].profit, currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export const TopProductsChart: React.FC<{
  products: { name: string; category: string; totalSold: number; revenue: number }[];
  currency: string;
}> = ({ products, currency }) => {
  const sorted = [...products].sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);
  const maxSold = Math.max(...sorted.map((p) => p.totalSold), 1);

  return (
    <div className="space-y-4">
      {sorted.map((p, idx) => {
        const percentage = Math.round((p.totalSold / maxSold) * 100);
        return (
          <div key={p.name} className="space-y-1.5 group">
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="w-4 h-4 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-slate-200 group-hover:text-cyan-300 transition-colors font-semibold truncate">{p.name}</span>
                <span className="text-slate-500 text-[11px] hidden sm:inline">({p.category})</span>
              </div>
              <div className="text-right whitespace-nowrap">
                <span className="font-bold text-white font-mono">{p.totalSold} sold</span>
                <span className="text-slate-400 text-[11px] ml-1.5 font-mono">
                  ({formatCurrency(p.revenue, currency)})
                </span>
              </div>
            </div>
            <div className="w-full bg-[#080f1d] rounded-full h-2 overflow-hidden border border-blue-950/60">
              <div
                className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 h-2 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const ExpenseCategoryChart: React.FC<{
  categories: { category: string; amount: number }[];
  currency: string;
}> = ({ categories, currency }) => {
  const total = categories.reduce((sum, c) => sum + c.amount, 0);
  const colors = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#f43f5e', '#64748b'];

  if (total === 0) {
    return <div className="text-sm text-slate-500 text-center py-6">No expense categories recorded yet.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Visual multi-segment bar */}
      <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-[#080f1d] border border-blue-950/60">
        {categories.map((c, i) => {
          const widthPct = (c.amount / total) * 100;
          if (widthPct === 0) return null;
          return (
            <div
              key={c.category}
              className="h-full transition-all duration-300 relative group"
              style={{
                width: `${widthPct}%`,
                backgroundColor: colors[i % colors.length],
              }}
              title={`${c.category}: ${formatCurrency(c.amount, currency)} (${widthPct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {categories.slice(0, 6).map((c, i) => {
          const pct = ((c.amount / total) * 100).toFixed(1);
          return (
            <div key={c.category} className="flex items-center justify-between text-xs bg-[#080f1d]/60 px-2.5 py-1.5 rounded-lg border border-blue-950/40">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: colors[i % colors.length] }}
                />
                <span className="text-slate-300 truncate font-medium">{c.category}</span>
              </div>
              <span className="font-bold text-slate-100 font-mono ml-1 whitespace-nowrap">
                {formatCurrency(c.amount, currency)} <span className="text-slate-500 font-normal text-[10px]">({pct}%)</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
