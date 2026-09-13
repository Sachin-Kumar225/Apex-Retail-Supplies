import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini client lazily
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// In-memory cache for Command Center report to prevent rapid redundant calls
interface CachedCommandCenter {
  report: any;
  timestamp: number;
}
let cachedCommandCenterReport: CachedCommandCenter | null = null;
const COMMAND_CENTER_CACHE_TTL_MS = 45 * 1000; // 45 seconds cache

// Resilient Gemini invoker with automatic failover for high demand (503) and quota limits (429)
async function callGeminiWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
): Promise<{ text: string | undefined; modelUsed: string }> {
  // First attempt with gemini-3.8-flash
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: params.contents,
      config: params.config,
    });
    return { text: res.text, modelUsed: "gemini-3.8-flash" };
  } catch (primaryErr: any) {
    const errString = String(primaryErr?.message || "").toLowerCase();
    const isTransientOrQuota =
      errString.includes("503") ||
      errString.includes("unavailable") ||
      errString.includes("quota") ||
      errString.includes("resource_exhausted") ||
      errString.includes("rate-limit") ||
      errString.includes("overloaded") ||
      primaryErr?.status === 503 ||
      primaryErr?.status === 429;

    if (isTransientOrQuota) {
      console.warn(
        `Gemini 3.8 Flash high demand or quota reached. Failing over to gemini-3.1-flash-lite.`
      );
      try {
        const fallbackRes = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: params.contents,
          config: params.config,
        });
        return { text: fallbackRes.text, modelUsed: "gemini-3.1-flash-lite" };
      } catch (fallbackErr: any) {
        console.warn(
          `Secondary model gemini-3.1-flash-lite also unavailable: ${fallbackErr?.message}`
        );
        throw fallbackErr;
      }
    }
    throw primaryErr;
  }
}

// Token-efficient context compaction to prevent exceeding token limits
function compactBusinessData(context: any) {
  if (!context) return {};
  const products: any[] = context.products || [];
  const customers: any[] = context.customers || [];
  const expenses: any[] = context.expenses || [];
  const sales: any[] = context.sales || [];

  // Group expenses by category
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach((e: any) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + (e.amount || 0);
  });

  return {
    currency: context.currency || "₹",
    businessProfile: context.businessProfile,
    metrics: context.metrics,
    inventorySummary: {
      totalProductsCount: products.length,
      lowStockItems: products
        .filter((p: any) => (p.stockQuantity ?? 0) <= (p.minStockLevel ?? 5))
        .map((p: any) => ({
          name: p.name,
          stock: p.stockQuantity,
          minStock: p.minStockLevel,
          sellingPrice: p.sellingPrice,
        }))
        .slice(0, 8),
      topSellers: [...products]
        .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
        .slice(0, 5)
        .map((p: any) => ({ name: p.name, sold: p.totalSold || 0, price: p.sellingPrice })),
    },
    khataReceivables: {
      topDebtors: [...customers]
        .filter((c: any) => (c.totalPending || 0) > 0)
        .sort((a, b) => (b.totalPending || 0) - (a.totalPending || 0))
        .slice(0, 6)
        .map((c: any) => ({ name: c.name, pending: c.totalPending })),
      totalPendingSum: customers.reduce((sum: number, c: any) => sum + (c.totalPending || 0), 0),
    },
    expenseBreakdown: expenseByCategory,
    recentSalesSummary: sales.slice(0, 5).map((s: any) => ({
      customer: s.customerName,
      total: s.grandTotal,
      paid: s.paidAmount,
      pending: s.pendingAmount,
      date: s.saleDate,
    })),
  };
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Business Assistant chat endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, context, chatHistory = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message prompt is required." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Return smart rule-based business answer when API key is not configured
      const fallbackResponse = generateLocalBusinessInsights(message, context);
      return res.json({
        response: fallbackResponse,
        source: "local-analytical-engine",
        note: "Configured with built-in financial analytics engine. Connect GEMINI_API_KEY in Secrets for extended generative advice.",
      });
    }

    const compacted = compactBusinessData(context);

    // System prompt grounding the model with real application business data
    const systemPrompt = `You are the AI Personal Business Manager Advisor for small businesses and shop owners.
You have access to the business's REAL-TIME application data provided below in JSON format.
Your core rules:
1. ALWAYS base your calculations, figures, and answers strictly on the actual provided business data.
2. If data is not available or records are empty, state clearly that the required data is not available. Never invent numbers.
3. Be concise, highly professional, encouraging, and provide actionable business advice.
4. Format financial numbers clearly using the currency indicated in the data (e.g., ₹ or $ or as specified).
5. Highlight immediate risks (e.g. low stock, overdue customer khata balances, rising expense categories).

CURRENT BUSINESS DATA:
${JSON.stringify(compacted, null, 2)}
`;

    // Format conversation history for Gemini
    const contents: any[] = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
      },
    ];

    const result = await callGeminiWithFallback(ai, { contents });

    const text = result.text || "I was unable to analyze the data. Please try again.";
    return res.json({
      response: text,
      reply: text,
      source: result.modelUsed,
    });
  } catch (error: any) {
    console.warn("Serving local analytical response due to Gemini API state:", error?.message || error);
    // Fallback gracefully so user gets a real answer from their data
    const fallbackResponse = generateLocalBusinessInsights(req.body.message || "", req.body.context || {});
    return res.json({
      response: fallbackResponse,
      reply: fallbackResponse,
      source: "local-analytical-engine",
      notice: "Real-time answer computed via built-in business intelligence engine.",
    });
  }
});

// AI Business Command Center Analysis endpoint
app.post("/api/ai/command-center", async (req, res) => {
  try {
    const { context, forceRefresh } = req.body;

    // Check server-side cache if not force refreshed
    const now = Date.now();
    if (!forceRefresh && cachedCommandCenterReport && now - cachedCommandCenterReport.timestamp < COMMAND_CENTER_CACHE_TTL_MS) {
      return res.json(cachedCommandCenterReport.report);
    }

    const ai = getGeminiClient();

    if (!ai) {
      const report = generateLocalCommandCenterReport(context);
      cachedCommandCenterReport = { report, timestamp: now };
      return res.json(report);
    }

    const currency = context?.currency || "$";
    const profile = context?.businessProfile;
    const profileContext = profile ? `
BUSINESS PROFILE & GOALS (Use to personalize advice directly):
- Store Name: ${profile.businessName || 'Store'}
- Type: ${profile.businessType || 'Retail'}
- Products/Services Offered: ${profile.productsServices || 'Merchandise'}
- Target Daily Sales: ${currency}${profile.approxDailySales || 0}/day
- Target Daily Expenses: ${currency}${profile.approxDailyExpenses || 0}/day
- Target Daily Customers: ${profile.approxDailyCustomers || 0}
- Payment Methods: ${(profile.paymentMethods || []).join(', ')}
- Owner's Key Business Goals: ${(profile.businessGoals || []).join(', ')}
` : '';

    const compacted = compactBusinessData(context);

    const prompt = `You are the AI Business Command Center for a retail shop/small business.
Analyze the provided small business data across five core operational pillars:
1. Sales Velocity & Revenue
2. Expense & Overhead Control
3. Profit & Margin Health
4. Inventory Safety & Restock Risks
5. Pending Payments (Customer Khata) & Debt Recovery

${profileContext}
Personalize the executive summary and recommendations based on the business type and the owner's specific declared goals!

Generate a comprehensive JSON response matching this EXACT schema:
{
  "summary": "1-2 sentence executive synopsis of overall business health and top focus area with actual numbers",
  "healthScore": 85, // number from 0 to 100
  "healthLabel": "Strong Operations" | "Optimal Operations" | "Action Required" | "Critical Attention",
  "pillars": [
    {
      "pillar": "sales",
      "title": "Sales Velocity",
      "status": "healthy" | "warning" | "critical" | "opportunity",
      "metric": "formatted string like ${currency}12,450",
      "subtext": "short subtitle",
      "insight": "1 clear sentence about sales trajectory"
    },
    {
      "pillar": "expenses",
      "title": "Expense Ratio",
      "status": "healthy" | "warning" | "critical" | "opportunity",
      "metric": "e.g. 38.2% of Sales",
      "subtext": "formatted total expenses",
      "insight": "1 clear sentence identifying primary cost driver"
    },
    {
      "pillar": "profit",
      "title": "Net Profit Margin",
      "status": "healthy" | "warning" | "critical" | "opportunity",
      "metric": "e.g. 61.8%",
      "subtext": "formatted net profit",
      "insight": "1 clear sentence assessing margin durability"
    },
    {
      "pillar": "inventory",
      "title": "Stock Safety",
      "status": "healthy" | "warning" | "critical" | "opportunity",
      "metric": "e.g. 3 Items Low",
      "subtext": "total products count",
      "insight": "1 sentence on inventory reorder risks"
    },
    {
      "pillar": "khata",
      "title": "Pending Receivables",
      "status": "healthy" | "warning" | "critical" | "opportunity",
      "metric": "formatted total pending dues",
      "subtext": "number of customers owing",
      "insight": "1 sentence on working capital tied up in credit"
    }
  ],
  "insights": [
    {
      "id": "ins-1",
      "type": "insight",
      "category": "sales" | "expenses" | "profit" | "inventory" | "khata",
      "title": "Short title",
      "description": "Specific observation using actual numbers",
      "impactBadge": "Revenue Boost" | "Margin Defense" | "High Demand" | "Working Capital",
      "actionLabel": "Optional button text e.g. View Products",
      "actionTarget": "sales" | "expenses" | "products" | "payments" | "customers" | "assistant" | "reports"
    }
  ],
  "warnings": [
    {
      "id": "warn-1",
      "type": "warning",
      "category": "sales" | "expenses" | "profit" | "inventory" | "khata",
      "title": "Warning title",
      "description": "Warning details with actual product names or customer amounts",
      "impactBadge": "Urgent" | "Restock Alert" | "Cash Flow Risk" | "Cost Spike",
      "actionLabel": "Optional action button text",
      "actionTarget": "sales" | "expenses" | "products" | "payments" | "customers" | "assistant" | "reports"
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "type": "recommendation",
      "category": "sales" | "expenses" | "profit" | "inventory" | "khata",
      "title": "Actionable recommendation title",
      "description": "Concrete step the shop owner should take right now",
      "impactBadge": "Top Priority" | "Quick Win" | "High Impact" | "Cash Recovery",
      "actionLabel": "Action button text",
      "actionTarget": "sales" | "expenses" | "products" | "payments" | "customers" | "assistant" | "reports"
    }
  ]
}

DATA TO ANALYZE:
${JSON.stringify(compacted, null, 2)}
`;

    const result = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let report;
    try {
      report = JSON.parse(result.text || "{}");
      report.source = result.modelUsed;
      report.timestamp = new Date().toISOString();
      if (!report.pillars || !Array.isArray(report.pillars) || report.pillars.length === 0) {
        report = generateLocalCommandCenterReport(context);
      }
    } catch {
      report = generateLocalCommandCenterReport(context);
    }

    cachedCommandCenterReport = { report, timestamp: now };
    return res.json(report);
  } catch (error: any) {
    console.warn("Serving local analytical report due to Gemini API state:", error?.message || error);
    const report: any = generateLocalCommandCenterReport(req.body?.context || {});
    report.source = "local-analytical-engine";
    report.notice = "Generated via built-in business intelligence engine.";
    cachedCommandCenterReport = { report, timestamp: Date.now() };
    return res.json(report);
  }
});

// AI Insights endpoint
app.post("/api/ai/insights", async (req, res) => {
  try {
    const { context } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const insights = generateStructuredInsights(context);
      return res.json({ insights });
    }

    const compacted = compactBusinessData(context);

    const prompt = `Analyze this small business data and generate 4-6 concise, high-impact business insights for the owner's dashboard.
Respond in valid JSON format only, matching this structure:
[
  {
    "id": "1",
    "type": "positive" | "warning" | "opportunity" | "alert",
    "title": "Short title",
    "description": "1-2 sentence explanation with actual figures",
    "actionText": "Short recommendation"
  }
]

DATA:
${JSON.stringify(compacted, null, 2)}
`;

    const result = await callGeminiWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let insights;
    try {
      insights = JSON.parse(result.text || "[]");
    } catch {
      insights = generateStructuredInsights(context);
    }

    return res.json({ insights, source: result.modelUsed });
  } catch (error: any) {
    console.warn("Serving local insights due to Gemini API state:", error?.message || error);
    const insights = generateStructuredInsights(req.body.context || {});
    return res.json({ insights, source: "local-analytical-engine" });
  }
});

// Deterministic Analytical Engine for immediate, accurate, grounded answers
function generateLocalBusinessInsights(message: string, context: any): string {
  const query = message.toLowerCase();
  const currency = context?.currency || "₹";
  const metrics = context?.metrics || {};
  const products = context?.products || [];
  const customers = context?.customers || [];
  const expenses = context?.expenses || [];
  const sales = context?.sales || [];

  if (query.includes("profit") || query.includes("how much did i make")) {
    return `### 📊 Monthly Profit Summary
- **Monthly Revenue/Sales:** ${currency}${metrics.monthlySales?.toLocaleString() ?? 0}
- **Monthly Expenses:** ${currency}${metrics.monthlyExpenses?.toLocaleString() ?? 0}
- **Net Profit:** ${currency}${metrics.monthlyProfit?.toLocaleString() ?? 0}
- **Profit Margin:** ${metrics.monthlySales > 0 ? ((metrics.monthlyProfit / metrics.monthlySales) * 100).toFixed(1) : 0}%

**Recommendation:** Maintain tight control over operational expenses to preserve healthy net margins.`;
  }

  if (query.includes("sell") || query.includes("sales")) {
    return `### 💰 Sales Performance
- **Today's Sales:** ${currency}${metrics.todaySales?.toLocaleString() ?? 0}
- **Monthly Total Sales:** ${currency}${metrics.monthlySales?.toLocaleString() ?? 0}
- **Total Sales Recorded:** ${sales.length} transactions

**Trend:** Consistent customer repeat transactions are driving volume. Ensure invoices are dispatched immediately to keep payment cycles short.`;
  }

  if (query.includes("pending") || query.includes("khata") || query.includes("owing") || query.includes("due")) {
    const pendingCustomers = customers.filter((c: any) => c.totalPending > 0);
    const totalPending = pendingCustomers.reduce((acc: number, c: any) => acc + (c.totalPending || 0), 0);

    if (pendingCustomers.length === 0) {
      return `### 💳 Khata & Outstanding Receivables
All customers are currently settled up! You have **${currency}0.00** in outstanding dues. Outstanding collection rate is 100%.`;
    }

    const list = pendingCustomers
      .slice(0, 5)
      .map((c: any) => `- **${c.name}**: ${currency}${c.totalPending.toLocaleString()} (Phone: ${c.phone || "N/A"})`)
      .join("\n");

    return `### 💳 Outstanding Khata & Receivables
- **Total Pending Balance:** ${currency}${totalPending.toLocaleString()}
- **Customers with Balances:** ${pendingCustomers.length}

**Top Pending Customers:**
${list}

**Action Plan:** Send WhatsApp or SMS payment reminders to the top debtors this week to improve cash flow.`;
  }

  if (query.includes("stock") || query.includes("inventory") || query.includes("restock")) {
    const lowStock = products.filter((p: any) => (p.stockQuantity || 0) <= (p.minStockLevel || 5));
    const outOfStock = products.filter((p: any) => (p.stockQuantity || 0) === 0);

    let output = `### 📦 Inventory Status Report\n- **Total Products Tracked:** ${products.length}\n- **Low Stock Items:** ${lowStock.length}\n- **Out of Stock:** ${outOfStock.length}\n\n`;

    if (lowStock.length > 0) {
      output += `**Items requiring immediate restock:**\n` + lowStock.map((p: any) => `- **${p.name}** (SKU: ${p.sku}): Only ${p.stockQuantity} units remaining (Min required: ${p.minStockLevel})`).join("\n");
      output += `\n\n**Action Plan:** Contact suppliers to place replenishment purchase orders before stock-outs impact sales.`;
    } else {
      output += `All products are currently stocked well above their safety minimum thresholds!`;
    }
    return output;
  }

  if (query.includes("top") || query.includes("best") || query.includes("product")) {
    const sorted = [...products].sort((a: any, b: any) => (b.totalSold || 0) - (a.totalSold || 0));
    const top3 = sorted.slice(0, 4);

    return `### 🏆 Top Performing Products
${top3.map((p: any, idx: number) => `${idx + 1}. **${p.name}** — ${p.totalSold || 0} units sold (${currency}${(p.sellingPrice * (p.totalSold || 0)).toLocaleString()} total volume)`).join("\n")}

**Insight:** Your top 20% products generate the lion's share of profits. Ensure priority shelf space and zero stock-outs on these items.`;
  }

  if (query.includes("expense") || query.includes("cost") || query.includes("spending")) {
    const expenseSumByCategory: Record<string, number> = {};
    expenses.forEach((e: any) => {
      expenseSumByCategory[e.category] = (expenseSumByCategory[e.category] || 0) + e.amount;
    });

    const sortedCats = Object.entries(expenseSumByCategory).sort((a, b) => b[1] - a[1]);
    const topCats = sortedCats.map(([cat, amt]) => `- **${cat}**: ${currency}${amt.toLocaleString()}`).join("\n");

    return `### 📉 Expense Analysis
- **Monthly Expenses:** ${currency}${metrics.monthlyExpenses?.toLocaleString() ?? 0}
- **Today's Expenses:** ${currency}${metrics.todayExpenses?.toLocaleString() ?? 0}

**Breakdown by Category:**
${topCats || "No expense records logged yet."}

**Advice:** Review recurring utility and rent agreements. Consider bulk purchase discounts for shop inventory to minimize unit procurement cost.`;
  }

  if (query.includes("focus") || query.includes("week") || query.includes("strategy") || query.includes("recommend")) {
    return `### 🎯 Actionable Focus for This Week
1. **Cash Flow Recovery:** Collect pending Khata balances totaling **${currency}${metrics.pendingPayments?.toLocaleString() ?? 0}**.
2. **Stock Replenishment:** Restock the **${products.filter((p: any) => p.stockQuantity <= p.minStockLevel).length}** products that have crossed safety thresholds.
3. **Repeat Customers:** Engage top regular buyers with special purchase offers or bundled volume discounts.
4. **Expense Pruning:** Audit the highest expense category to trim unnecessary overhead.`;
  }

  // General executive analysis
  return `### 📈 Executive Business Overview
- **Revenue This Month:** ${currency}${metrics.monthlySales?.toLocaleString() ?? 0}
- **Operating Expenses:** ${currency}${metrics.monthlyExpenses?.toLocaleString() ?? 0}
- **Net Operating Profit:** ${currency}${metrics.monthlyProfit?.toLocaleString() ?? 0}
- **Customer Base:** ${metrics.totalCustomers ?? 0} active accounts
- **Outstanding Dues (Khata):** ${currency}${metrics.pendingPayments?.toLocaleString() ?? 0}

**Executive Summary:**
Your business shows strong underlying transaction activity. Key immediate priorities should be replenishing low-stock SKUs and initiating recovery on outstanding Khata balances.`;
}

function generateStructuredInsights(context: any) {
  const currency = context?.currency || "₹";
  const metrics = context?.metrics || {};
  const products = context?.products || [];
  const customers = context?.customers || [];

  const lowStockCount = products.filter((p: any) => (p.stockQuantity || 0) <= (p.minStockLevel || 5)).length;
  const pendingTotal = customers.reduce((sum: number, c: any) => sum + (c.totalPending || 0), 0);

  return [
    {
      id: "1",
      type: "positive",
      title: "Healthy Profit Margin",
      description: `Your net monthly profit stands at ${currency}${metrics.monthlyProfit?.toLocaleString() || "0"} with positive cash flow.`,
      actionText: "View Profit Reports",
    },
    {
      id: "2",
      type: lowStockCount > 0 ? "warning" : "positive",
      title: lowStockCount > 0 ? `${lowStockCount} Products Low on Stock` : "Stock Levels Healthy",
      description: lowStockCount > 0
        ? `Several popular items are nearing minimum safety limits. Restock promptly to prevent lost sales.`
        : `All inventory items have sufficient buffer stock for current sales velocity.`,
      actionText: "Manage Inventory",
    },
    {
      id: "3",
      type: pendingTotal > 0 ? "alert" : "positive",
      title: pendingTotal > 0 ? `Uncollected Khata Receivables` : "Zero Outstanding Dues",
      description: pendingTotal > 0
        ? `You have ${currency}${pendingTotal.toLocaleString()} pending from customers. Following up can boost working capital.`
        : `All customer accounts are fully settled. Excellent collection turnaround!`,
      actionText: "Review Khata Ledger",
    },
    {
      id: "4",
      type: "opportunity",
      title: "Fast-Moving Inventory",
      description: `High turnover on electronics and essentials. Consider bundle deals to increase average ticket size.`,
      actionText: "View Sales Trend",
    },
  ];
}

function generateLocalCommandCenterReport(context: any) {
  const currency = context?.currency || "₹";
  const metrics = context?.metrics || {};
  const products: any[] = context?.products || [];
  const customers: any[] = context?.customers || [];
  const expenses: any[] = context?.expenses || [];
  const sales: any[] = context?.sales || [];

  const monthlySales = metrics.monthlySales || 0;
  const monthlyExpenses = metrics.monthlyExpenses || 0;
  const monthlyProfit = metrics.monthlyProfit ?? (monthlySales - monthlyExpenses);
  const pendingPayments = metrics.pendingPayments ?? customers.reduce((sum: number, c: any) => sum + (c.totalPending || 0), 0);
  const todaySales = metrics.todaySales || 0;

  const marginPct = monthlySales > 0 ? (monthlyProfit / monthlySales) * 100 : 0;
  const expenseRatio = monthlySales > 0 ? (monthlyExpenses / monthlySales) * 100 : 0;

  const lowStock = products.filter((p: any) => (p.stockQuantity ?? 0) <= (p.minStockLevel ?? 5));
  const outOfStock = products.filter((p: any) => (p.stockQuantity ?? 0) === 0);
  const debtorCustomers = customers.filter((c: any) => (c.totalPending ?? 0) > 0);

  // Calculate Health Score
  let score = 86;
  if (marginPct < 15) score -= 15;
  else if (marginPct > 35) score += 4;

  if (outOfStock.length > 0) score -= (outOfStock.length * 6);
  if (lowStock.length > 0) score -= (lowStock.length * 3);

  if (monthlySales > 0 && (pendingPayments / monthlySales) > 0.35) score -= 12;
  else if (monthlySales > 0 && (pendingPayments / monthlySales) > 0.2) score -= 6;

  if (expenseRatio > 70) score -= 10;

  score = Math.max(25, Math.min(98, score));

  let healthLabel = "Optimal Operations";
  if (score < 55) healthLabel = "Critical Attention";
  else if (score < 72) healthLabel = "Action Required";
  else if (score < 86) healthLabel = "Strong Performance";

  const pillars = [
    {
      pillar: 'sales',
      title: 'Sales Velocity',
      status: todaySales > 0 ? 'healthy' : monthlySales > 0 ? 'opportunity' : 'warning',
      metric: `${currency}${monthlySales.toLocaleString()}`,
      subtext: `Today: ${currency}${todaySales.toLocaleString()} (${sales.length} transactions)`,
      insight: todaySales > 0 
        ? `Active transaction pace with ${currency}${todaySales.toLocaleString()} logged today.`
        : `Consistent monthly run rate of ${currency}${monthlySales.toLocaleString()} across recorded orders.`,
    },
    {
      pillar: 'expenses',
      title: 'Expense Ratio',
      status: expenseRatio > 70 ? 'critical' : expenseRatio > 45 ? 'warning' : 'healthy',
      metric: `${expenseRatio.toFixed(1)}% of Sales`,
      subtext: `${currency}${monthlyExpenses.toLocaleString()} total overhead`,
      insight: expenseRatio > 50
        ? `Operating costs are consuming over half of gross sales volume.`
        : `Operating expenses are well balanced against revenue inflow.`,
    },
    {
      pillar: 'profit',
      title: 'Net Profit Margin',
      status: marginPct > 25 ? 'healthy' : marginPct > 10 ? 'opportunity' : marginPct > 0 ? 'warning' : 'critical',
      metric: `${marginPct.toFixed(1)}%`,
      subtext: `Net: ${currency}${monthlyProfit.toLocaleString()}`,
      insight: marginPct > 25
        ? `High margin health providing strong cash reserve accumulation.`
        : `Protect margins by reviewing supplier costs and high-volume items.`,
    },
    {
      pillar: 'inventory',
      title: 'Stock Health',
      status: outOfStock.length > 0 ? 'critical' : lowStock.length > 0 ? 'warning' : 'healthy',
      metric: lowStock.length > 0 ? `${lowStock.length} Low / Stockout` : `${products.length} Items Safe`,
      subtext: `${products.length} active SKUs tracked`,
      insight: lowStock.length > 0
        ? `${lowStock.length} item(s) have reached safety buffers and risk order disruption.`
        : `All inventory is currently stocked safely above minimum levels.`,
    },
    {
      pillar: 'khata',
      title: 'Pending Receivables',
      status: debtorCustomers.length > 3 ? 'warning' : pendingPayments > 0 ? 'opportunity' : 'healthy',
      metric: `${currency}${pendingPayments.toLocaleString()}`,
      subtext: `${debtorCustomers.length} debtor customer(s)`,
      insight: pendingPayments > 0
        ? `${debtorCustomers.length} customer(s) carry outstanding balances awaiting recovery.`
        : `All customer Khata accounts are 100% paid and settled up.`,
    },
  ];

  const insights = [
    {
      id: 'ins-margin',
      type: 'insight',
      category: 'profit',
      title: `Net Profit Margin at ${marginPct.toFixed(1)}%`,
      description: `Your monthly profit is ${currency}${monthlyProfit.toLocaleString()} from ${currency}${monthlySales.toLocaleString()} in sales. Core revenue remains profitable.`,
      impactBadge: 'Margin Health',
      actionLabel: 'View Reports',
      actionTarget: 'reports',
    },
    {
      id: 'ins-sales',
      type: 'insight',
      category: 'sales',
      title: 'Healthy Repeat Transactions',
      description: `${sales.length} customer sales recorded. Active transactions keep working capital circulating smoothly.`,
      impactBadge: 'Revenue Flow',
      actionLabel: 'View Sales',
      actionTarget: 'sales',
    },
    {
      id: 'ins-inventory',
      type: 'insight',
      category: 'inventory',
      title: `${products.length} Catalog SKUs Monitored`,
      description: `Inventory breadth covers customer demand across core categories. Fast turnover protects margins.`,
      impactBadge: 'Inventory Asset',
      actionLabel: 'Open Catalog',
      actionTarget: 'products',
    },
  ];

  const warnings: any[] = [];
  if (lowStock.length > 0) {
    const names = lowStock.slice(0, 2).map((p: any) => p.name).join(', ');
    warnings.push({
      id: 'warn-stock',
      type: 'warning',
      category: 'inventory',
      title: `${lowStock.length} Products Below Safety Threshold`,
      description: `Items including ${names} require prompt restock to avoid lost customer sales.`,
      impactBadge: 'Restock Alert',
      actionLabel: 'Restock Products',
      actionTarget: 'products',
    });
  }

  if (pendingPayments > 0) {
    const topDebtor = debtorCustomers[0];
    warnings.push({
      id: 'warn-khata',
      type: 'warning',
      category: 'khata',
      title: `${currency}${pendingPayments.toLocaleString()} Tied Up in Khata Credit`,
      description: `${debtorCustomers.length} customer(s) owe outstanding dues${topDebtor ? `, led by ${topDebtor.name} (${currency}${(topDebtor.totalPending || 0).toLocaleString()})` : ''}.`,
      impactBadge: 'Cash Flow Risk',
      actionLabel: 'Collect Receivables',
      actionTarget: 'payments',
    });
  }

  if (expenseRatio > 50) {
    warnings.push({
      id: 'warn-expense',
      type: 'warning',
      category: 'expenses',
      title: `Elevated Overhead Ratio (${expenseRatio.toFixed(1)}%)`,
      description: `Operational costs are ${currency}${monthlyExpenses.toLocaleString()}. Review procurement and utility expenditures.`,
      impactBadge: 'Cost Control',
      actionLabel: 'Audit Expenses',
      actionTarget: 'expenses',
    });
  }

  const recommendations = [
    ...(pendingPayments > 0 ? [{
      id: 'rec-khata',
      type: 'recommendation',
      category: 'khata',
      title: `Recover ${currency}${pendingPayments.toLocaleString()} in Khata Receivables`,
      description: `Send payment reminders to top debtor accounts via WhatsApp or SMS to inject immediate cash flow.`,
      impactBadge: 'Top Priority',
      actionLabel: 'Open Khata Ledger',
      actionTarget: 'payments',
    }] : []),
    ...(lowStock.length > 0 ? [{
      id: 'rec-stock',
      type: 'recommendation',
      category: 'inventory',
      title: `Replenish ${lowStock.length} Low-Stock SKUs`,
      description: `Contact suppliers to replenish units before stockouts cause missed revenue opportunities.`,
      impactBadge: 'Restock Now',
      actionLabel: 'Update Stock',
      actionTarget: 'products',
    }] : []),
    {
      id: 'rec-sales',
      type: 'recommendation',
      category: 'sales',
      title: 'Promote Bundled High-Margin Products',
      description: `Group top selling products with higher-margin accessories to raise average cart value.`,
      impactBadge: 'Revenue Boost',
      actionLabel: 'Create Sale',
      actionTarget: 'sales',
    },
    {
      id: 'rec-costs',
      type: 'recommendation',
      category: 'expenses',
      title: 'Negotiate Bulk Procurement Terms',
      description: `Consolidate inventory purchases with primary suppliers to secure volume tier discounts.`,
      impactBadge: 'Margin Defense',
      actionLabel: 'Review Expenses',
      actionTarget: 'expenses',
    },
  ];

  return {
    summary: `Business operating at ${score}/100 health score with ${marginPct.toFixed(1)}% net margin. Top immediate focus is ${lowStock.length > 0 ? `restocking ${lowStock.length} items` : pendingPayments > 0 ? `recovering ${currency}${pendingPayments.toLocaleString()} in Khata debts` : 'expanding sales transaction volume'}.`,
    healthScore: score,
    healthLabel,
    pillars,
    insights,
    warnings,
    recommendations,
    source: 'local-analytical-engine',
    timestamp: new Date().toISOString(),
  };
}

async function startServer() {
  const distPath = path.join(process.cwd(), "dist");
  const isProductionWithDist = process.env.NODE_ENV === "production" && fs.existsSync(distPath);

  if (isProductionWithDist) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
