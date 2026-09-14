import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Package,
  CreditCard,
  Receipt,
  Send,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Copy,
  Check,
  Bot,
  Zap,
  ShieldCheck,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { formatCurrency } from '../../utils/formatters';
import {
  AiCommandCenterReport,
  AiActionItem,
  CommandCenterPillarType,
} from '../../types';

interface AiCommandCenterProps {
  onNavigate: (section: string) => void;
  onOpenAddSale: () => void;
  onOpenAddExpense: () => void;
  onOpenAddProduct: () => void;
  onOpenAddCustomer: () => void;
}

const QUICK_QUESTIONS = [
  'What is my monthly net profit margin?',
  'Who owes the most khata and how much?',
  'Which products are low or out of stock?',
  'What is my biggest expense category?',
  'What should I focus on this week to grow profit?',
];

export const AiCommandCenter: React.FC<AiCommandCenterProps> = ({
  onNavigate,
  onOpenAddSale,
  onOpenAddExpense,
  onOpenAddProduct,
  onOpenAddCustomer,
}) => {
  const { metrics, settings, sales, expenses, products, customers, businessProfile } = useBusiness();

  const [report, setReport] = useState<AiCommandCenterReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'insights' | 'warnings' | 'recommendations'>('all');
  const [pillarFilter, setPillarFilter] = useState<CommandCenterPillarType | 'all'>('all');

  // "Ask AI" states
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiAnswerSource, setAiAnswerSource] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const answerPanelRef = useRef<HTMLDivElement>(null);
  const lastFetchTimeRef = useRef<number>(0);

  // Fetch full automated 5-pillar analysis
  const fetchAnalysis = async (force: boolean = false) => {
    // Throttle automatic refetches to once per 30 seconds unless explicitly forced
    const now = Date.now();
    if (!force && report && now - lastFetchTimeRef.current < 30000) {
      return;
    }

    setIsAnalyzing(true);
    lastFetchTimeRef.current = now;
    try {
      const payload = {
        currency: settings.currency,
        businessProfile,
        metrics,
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          stockQuantity: p.stockQuantity,
          minStockLevel: p.minStockLevel,
          sellingPrice: p.sellingPrice,
          purchasePrice: p.purchasePrice,
          totalSold: p.totalSold || 0,
        })),
        customers: customers.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          totalPurchases: c.totalPurchases,
          totalPending: c.totalPending,
        })),
        expenses: expenses.slice(0, 15).map((e) => ({
          id: e.id,
          category: e.category,
          description: e.description,
          amount: e.amount,
          date: e.date,
        })),
        sales: sales.slice(0, 15).map((s) => ({
          id: s.id,
          invoiceNumber: s.invoiceNumber,
          customerName: s.customerName,
          grandTotal: s.grandTotal,
          paidAmount: s.paidAmount,
          pendingAmount: s.pendingAmount,
          saleDate: s.saleDate,
        })),
      };

      const res = await fetch('/api/ai/command-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: payload, forceRefresh: force }),
      });

      const data = await res.json();
      if (data && data.pillars) {
        setReport(data);
      }
    } catch (err) {
      console.warn('AI command center fetch notification:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(false);
  }, [
    metrics.monthlySales,
    metrics.monthlyExpenses,
    metrics.monthlyProfit,
    metrics.pendingPayments,
    metrics.lowStockProducts,
  ]);

  // Handle Natural Language Business Questions
  const handleAskAi = async (customQuery?: string) => {
    const question = (customQuery || aiQuestion).trim();
    if (!question || isAnswering) return;

    setIsAnswering(true);
    setAiAnswer(null);
    if (customQuery) {
      setAiQuestion(customQuery);
    }

    try {
      const payload = {
        currency: settings.currency,
        metrics,
        products: products.map((p) => ({
          name: p.name,
          sku: p.sku,
          category: p.category,
          stock: p.stockQuantity,
          minStock: p.minStockLevel,
          sellingPrice: p.sellingPrice,
          purchasePrice: p.purchasePrice,
          totalSold: p.totalSold || 0,
        })),
        customers: customers.map((c) => ({
          name: c.name,
          phone: c.phone,
          totalPurchases: c.totalPurchases,
          totalPending: c.totalPending,
        })),
        recentSales: sales.slice(0, 10).map((s) => ({
          customer: s.customerName,
          amount: s.grandTotal,
          paid: s.paidAmount,
          due: s.pendingAmount,
          date: s.saleDate,
        })),
        recentExpenses: expenses.slice(0, 10).map((e) => ({
          category: e.category,
          description: e.description,
          amount: e.amount,
          date: e.date,
        })),
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          context: payload,
        }),
      });

      const data = await res.json();
      const text = data.response || data.reply || 'Analysis complete.';
      setAiAnswer(text);
      setAiAnswerSource(data.source || 'Store Data Engine');

      // Smoothly scroll down to the response if needed
      setTimeout(() => {
        answerPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (err) {
      setAiAnswer(
        `### Business Data Summary\n- **Monthly Sales:** ${formatCurrency(metrics.monthlySales, settings.currency)}\n- **Monthly Profit:** ${formatCurrency(metrics.monthlyProfit, settings.currency)}\n- **Khata Receivables:** ${formatCurrency(metrics.pendingPayments, settings.currency)}\n- **Low Stock:** ${metrics.lowStockProducts} products needing replenishment.\n\n*Unable to reach generative service; calculated directly from local business ledger.*`
      );
      setAiAnswerSource('local-calculation');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleCopyAnswer = () => {
    if (aiAnswer) {
      navigator.clipboard.writeText(aiAnswer);
      setCopiedAnswer(true);
      setTimeout(() => setCopiedAnswer(false), 2000);
    }
  };

  // Helper to handle Action Item button clicks
  const handleActionClick = (item: AiActionItem) => {
    if (item.actionTarget) {
      if (item.actionTarget === 'sales') {
        onNavigate('sales');
      } else if (item.actionTarget === 'expenses') {
        onNavigate('expenses');
      } else if (item.actionTarget === 'products') {
        onNavigate('products');
      } else if (item.actionTarget === 'payments') {
        onNavigate('payments');
      } else if (item.actionTarget === 'customers') {
        onNavigate('customers');
      } else if (item.actionTarget === 'reports') {
        onNavigate('reports');
      } else if (item.actionTarget === 'assistant') {
        onNavigate('assistant');
      }
    } else if (item.category === 'inventory') {
      onNavigate('products');
    } else if (item.category === 'khata') {
      onNavigate('payments');
    } else if (item.category === 'expenses') {
      onNavigate('expenses');
    } else if (item.category === 'sales') {
      onNavigate('sales');
    }
  };

  // Filter items based on active tab and pillar filter
  const allActionItems: AiActionItem[] = [
    ...(report?.warnings || []),
    ...(report?.recommendations || []),
    ...(report?.insights || []),
  ];

  const filteredItems = allActionItems.filter((item) => {
    const matchesTab =
      selectedTab === 'all'
        ? true
        : selectedTab === 'insights'
        ? item.type === 'insight'
        : selectedTab === 'warnings'
        ? item.type === 'warning'
        : item.type === 'recommendation';

    const matchesPillar = pillarFilter === 'all' || item.category === pillarFilter;
    return matchesTab && matchesPillar;
  });

  const getPillarIcon = (pillar: CommandCenterPillarType) => {
    switch (pillar) {
      case 'sales':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'expenses':
        return <Receipt className="w-3.5 h-3.5" />;
      case 'profit':
        return <IndianRupee className="w-3.5 h-3.5" />;
      case 'inventory':
        return <Package className="w-3.5 h-3.5" />;
      case 'khata':
        return <CreditCard className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* 1. Main Command Center Container                          */}
      {/* ========================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-b from-[#0e1c36] via-[#0a1528] to-[#070e1c] border border-cyan-500/40 p-5 sm:p-6 shadow-2xl shadow-cyan-950/30">
        {/* Subtle Ambient Backlight */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-blue-900/40">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.35)] border border-cyan-400/40">
              <Zap className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  AI Business Command Center
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold bg-cyan-950/80 text-cyan-300 rounded-full border border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Live Diagnostic
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Automated multi-pillar analysis across sales, expenses, profit, inventory & Khata
              </p>
            </div>
          </div>

          {/* Right Controls: Health Gauge & Refresh */}
          <div className="flex items-center gap-3">
            {report && (
              <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#060c18] border border-blue-800/60 shadow-inner">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    Health Score
                  </div>
                  <div className="text-xs font-black text-cyan-300">
                    {report.healthScore}/100 • {report.healthLabel}
                  </div>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    report.healthScore >= 80
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(52,211,153,0.25)]'
                      : report.healthScore >= 60
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            )}

            <button
              onClick={() => fetchAnalysis(true)}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 hover:border-cyan-500/40 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-xs disabled:opacity-50"
              title="Re-run deep store data analysis"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}</span>
            </button>
          </div>
        </div>

        {/* Personalized Business Profile Strip */}
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-800/60 text-slate-300 font-medium">
            <span className="text-cyan-400 font-bold">
              {businessProfile.businessName || settings.businessName}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-200">{businessProfile.businessType || 'Retail Store'}</span>
          </span>

          {businessProfile.approxDailySales > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#060c18] border border-blue-900/60 text-slate-300 font-mono text-[11px]">
              <span className="text-slate-400">Daily Target:</span>
              <span className="text-cyan-300 font-bold">
                {settings.currency}
                {businessProfile.approxDailySales.toLocaleString()}/day
              </span>
            </span>
          )}

          {businessProfile.businessGoals && businessProfile.businessGoals.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {businessProfile.businessGoals.slice(0, 2).map((goal, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                >
                  🎯 {goal}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Executive Summary Banner */}
        {report?.summary && (
          <div className="relative z-10 mt-4 p-3 sm:p-3.5 rounded-xl bg-[#07101f]/90 border border-cyan-500/20 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              <span className="font-semibold text-cyan-300">Executive Synopsis: </span>
              {report.summary}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. Five Operational Pillars Grid (Sales, Exp, Prof, Inv, Khata) */}
        {/* ========================================================= */}
        <div className="relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {report?.pillars.map((pillar) => {
            const isSelected = pillarFilter === pillar.pillar;
            return (
              <div
                key={pillar.pillar}
                onClick={() => setPillarFilter(isSelected ? 'all' : pillar.pillar)}
                className={`group cursor-pointer rounded-xl p-3.5 border flex flex-col justify-between hover-pop theme-card-hover ${
                  isSelected
                    ? 'bg-[#0f2244] border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.35)] ring-1 ring-cyan-400'
                    : 'bg-[#071122]/80 hover:bg-[#0c1a33] border-blue-900/50'
                }`}
              >
                <div>
                  {/* Pillar Top Badge & Icon */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <span className="text-cyan-400">{getPillarIcon(pillar.pillar)}</span>
                      {pillar.title}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        pillar.status === 'healthy'
                          ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                          : pillar.status === 'warning'
                          ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                          : pillar.status === 'critical'
                          ? 'bg-rose-400 shadow-[0_0_6px_#f87171]'
                          : 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]'
                      }`}
                    />
                  </div>

                  {/* Primary Metric */}
                  <div className="text-lg font-black text-white font-mono tracking-tight">
                    {pillar.metric}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium truncate">
                    {pillar.subtext}
                  </div>
                </div>

                {/* Insight snippet */}
                <div className="mt-3 pt-2 border-t border-blue-900/50 text-[11px] text-slate-300 leading-snug line-clamp-2">
                  {pillar.insight}
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* 3. Actionable Insights, Warnings & Recommendations Matrix */}
        {/* ========================================================= */}
        <div className="relative z-10 mt-5 pt-4 border-t border-blue-900/40">
          {/* Subheader & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Action Matrix
              </span>
              {pillarFilter !== 'all' && (
                <button
                  onClick={() => setPillarFilter('all')}
                  className="text-[11px] font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                >
                  (Filtered by {pillarFilter} • Show all)
                </button>
              )}
            </div>

            {/* Category / Type Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#050c18] rounded-xl border border-blue-900/50">
              <button
                onClick={() => setSelectedTab('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedTab === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({allActionItems.length})
              </button>
              <button
                onClick={() => setSelectedTab('warnings')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                  selectedTab === 'warnings'
                    ? 'bg-rose-900/70 text-rose-200 border border-rose-500/40 shadow-xs'
                    : 'text-rose-400/80 hover:text-rose-300'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                Warnings ({report?.warnings.length || 0})
              </button>
              <button
                onClick={() => setSelectedTab('recommendations')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                  selectedTab === 'recommendations'
                    ? 'bg-cyan-900/70 text-cyan-200 border border-cyan-500/40 shadow-xs'
                    : 'text-cyan-400/80 hover:text-cyan-300'
                }`}
              >
                <Lightbulb className="w-3 h-3 text-cyan-400" />
                Recommendations ({report?.recommendations.length || 0})
              </button>
              <button
                onClick={() => setSelectedTab('insights')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                  selectedTab === 'insights'
                    ? 'bg-emerald-900/70 text-emerald-200 border border-emerald-500/40 shadow-xs'
                    : 'text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Insights ({report?.insights.length || 0})
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.map((item) => {
              const isWarning = item.type === 'warning';
              const isRec = item.type === 'recommendation';

              return (
                <div
                  key={item.id}
                  className={`rounded-xl p-4 border flex flex-col justify-between theme-card-hover hover-pop ${
                    isWarning
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : isRec
                      ? 'bg-cyan-950/20 border-cyan-500/30'
                      : 'bg-[#081224] border-blue-900/50'
                  }`}
                >
                  <div>
                    {/* Badge header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                          isWarning
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                            : isRec
                            ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40'
                            : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        {isWarning ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : isRec ? (
                          <Lightbulb className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {item.type}
                      </span>

                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#050c18] text-slate-400 rounded-md border border-blue-900/60">
                        {item.impactBadge || item.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* 1-Click Action Trigger */}
                  <div className="mt-3.5 pt-2.5 border-t border-blue-950/80 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                      <span className="text-cyan-400">{getPillarIcon(item.category)}</span>
                      {item.category}
                    </span>
                    <button
                      onClick={() => handleActionClick(item)}
                      className={`inline-flex items-center gap-1 text-xs font-bold transition-all px-2.5 py-1 rounded-lg ${
                        isWarning
                          ? 'text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/40'
                          : isRec
                          ? 'text-cyan-300 hover:text-white bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-500/40'
                          : 'text-slate-300 hover:text-white bg-blue-950/60 hover:bg-blue-900/70 border border-blue-800/60'
                      }`}
                    >
                      <span>{item.actionLabel || 'Take Action'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 bg-[#060c18] rounded-xl border border-blue-900/40">
              No items match the selected filter.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. Clean Premium "Ask AI" Business Assistant Card         */}
      {/* ========================================================= */}
      <div className="rounded-2xl theme-card p-5 sm:p-6 theme-card-hover border-cyan-500/30 shadow-xl shadow-cyan-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(34,211,238,0.3)] border border-cyan-400/40">
              <Sparkles className="w-4 h-4 text-cyan-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Ask AI Business Advisor
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950/80 text-cyan-300 rounded-full border border-cyan-500/30">
                  Grounded in Live Store Data
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ask business questions in plain language — calculations are computed from your live sales, khata, and stock records
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('assistant')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-200 transition-colors self-start md:self-auto"
          >
            <span>Open Full AI Chat View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskAi(q)}
              disabled={isAnswering}
              className="px-3 py-1.5 bg-[#071120] hover:bg-blue-900/50 hover:text-cyan-200 hover:border-cyan-500/40 text-slate-300 text-xs font-medium rounded-full border border-blue-900/60 shadow-xs whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 shrink-0 disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar with Prominent "Ask AI" button */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAi();
          }}
          className="mt-1 flex items-center gap-2 bg-[#060c18] p-1.5 sm:p-2 rounded-xl border border-blue-900/60 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all"
        >
          <input
            type="text"
            placeholder="Ask anything (e.g., 'How can I increase profits this week?' or 'Which customers owe money?')..."
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            disabled={isAnswering}
            className="flex-1 text-xs sm:text-sm px-3 py-2 text-slate-100 focus:outline-none bg-transparent placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!aiQuestion.trim() || isAnswering}
            className="px-4 py-2.5 theme-btn-primary rounded-xl flex items-center gap-2 text-xs font-bold disabled:opacity-50 shrink-0"
          >
            {isAnswering ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </form>

        {/* Inline Answer Panel */}
        {isAnswering && (
          <div className="mt-4 p-4 rounded-xl bg-[#060c18] border border-cyan-500/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-cyan-300 font-semibold ml-2">
                Analyzing business ledger & calculating figures...
              </span>
            </div>
          </div>
        )}

        {aiAnswer && !isAnswering && (
          <div
            ref={answerPanelRef}
            className="mt-4 p-4 sm:p-5 rounded-xl bg-[#060c18] border border-cyan-500/30 text-slate-200 space-y-3 shadow-inner"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-blue-900/50 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-white">AI Business Advisor Analysis</span>
                {aiAnswerSource && (
                  <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    {aiAnswerSource}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAnswer}
                  className="p-1.5 hover:text-cyan-300 text-slate-400 transition-colors flex items-center gap-1 text-[11px]"
                  title="Copy analysis"
                >
                  {copiedAnswer ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="markdown-body prose prose-invert prose-sm max-w-none text-slate-200 text-xs sm:text-sm leading-relaxed">
              <Markdown>{aiAnswer}</Markdown>
            </div>

            <div className="pt-3 border-t border-blue-900/40 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">
                Question: <span className="text-slate-200 italic font-medium">"{aiQuestion}"</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAiAnswer(null);
                    setAiQuestion('');
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 bg-blue-950/50 rounded-lg border border-blue-900/50"
                >
                  Clear Answer
                </button>
                <button
                  onClick={() => onNavigate('assistant')}
                  className="px-3 py-1 text-[11px] font-bold text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900/80 rounded-lg border border-cyan-500/40 transition-all flex items-center gap-1"
                >
                  <span>Continue in AI Assistant</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
