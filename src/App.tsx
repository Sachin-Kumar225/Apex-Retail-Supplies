/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Store, Loader2 } from 'lucide-react';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { AppLayout } from './components/layout/AppLayout';

// Views
import { AuthScreen } from './views/AuthScreen';
import { DashboardView } from './views/DashboardView';
import { SalesView } from './views/SalesView';
import { CustomersView } from './views/CustomersView';
import { InventoryView } from './views/InventoryView';
import { ExpensesView } from './views/ExpensesView';
import { KhataView } from './views/KhataView';
import { InvoicesView } from './views/InvoicesView';
import { ReportsView } from './views/ReportsView';
import { AiAssistantView } from './views/AiAssistantView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';

// Modals
import { AddSaleModal } from './components/modals/AddSaleModal';
import { AddCustomerModal } from './components/modals/AddCustomerModal';
import { AddProductModal } from './components/modals/AddProductModal';
import { StockAdjustModal } from './components/modals/StockAdjustModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { CollectPaymentModal } from './components/modals/CollectPaymentModal';
import { InvoicePreviewModal } from './components/modals/InvoicePreviewModal';
import { CustomerDetailModal } from './components/modals/CustomerDetailModal';
import { BusinessSetupModal } from './components/modals/BusinessSetupModal';
import { SignUpModal } from './components/modals/SignUpModal';

// Types
import { Customer, Product, Expense, Invoice } from './types';

function MainAppContent() {
  const { user, isAuthLoading, businessProfile } = useBusiness();
  const [currentSection, setCurrentSection] = useState<string>('dashboard');

  // Modal states
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [saleCustomerId, setSaleCustomerId] = useState<string | undefined>(undefined);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);
  const [customerForPayment, setCustomerForPayment] = useState<string | undefined>(undefined);

  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);

  // Business Onboarding Setup Questionnaire & Sign Up Modals
  const [isBusinessSetupOpen, setIsBusinessSetupOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  // Auto-launch Business Setup Questionnaire if not yet completed (e.g. after sign up)
  useEffect(() => {
    if (user && businessProfile && !businessProfile.hasCompletedSetup) {
      setIsBusinessSetupOpen(true);
    }
  }, [user, businessProfile?.hasCompletedSetup]);

  // Loading state while verifying Supabase persistent session
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#060b17] flex flex-col items-center justify-center text-slate-200">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-cyan-950/60 border border-cyan-400/40 mb-4 animate-pulse">
          <Store className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Verifying secure business session...</span>
        </div>
      </div>
    );
  }

  // Authentication Gate: Non-authenticated users cannot access the dashboard
  if (!user) {
    return <AuthScreen />;
  }

  // Quick Action Handlers
  const handleOpenAddSale = (preselectedCustId?: string) => {
    setSaleCustomerId(preselectedCustId);
    setIsAddSaleOpen(true);
  };

  const handleOpenAddCustomer = () => {
    setCustomerToEdit(null);
    setIsAddCustomerOpen(true);
  };

  const handleEditCustomer = (cust: Customer) => {
    setCustomerToEdit(cust);
    setIsAddCustomerOpen(true);
  };

  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsAddProductOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setIsAddProductOpen(true);
  };

  const handleOpenAdjustStock = (prod?: Product) => {
    setSelectedProductForAdjust(prod || null);
    setIsAdjustStockOpen(true);
  };

  const handleOpenAddExpense = () => {
    setExpenseToEdit(null);
    setIsAddExpenseOpen(true);
  };

  const handleEditExpense = (exp: Expense) => {
    setExpenseToEdit(exp);
    setIsAddExpenseOpen(true);
  };

  const handleOpenCollectPayment = (cust?: Customer) => {
    setCustomerForPayment(cust?.id);
    setIsCollectPaymentOpen(true);
  };

  const handleOpenInvoicePreview = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsInvoicePreviewOpen(true);
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomerDetail(cust);
    setIsCustomerDetailOpen(true);
  };

  return (
    <AppLayout currentSection={currentSection} onNavigate={setCurrentSection}>
      {/* Active Section Rendering */}
      {currentSection === 'dashboard' && (
        <DashboardView
          onNavigate={setCurrentSection}
          onOpenAddSale={() => handleOpenAddSale()}
          onOpenAddCustomer={handleOpenAddCustomer}
          onOpenAddProduct={handleOpenAddProduct}
          onOpenAddExpense={handleOpenAddExpense}
          onOpenInvoicePreview={handleOpenInvoicePreview}
          onCollectPayment={(cust) => handleOpenCollectPayment(cust)}
        />
      )}

      {currentSection === 'sales' && (
        <SalesView
          onOpenAddSale={() => handleOpenAddSale()}
          onOpenInvoicePreview={handleOpenInvoicePreview}
        />
      )}

      {currentSection === 'customers' && (
        <CustomersView
          onOpenAddCustomer={handleOpenAddCustomer}
          onEditCustomer={handleEditCustomer}
          onSelectCustomer={handleSelectCustomer}
          onRecordPayment={(cust) => handleOpenCollectPayment(cust)}
        />
      )}

      {currentSection === 'products' && (
        <InventoryView
          onOpenAddProduct={handleOpenAddProduct}
          onEditProduct={handleEditProduct}
          onOpenAdjustStock={handleOpenAdjustStock}
        />
      )}

      {currentSection === 'expenses' && (
        <ExpensesView
          onOpenAddExpense={handleOpenAddExpense}
          onEditExpense={handleEditExpense}
        />
      )}

      {currentSection === 'payments' && (
        <KhataView
          onOpenCollectPayment={(cust) => handleOpenCollectPayment(cust)}
          onSelectCustomer={handleSelectCustomer}
        />
      )}

      {currentSection === 'invoices' && (
        <InvoicesView
          onOpenAddSale={() => handleOpenAddSale()}
          onOpenInvoicePreview={handleOpenInvoicePreview}
        />
      )}

      {currentSection === 'reports' && <ReportsView />}

      {currentSection === 'assistant' && <AiAssistantView />}

      {currentSection === 'notifications' && (
        <NotificationsView onNavigate={setCurrentSection} />
      )}

      {currentSection === 'settings' && <SettingsView />}

      {/* Global Modals */}
      <AddSaleModal
        isOpen={isAddSaleOpen}
        onClose={() => setIsAddSaleOpen(false)}
        preselectedCustomerId={saleCustomerId}
      />

      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => {
          setIsAddCustomerOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      <StockAdjustModal
        isOpen={isAdjustStockOpen}
        onClose={() => {
          setIsAdjustStockOpen(false);
          setSelectedProductForAdjust(null);
        }}
        selectedProduct={selectedProductForAdjust}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setExpenseToEdit(null);
        }}
        expenseToEdit={expenseToEdit}
      />

      <CollectPaymentModal
        isOpen={isCollectPaymentOpen}
        onClose={() => {
          setIsCollectPaymentOpen(false);
          setCustomerForPayment(undefined);
        }}
        preselectedCustomerId={customerForPayment}
      />

      <InvoicePreviewModal
        isOpen={isInvoicePreviewOpen}
        onClose={() => {
          setIsInvoicePreviewOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />

      <CustomerDetailModal
        isOpen={isCustomerDetailOpen}
        onClose={() => {
          setIsCustomerDetailOpen(false);
          setSelectedCustomerDetail(null);
        }}
        customer={selectedCustomerDetail}
        onRecordPayment={(cust) => handleOpenCollectPayment(cust)}
        onNewSale={(cust) => handleOpenAddSale(cust.id)}
        onEdit={(cust) => handleEditCustomer(cust)}
      />

      {/* Business Setup Questionnaire Modal */}
      <BusinessSetupModal
        isOpen={isBusinessSetupOpen}
        onClose={() => setIsBusinessSetupOpen(false)}
      />

      {/* Sign Up Modal (Triggers Questionnaire immediately upon submit) */}
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSignedUp={() => setIsBusinessSetupOpen(true)}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <BusinessProvider>
      <MainAppContent />
    </BusinessProvider>
  );
}
