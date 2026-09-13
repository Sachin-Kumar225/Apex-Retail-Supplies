import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Customer,
  Product,
  Sale,
  Expense,
  PaymentRecord,
  Invoice,
  AppNotification,
  BusinessSettings,
  StockMovement,
  UserProfile,
  DashboardMetrics,
  PaymentMethod,
  ChatMessage,
} from '../types';
import {
  initialBusinessSettings,
  initialCustomers,
  initialProducts,
  initialSales,
  initialExpenses,
  initialPayments,
  initialInvoices,
  initialNotifications,
  initialStockMovements,
  initialUser,
} from '../data/mockData';

interface BusinessContextType {
  user: UserProfile | null;
  settings: BusinessSettings;
  customers: Customer[];
  products: Product[];
  stockMovements: StockMovement[];
  sales: Sale[];
  expenses: Expense[];
  payments: PaymentRecord[];
  invoices: Invoice[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  metrics: DashboardMetrics;

  // Actions
  login: (email: string, name?: string) => void;
  logout: () => void;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  resetToDemoData: () => void;
  exportDataBackup: () => string;
  importDataBackup: (jsonString: string) => boolean;

  // Customers
  addCustomer: (cust: Omit<Customer, 'id' | 'createdDate' | 'totalPurchases' | 'totalPaid' | 'totalPending'>) => Customer;
  updateCustomer: (id: string, cust: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Products & Inventory
  addProduct: (prod: Omit<Product, 'id' | 'createdDate' | 'totalSold'>) => Product;
  updateProduct: (id: string, prod: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, type: 'in' | 'out' | 'adjustment', quantity: number, reason: string) => boolean;

  // Sales
  addSale: (saleData: {
    customerId: string;
    items: { productId: string; quantity: number; unitPrice: number; discount?: number }[];
    discount: number;
    taxRate: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    saleDate?: string;
  }) => Sale | null;
  deleteSale: (id: string) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Khata / Payments
  recordPayment: (payment: {
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    date?: string;
  }) => PaymentRecord | null;

  // Invoices
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // AI Assistant Chat Helper
  chatMessages: ChatMessage[];
  sendChatMessage: (msg: string) => Promise<void>;
  clearChat: () => void;
  isAiLoading: boolean;
}

const STORAGE_KEY = 'vyapar_business_mgr_data_v1';

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initialize with mock data
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
    return saved ? JSON.parse(saved) : initialUser;
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : initialBusinessSettings;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_products`);
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_movements`);
    return saved ? JSON.parse(saved) : initialStockMovements;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_sales`);
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_payments`);
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your AI Business Advisor. I have full real-time access to your sales, inventory, expenses, customer Khata, and profit metrics. How can I help you grow today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_products`, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_movements`, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_sales`, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_payments`, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
  }, [notifications]);

  // Derived real-time metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

    // Today's Sales
    const todaySales = sales
      .filter((s) => s.saleDate.startsWith(todayStr))
      .reduce((sum, s) => sum + s.grandTotal, 0);

    // Today's Expenses
    const todayExpenses = expenses
      .filter((e) => e.date.startsWith(todayStr))
      .reduce((sum, e) => sum + e.amount, 0);

    const todayProfit = todaySales - todayExpenses;

    // Monthly Sales
    const monthlySales = sales
      .filter((s) => s.saleDate.startsWith(currentMonthStr))
      .reduce((sum, s) => sum + s.grandTotal, 0);

    // Monthly Expenses
    const monthlyExpenses = expenses
      .filter((e) => e.date.startsWith(currentMonthStr))
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyProfit = monthlySales - monthlyExpenses;

    // Customers total pending payments
    const pendingPayments = customers.reduce((sum, c) => sum + (c.totalPending || 0), 0);

    // Products low stock
    const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStockLevel).length;

    return {
      todaySales,
      todayExpenses,
      todayProfit,
      totalCustomers: customers.length,
      pendingPayments,
      totalProducts: products.length,
      lowStockProducts,
      monthlySales,
      monthlyExpenses,
      monthlyProfit,
    };
  }, [sales, expenses, customers, products]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Auth simulation
  const login = (email: string, name?: string) => {
    setUser({
      id: `usr_${Date.now()}`,
      name: name || email.split('@')[0],
      email,
      role: 'Owner & Administrator',
      businessId: 'biz_01',
    });
  };

  const logout = () => {
    setUser(null);
  };

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToDemoData = () => {
    setUser(initialUser);
    setSettings(initialBusinessSettings);
    setCustomers(initialCustomers);
    setProducts(initialProducts);
    setStockMovements(initialStockMovements);
    setSales(initialSales);
    setExpenses(initialExpenses);
    setPayments(initialPayments);
    setInvoices(initialInvoices);
    setNotifications(initialNotifications);
  };

  const exportDataBackup = (): string => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings,
      customers,
      products,
      stockMovements,
      sales,
      expenses,
      payments,
      invoices,
      notifications,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importDataBackup = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.customers && parsed.products) {
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.notifications) setNotifications(parsed.notifications);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Customer handlers
  const addCustomer = (custData: Omit<Customer, 'id' | 'createdDate' | 'totalPurchases' | 'totalPaid' | 'totalPending'>): Customer => {
    const newCust: Customer = {
      ...custData,
      id: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
      totalPurchases: 0,
      totalPaid: 0,
      totalPending: 0,
      createdDate: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCust, ...prev]);

    // Push notification
    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        title: 'New Customer Added',
        message: `${newCust.name} was registered into your customer book.`,
        type: 'system',
        read: false,
        timestamp: new Date().toISOString(),
        linkSection: 'customers',
      },
      ...prev,
    ]);

    return newCust;
  };

  const updateCustomer = (id: string, updated: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Product handlers
  const addProduct = (prodData: Omit<Product, 'id' | 'createdDate' | 'totalSold'>): Product => {
    const newProd: Product = {
      ...prodData,
      id: `PROD-${String(products.length + 1).padStart(3, '0')}`,
      totalSold: 0,
      createdDate: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => [newProd, ...prev]);

    // Check low stock
    if (newProd.stockQuantity <= newProd.minStockLevel) {
      setNotifications((prev) => [
        {
          id: `NOTIF-${Date.now()}`,
          title: 'Low Stock Alert',
          message: `${newProd.name} entered with ${newProd.stockQuantity} items (Min: ${newProd.minStockLevel}).`,
          type: 'stock',
          read: false,
          timestamp: new Date().toISOString(),
          linkSection: 'products',
        },
        ...prev,
      ]);
    }

    return newProd;
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newP = { ...p, ...updated };
          if (newP.stockQuantity <= newP.minStockLevel && p.stockQuantity > p.minStockLevel) {
            setNotifications((n) => [
              {
                id: `NOTIF-${Date.now()}`,
                title: 'Low Stock Alert',
                message: `${newP.name} dropped to ${newP.stockQuantity} units!`,
                type: 'stock',
                read: false,
                timestamp: new Date().toISOString(),
                linkSection: 'products',
              },
              ...n,
            ]);
          }
          return newP;
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const adjustStock = (productId: string, type: 'in' | 'out' | 'adjustment', quantity: number, reason: string): boolean => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return false;

    let newStock = prod.stockQuantity;
    if (type === 'in') {
      newStock += quantity;
    } else if (type === 'out') {
      if (!settings.enableNegativeStock && newStock < quantity) {
        return false; // Prevent negative stock
      }
      newStock -= quantity;
    } else if (type === 'adjustment') {
      if (!settings.enableNegativeStock && quantity < 0) {
        return false;
      }
      newStock = quantity;
    }

    const movement: StockMovement = {
      id: `MOV-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      type,
      quantity,
      previousStock: prod.stockQuantity,
      newStock,
      reason,
      date: new Date().toISOString(),
    };

    setStockMovements((prev) => [movement, ...prev]);
    updateProduct(productId, { stockQuantity: newStock });

    return true;
  };

  // Sales Handler
  const addSale = (saleData: {
    customerId: string;
    items: { productId: string; quantity: number; unitPrice: number; discount?: number }[];
    discount: number;
    taxRate: number;
    paidAmount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    saleDate?: string;
  }): Sale | null => {
    const cust = customers.find((c) => c.id === saleData.customerId);
    if (!cust) return null;

    // Check stock availability if negative stock disabled
    if (!settings.enableNegativeStock) {
      for (const it of saleData.items) {
        const prod = products.find((p) => p.id === it.productId);
        if (prod && prod.stockQuantity < it.quantity) {
          return null; // insufficient stock
        }
      }
    }

    // Prepare Sale Items
    let subtotal = 0;
    const saleItems = saleData.items.map((it) => {
      const prod = products.find((p) => p.id === it.productId);
      const lineSubtotal = it.quantity * it.unitPrice;
      subtotal += lineSubtotal;
      return {
        productId: it.productId,
        productName: prod?.name || 'Product',
        sku: prod?.sku || 'SKU',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: lineSubtotal,
      };
    });

    const discountedSubtotal = Math.max(0, subtotal - (saleData.discount || 0));
    const taxAmount = Number(((discountedSubtotal * (saleData.taxRate || 0)) / 100).toFixed(2));
    const grandTotal = Number((discountedSubtotal + taxAmount).toFixed(2));
    const paidAmount = Math.min(grandTotal, saleData.paidAmount);
    const pendingAmount = Number((grandTotal - paidAmount).toFixed(2));

    const invoiceNum = `${settings.invoicePrefix}${String(sales.length + 1).padStart(3, '0')}`;
    const saleDate = saleData.saleDate || new Date().toISOString().split('T')[0];

    const newSale: Sale = {
      id: `SALE-${Date.now()}`,
      invoiceNumber: invoiceNum,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      items: saleItems,
      subtotal,
      discount: saleData.discount || 0,
      taxRate: saleData.taxRate || 0,
      taxAmount,
      grandTotal,
      paidAmount,
      pendingAmount,
      paymentMethod: saleData.paymentMethod,
      saleDate,
      notes: saleData.notes,
    };

    // 1. Update product stocks and totalSold
    setProducts((prev) =>
      prev.map((p) => {
        const matchingItem = saleData.items.find((it) => it.productId === p.id);
        if (matchingItem) {
          const newQty = Math.max(0, p.stockQuantity - matchingItem.quantity);
          return {
            ...p,
            stockQuantity: newQty,
            totalSold: (p.totalSold || 0) + matchingItem.quantity,
          };
        }
        return p;
      })
    );

    // 2. Update customer purchases and pending balance
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === cust.id) {
          return {
            ...c,
            totalPurchases: Number((c.totalPurchases + grandTotal).toFixed(2)),
            totalPaid: Number((c.totalPaid + paidAmount).toFixed(2)),
            totalPending: Number((c.totalPending + pendingAmount).toFixed(2)),
          };
        }
        return c;
      })
    );

    // 3. Create matching invoice
    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: invoiceNum,
      saleId: newSale.id,
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      customerAddress: cust.address,
      invoiceDate: saleDate,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: saleItems,
      subtotal,
      discount: saleData.discount || 0,
      taxRate: saleData.taxRate || 0,
      taxAmount,
      grandTotal,
      paidAmount,
      balanceDue: pendingAmount,
      status: pendingAmount === 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid',
      notes: saleData.notes || 'Thank you for your business!',
    };

    setSales((prev) => [newSale, ...prev]);
    setInvoices((prev) => [newInvoice, ...prev]);

    // 4. If paid amount > 0, log payment record in Khata
    if (paidAmount > 0) {
      const newPayRecord: PaymentRecord = {
        id: `PAY-${Date.now()}`,
        customerId: cust.id,
        customerName: cust.name,
        amount: paidAmount,
        paymentDate: new Date().toISOString(),
        paymentMethod: saleData.paymentMethod,
        receiptNumber: `RCPT-${Date.now().toString().slice(-6)}`,
        notes: `Paid at sale time for ${invoiceNum}`,
      };
      setPayments((prev) => [newPayRecord, ...prev]);
    }

    // 5. Notify
    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        title: 'New Sale Completed',
        message: `${invoiceNum} created for ${cust.name} (${settings.currency}${grandTotal}).`,
        type: 'sale',
        read: false,
        timestamp: new Date().toISOString(),
        linkSection: 'sales',
      },
      ...prev,
    ]);

    return newSale;
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
  };

  // Expenses handlers
  const addExpense = (expenseData: Omit<Expense, 'id'>): Expense => {
    const newExp: Expense = {
      ...expenseData,
      id: `EXP-${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);

    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        title: 'Expense Added',
        message: `${newExp.category}: ${settings.currency}${newExp.amount} logged.`,
        type: 'expense',
        read: false,
        timestamp: new Date().toISOString(),
        linkSection: 'expenses',
      },
      ...prev,
    ]);

    return newExp;
  };

  const updateExpense = (id: string, updated: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Khata Payment received handler
  const recordPayment = (payment: {
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    date?: string;
  }): PaymentRecord | null => {
    const cust = customers.find((c) => c.id === payment.customerId);
    if (!cust) return null;

    const receiptNum = `RCPT-${Date.now().toString().slice(-6)}`;
    const newRecord: PaymentRecord = {
      id: `PAY-${Date.now()}`,
      customerId: cust.id,
      customerName: cust.name,
      amount: payment.amount,
      paymentDate: payment.date || new Date().toISOString(),
      paymentMethod: payment.paymentMethod,
      notes: payment.notes || 'Khata settlement payment',
      receiptNumber: receiptNum,
    };

    // Update customer balances
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === cust.id) {
          const newPending = Math.max(0, Number((c.totalPending - payment.amount).toFixed(2)));
          const newPaid = Number((c.totalPaid + payment.amount).toFixed(2));
          return {
            ...c,
            totalPending: newPending,
            totalPaid: newPaid,
          };
        }
        return c;
      })
    );

    // Update customer's unpaid/partial invoices
    let remainingPayment = payment.amount;
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.customerId === cust.id && inv.balanceDue > 0 && remainingPayment > 0) {
          const applied = Math.min(inv.balanceDue, remainingPayment);
          remainingPayment -= applied;
          const newBalance = Number((inv.balanceDue - applied).toFixed(2));
          const newPaid = Number((inv.paidAmount + applied).toFixed(2));
          return {
            ...inv,
            paidAmount: newPaid,
            balanceDue: newBalance,
            status: newBalance === 0 ? 'Paid' : 'Partial',
          };
        }
        return inv;
      })
    );

    setPayments((prev) => [newRecord, ...prev]);

    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        title: 'Payment Received',
        message: `Received ${settings.currency}${payment.amount} from ${cust.name}.`,
        type: 'payment',
        read: false,
        timestamp: new Date().toISOString(),
        linkSection: 'payments',
      },
      ...prev,
    ]);

    return newRecord;
  };

  // Invoices
  const addInvoice = (invoiceData: Omit<Invoice, 'id'>): Invoice => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `INV-${Date.now()}`,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    return newInvoice;
  };

  const updateInvoice = (id: string, updated: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updated } : inv)));
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // AI Assistant Chat Helper
  const sendChatMessage = async (msg: string) => {
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      // Build rich context payload from actual business application data
      const contextPayload = {
        currency: settings.currency,
        businessName: settings.businessName,
        metrics,
        customers: customers.map((c) => ({
          name: c.name,
          phone: c.phone,
          totalPurchases: c.totalPurchases,
          totalPaid: c.totalPaid,
          totalPending: c.totalPending,
        })),
        products: products.map((p) => ({
          name: p.name,
          sku: p.sku,
          category: p.category,
          stockQuantity: p.stockQuantity,
          minStockLevel: p.minStockLevel,
          sellingPrice: p.sellingPrice,
          purchasePrice: p.purchasePrice,
          totalSold: p.totalSold,
        })),
        sales: sales.slice(0, 15).map((s) => ({
          invoiceNumber: s.invoiceNumber,
          customerName: s.customerName,
          grandTotal: s.grandTotal,
          paidAmount: s.paidAmount,
          pendingAmount: s.pendingAmount,
          saleDate: s.saleDate,
          paymentMethod: s.paymentMethod,
        })),
        expenses: expenses.slice(0, 15).map((e) => ({
          category: e.category,
          amount: e.amount,
          date: e.date,
          description: e.description,
        })),
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context: contextPayload,
        }),
      });

      const data = await res.json();
      const assistantText = data.response || 'I was unable to retrieve an analysis. Please try asking again.';

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: 'assistant',
          text: assistantText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: data.source,
        },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'assistant',
          text: `An error occurred while analyzing the data. Please ensure the server is running. (${err?.message || 'Network error'})`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Chat cleared. I'm ready to answer any questions regarding your sales, inventory, or expenses.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <BusinessContext.Provider
      value={{
        user,
        settings,
        customers,
        products,
        stockMovements,
        sales,
        expenses,
        payments,
        invoices,
        notifications,
        unreadNotificationCount,
        metrics,
        login,
        logout,
        updateSettings,
        resetToDemoData,
        exportDataBackup,
        importDataBackup,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addSale,
        deleteSale,
        addExpense,
        updateExpense,
        deleteExpense,
        recordPayment,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        chatMessages,
        sendChatMessage,
        clearChat,
        isAiLoading,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = (): BusinessContextType => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
