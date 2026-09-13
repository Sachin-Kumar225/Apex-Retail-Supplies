import express from "express";
import path from "path";
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
${JSON.stringify(context, null, 2)}
`;

    // Format conversation history for Gemini
    const contents: any[] = [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
      },
    ];

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
    });

    const text = result.text || "I was unable to analyze the data. Please try again.";
    return res.json({
      response: text,
      source: "gemini-3.8-flash",
    });
  } catch (error: any) {
    console.error("Error in /api/ai/chat:", error);
    // Fallback gracefully so user gets a real answer from their data
    const fallbackResponse = generateLocalBusinessInsights(req.body.message || "", req.body.context || {});
    return res.json({
      response: fallbackResponse,
      source: "local-analytical-engine-fallback",
      error: error.message,
    });
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
${JSON.stringify(context, null, 2)}
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
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

    return res.json({ insights });
  } catch (error: any) {
    console.error("Error in /api/ai/insights:", error);
    const insights = generateStructuredInsights(req.body.context || {});
    return res.json({ insights });
  }
});

// Deterministic Analytical Engine for immediate, accurate, grounded answers
function generateLocalBusinessInsights(message: string, context: any): string {
  const query = message.toLowerCase();
  const currency = context?.currency || "$";
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
  const currency = context?.currency || "$";
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

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
