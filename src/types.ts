export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  totalPurchases: number;
  totalPaid: number;
  totalPending: number;
  createdDate: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  supplier: string;
  description: string;
  createdDate: string;
  totalSold: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Credit';

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  pendingAmount: number;
  paymentMethod: PaymentMethod;
  saleDate: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Salary'
  | 'Transport'
  | 'Purchase'
  | 'Marketing'
  | 'Maintenance'
  | 'Other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  date: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptNumber: string;
}

export type Payment = PaymentRecord;

export interface Invoice {
  id: string;
  invoiceNumber: string;
  saleId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  invoiceDate: string;
  dueDate?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  notes?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'stock' | 'payment' | 'sale' | 'expense' | 'system';
  read: boolean;
  timestamp: string;
  linkSection?: string;
}

export interface BusinessSettings {
  businessName: string;
  logoUrl: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  currency: string;
  invoicePrefix: string;
  defaultTaxRate: number;
  invoiceNotes?: string;
  enableNegativeStock: boolean;
  themeMode: 'light' | 'dark' | 'system';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  businessId: string;
}

export interface DashboardMetrics {
  todaySales: number;
  todayExpenses: number;
  todayProfit: number;
  totalCustomers: number;
  pendingPayments: number;
  totalProducts: number;
  lowStockProducts: number;
  monthlySales: number;
  monthlyExpenses: number;
  monthlyProfit: number;
}

export interface SmartInsight {
  id: string;
  type: 'positive' | 'warning' | 'opportunity' | 'alert';
  title: string;
  description: string;
  actionText?: string;
}

export interface ChatMessage {
  id: string;
  sender?: 'user' | 'assistant';
  role?: 'user' | 'assistant';
  text?: string;
  content?: string;
  timestamp: string;
  source?: string;
  isThinking?: boolean;
}
