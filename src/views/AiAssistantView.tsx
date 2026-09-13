import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  Package,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { ChatMessage } from '../types';
import { formatCurrency } from '../utils/formatters';

const SUGGESTED_QUERIES = [
  'How much did I sell this month?',
  'What is my profit this month?',
  'Which product sells the most?',
  'Which customers have pending payments?',
  'What are my biggest expenses?',
  'Which products are low in stock?',
  'Compare this month with last month',
  'What should I focus on this week to increase profit?',
  'Which products should I restock right now?',
];

export const AiAssistantView: React.FC = () => {
  const { metrics, settings, products, customers, sales, expenses } = useBusiness();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${settings.ownerName}! I am your **AI Business Manager** for **${settings.businessName}**.\n\nI have access to your live business numbers:\n- **Monthly Sales:** ${formatCurrency(metrics.monthlySales, settings.currency)}\n- **Monthly Profit:** ${formatCurrency(metrics.monthlyProfit, settings.currency)}\n- **Low Stock Items:** ${metrics.lowStockProducts} products needing attention\n- **Khata Receivables:** ${formatCurrency(metrics.pendingPayments, settings.currency)} pending payment\n\nAsk me any question about your revenue, inventory, expenses, or business strategy!`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context snapshot
      const contextPayload = {
        currency: settings.currency,
        metrics,
        products: products.map((p) => ({
          name: p.name,
          category: p.category,
          stock: p.stockQuantity,
          minStock: p.minStockLevel,
          sellingPrice: p.sellingPrice,
          purchasePrice: p.purchasePrice,
          totalSold: p.totalSold,
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
          date: s.saleDate,
          method: s.paymentMethod,
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
          message: query,
          context: contextPayload,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'I am ready to assist with your business figures.';

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I am currently analyzing your local offline ledger records.\n\nBased on your database:\n- Total Sales this month: **${formatCurrency(metrics.monthlySales, settings.currency)}**\n- Net Profit: **${formatCurrency(metrics.monthlyProfit, settings.currency)}**\n- Khata Pending: **${formatCurrency(metrics.pendingPayments, settings.currency)}**\n\nPlease check server network connectivity if you would like full generative reasoning.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Conversation restarted. What business inquiry or metric can I analyze for you?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] max-w-5xl mx-auto pb-4">
      {/* Top Header */}
      <div className="flex items-center justify-between theme-card p-4 sm:p-5 theme-card-hover mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.3)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                AI Business Assistant
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950/70 text-cyan-300 rounded-full border border-cyan-500/30">
                Grounded in Store Data
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live intelligence powered by your catalog, sales, Khata, and expense records
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold theme-btn-secondary rounded-xl"
          title="Reset conversation"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Suggested Query Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 shrink-0 scrollbar-none">
        {SUGGESTED_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-[#0b182b] hover:bg-blue-900/60 hover:text-cyan-200 hover:border-cyan-500/50 text-slate-300 text-xs font-medium rounded-full border border-blue-900/60 shadow-xs whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto bg-[#050b16] rounded-2xl border border-blue-900/60 p-4 sm:p-6 space-y-4 shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                msg.role === 'user'
                  ? 'bg-blue-600 border border-blue-400/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                  : 'bg-linear-to-tr from-cyan-600 to-blue-600 border border-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none shadow-md'
                  : 'theme-card text-slate-200 rounded-tl-none border-blue-900/70'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <div className="space-y-2">
                  <div className="markdown-body prose prose-invert prose-sm max-w-none text-slate-200">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                  <div className="pt-2 border-t border-blue-900/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-cyan-400/80 font-medium">AI Analysis</span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-cyan-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.25)]">
              <Bot className="w-4 h-4" />
            </div>
            <div className="theme-card text-slate-200 rounded-2xl rounded-tl-none p-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                <span className="text-xs text-cyan-300 font-medium ml-2">Analyzing business data...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-3 flex items-center gap-2 theme-card p-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask anything (e.g., 'What is my best selling product?' or 'Who owes me the most?')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 text-xs sm:text-sm px-3 py-2 text-slate-100 focus:outline-none bg-transparent placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 sm:px-4 sm:py-2.5 theme-btn-primary rounded-xl flex items-center gap-1.5 text-xs disabled:opacity-50"
        >
          <span className="hidden sm:inline">Ask AI</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
