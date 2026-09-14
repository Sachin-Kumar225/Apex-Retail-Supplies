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
  BusinessProfile,
  DailyBusinessUpdatePayload,
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
  initialBusinessProfile,
} from '../data/mockData';
import { supabase, isSupabaseConfigured, authSignOut } from '../lib/supabase';

interface BusinessContextType {
  user: UserProfile | null;
  isAuthLoading: boolean;
  settings: BusinessSettings;
  businessProfile: BusinessProfile;
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
  signUp: (name: string, email: string, businessName?: string) => void;
  saveBusinessProfile: (profile: BusinessProfile) => void;
  recordDailyBusinessUpdate: (payload: DailyBusinessUpdatePayload) => {
    sale?: Sale;
    expensesCreated?: Expense[];
    payment?: PaymentRecord;
  };
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
  // Authentication state: starts as null so opening the app displays the login info screen, not dashboard
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      localStorage.removeItem(`${STORAGE_KEY}_user`);
    } catch {
      // ignore
    }
    return null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currency === '$' || !parsed.currency) {
          parsed.currency = '₹';
        }
        return parsed;
      } catch (e) {
        return initialBusinessSettings;
      }
    }
    return initialBusinessSettings;
  });

  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_business_profile`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currency === '$' || !parsed.currency) {
          parsed.currency = '₹';
        }
        return parsed;
      } catch (e) {
        return initialBusinessProfile;
      }
    }
    return initialBusinessProfile;
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

  // Sync user state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(user));
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_user`);
    }
  }, [user]);

  // Supabase Authentication session listener and initialization
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user && isMounted) {
            const sbUser = data.session.user;
            const profile: UserProfile = {
              id: sbUser.id,
              name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Business Owner',
              email: sbUser.email || '',
              role: (sbUser.user_metadata?.role as any) || 'Owner & Administrator',
              businessId: `biz_${sbUser.id.slice(0, 8)}`,
            };
            setUser(profile);
            localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(profile));
          }
        } catch (err) {
          console.warn('Supabase session load error:', err);
        }
      }
      if (isMounted) {
        setIsAuthLoading(false);
      }
    }

    initializeAuth();

    if (isSupabaseConfigured && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const sbUser = session.user;
          const profile: UserProfile = {
            id: sbUser.id,
            name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'Business Owner',
            email: sbUser.email || '',
            role: (sbUser.user_metadata?.role as any) || 'Owner & Administrator',
            businessId: `biz_${sbUser.id.slice(0, 8)}`,
          };
          setUser(profile);
          localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(profile));
          if (sbUser.user_metadata?.businessName) {
            setSettings((prev) => ({
              ...prev,
              businessName: sbUser.user_metadata.businessName,
              ownerName: sbUser.user_metadata.name || prev.ownerName,
            }));
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(`${STORAGE_KEY}_user`);
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_business_profile`, JSON.stringify(businessProfile));
  }, [businessProfile]);

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

  // Auth methods
  const login = (email: string, name?: string) => {
    const isDemo = email.toLowerCase().includes('rajesh') || email.toLowerCase().includes('demo');
    const profile: UserProfile = {
      id: isDemo ? initialUser.id : `usr_${Date.now()}`,
      name: name || (isDemo ? initialUser.name : email.split('@')[0]),
      email: email.trim(),
      role: 'Owner & Administrator',
      businessId: isDemo ? initialUser.businessId : `biz_${Date.now()}`,
      avatar: isDemo ? initialUser.avatar : undefined,
    };
    setUser(profile);
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(profile));
  };

  const logout = () => {
    try {
      authSignOut().catch((err) => console.warn('Supabase sign out notice:', err));
    } catch (e) {
      console.warn('Sign out caught:', e);
    }
    setUser(null);
    try {
      localStorage.removeItem(`${STORAGE_KEY}_user`);
    } catch (e) {
      console.warn('Local storage removal warning:', e);
    }
  };

  const signUp = (name: string, email: string, businessName?: string) => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role: 'Owner & Administrator',
      businessId: `biz_${Date.now()}`,
    };
    setUser(newUser);
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(newUser));
    const storeName = businessName?.trim() || `${name.trim()}'s Store`;
    setBusinessProfile((prev) => ({
      ...prev,
      ownerName: name.trim(),
      businessName: storeName,
      hasCompletedSetup: false,
    }));
    setSettings((prev) => ({
      ...prev,
      businessName: storeName,
      ownerName: name.trim(),
    }));
  };

  const saveBusinessProfile = (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    setSettings((prev) => ({
      ...prev,
      businessName: profile.businessName || prev.businessName,
      ownerName: profile.ownerName || prev.ownerName,
      currency: profile.currency || prev.currency,
    }));
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Business Profile Configured',
        message: `${profile.businessName} profile saved. Daily targets and AI insights are now personalized.`,
        type: 'system',
        read: false,
        timestamp: new Date().toISOString(),
        linkSection: 'dashboard',
      },
      ...prev,
    ]);
  };

  const recordDailyBusinessUpdate = (payload: DailyBusinessUpdatePayload) => {
    const dateStr = payload.date || new Date().toISOString().split('T')[0];
    let createdSale: Sale | undefined = undefined;
    const createdExpenses: Expense[] = [];
    let createdPayment: PaymentRecord | undefined = undefined;

    // 1. Record Sale if totalSales > 0
    if (payload.totalSales > 0) {
      let targetCust = customers.find(
        (c) => c.name.toLowerCase().includes('walk-in') || c.id === payload.customerId
      );
      if (!targetCust && customers.length > 0) {
        targetCust = customers[0];
      }

      const invoiceNum = `${settings.invoicePrefix}${String(sales.length + 1).padStart(3, '0')}`;
      const paid = Math.min(payload.totalSales, payload.moneyReceived);
      const pending = Math.max(0, payload.totalSales - paid);

      // Product-wise entry is optional
      let saleItems = [];
      if (payload.optionalProducts && payload.optionalProducts.length > 0) {
        saleItems = payload.optionalProducts.map((p) => ({
          productId: p.productId,
          productName: p.productName || 'Item',
          sku: 'SKU',
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          subtotal: Number((p.quantity * p.unitPrice).toFixed(2)),
        }));

        // Deduct stock for chosen optional products
        setProducts((prev) =>
          prev.map((prod) => {
            const match = payload.optionalProducts?.find((op) => op.productId === prod.id);
            if (match) {
              return {
                ...prod,
                stockQuantity: Math.max(0, prod.stockQuantity - match.quantity),
                totalSold: (prod.totalSold || 0) + match.quantity,
              };
            }
            return prod;
          })
        );
      } else {
        saleItems = [
          {
            productId: 'prod_daily_summary',
            productName: 'Daily Consolidated Sales',
            sku: 'DAILY-AGG',
            quantity: 1,
            unitPrice: payload.totalSales,
            subtotal: payload.totalSales,
          },
        ];
      }

      createdSale = {
        id: `SALE-${Date.now()}`,
        invoiceNumber: invoiceNum,
        customerId: targetCust?.id || 'CUST-GENERAL',
        customerName: targetCust?.name || 'Walk-in Customers (Daily)',
        customerPhone: targetCust?.phone || '+1 555-0000',
        items: saleItems,
        subtotal: payload.totalSales,
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: payload.totalSales,
        paidAmount: paid,
        pendingAmount: pending,
        paymentMethod: 'Cash',
        saleDate: dateStr,
        notes:
          payload.notes ||
          `Daily Business Update for ${dateStr}. Money received: ${settings.currency}${paid}`,
      };

      setSales((prev) => [createdSale!, ...prev]);

      if (pending > 0 && targetCust) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === targetCust?.id
              ? {
                  ...c,
                  totalPurchases: Number((c.totalPurchases + payload.totalSales).toFixed(2)),
                  totalPaid: Number((c.totalPaid + paid).toFixed(2)),
                  totalPending: Number((c.totalPending + pending).toFixed(2)),
                }
              : c
          )
        );
      }
    }

    // 2. Record Expenses if expenses > 0
    if (payload.expenses > 0) {
      const expId = `EXP-${Date.now()}`;
      const newExp: Expense = {
        id: expId,
        category: (payload.expenseCategory as any) || 'Daily Supplies',
        description: payload.expenseNotes || `Daily operating expenses (${dateStr})`,
        amount: payload.expenses,
        date: dateStr,
        paymentMethod: 'Cash',
      };
      createdExpenses.push(newExp);
      setExpenses((prev) => [newExp, ...prev]);
    }

    // 3. Record Supplier Payments if supplierPayments > 0
    if (payload.supplierPayments > 0) {
      const supExpId = `EXP-SUP-${Date.now()}`;
      const supExp: Expense = {
        id: supExpId,
        category: 'Transport',
        description: `Supplier payment${payload.supplierName ? `: ${payload.supplierName}` : ''} (${dateStr})`,
        amount: payload.supplierPayments,
        date: dateStr,
        paymentMethod: 'Bank Transfer',
      };
      createdExpenses.push(supExp);
      setExpenses((prev) => [supExp, ...prev]);
    }

    // 4. Record Customer Payments / Khata received if customerPayments > 0
    if (payload.customerPayments > 0) {
      const payCust = payload.customerId
        ? customers.find((c) => c.id === payload.customerId)
        : customers.find((c) => c.totalPending > 0) || customers[0];

      if (payCust) {
        createdPayment = {
          id: `PAY-${Date.now()}`,
          customerId: payCust.id,
          customerName: payCust.name,
          amount: payload.customerPayments,
          paymentDate: dateStr,
          paymentMethod: 'Cash',
          notes: `Daily customer khata payment collection`,
          receiptNumber: `REC-${Date.now().toString().slice(-4)}`,
        };
        setPayments((prev) => [createdPayment!, ...prev]);

        setCustomers((prev) =>
          prev.map((c) =>
            c.id === payCust.id
              ? {
                  ...c,
                  totalPaid: Number((c.totalPaid + payload.customerPayments).toFixed(2)),
                  totalPending: Number(Math.max(0, c.totalPending - payload.customerPayments).toFixed(2)),
                }
              : c
          )
        );
      }
    }

    // Add summary notification
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        title: 'Daily Business Update Recorded',
        message: `Logged for ${dateStr}: Sales ${settings.currency}${payload.totalSales}, Cash in ${settings.currency}${payload.moneyReceived}, Expenses ${settings.currency}${payload.expenses}`,
        type: 'sale',
        read: false,
        timestamp: new Date().toISOString(),
        linkSection: 'dashboard',
      },
      ...prev,
    ]);

    return {
      sale: createdSale,
      expensesCreated: createdExpenses,
      payment: createdPayment,
    };
  };

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetToDemoData = () => {
    setUser(initialUser);
    setSettings(initialBusinessSettings);
    setBusinessProfile(initialBusinessProfile);
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
        isAuthLoading,
        settings,
        businessProfile,
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
        signUp,
        saveBusinessProfile,
        recordDailyBusinessUpdate,
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
