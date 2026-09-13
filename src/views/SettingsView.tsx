import React, { useState } from 'react';
import {
  Settings,
  Building,
  FileText,
  Database,
  Save,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { BusinessSettings } from '../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToDemoData, sales, products, customers, expenses, payments, invoices } =
    useBusiness();

  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportJSON = () => {
    const fullBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: formData,
      products,
      customers,
      sales,
      expenses,
      payments,
      invoices,
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `business_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) {
          updateSettings(parsed.settings);
          setFormData(parsed.settings);
        }
        if (parsed.products) localStorage.setItem('biz_products', JSON.stringify(parsed.products));
        if (parsed.customers) localStorage.setItem('biz_customers', JSON.stringify(parsed.customers));
        if (parsed.sales) localStorage.setItem('biz_sales', JSON.stringify(parsed.sales));
        if (parsed.expenses) localStorage.setItem('biz_expenses', JSON.stringify(parsed.expenses));
        if (parsed.payments) localStorage.setItem('biz_payments', JSON.stringify(parsed.payments));
        if (parsed.invoices) localStorage.setItem('biz_invoices', JSON.stringify(parsed.invoices));

        setImportStatus('Backup restored successfully! Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        setImportStatus('Error importing JSON: Invalid backup file structure.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="theme-card p-5 sm:p-6 theme-card-hover">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Store & System Settings
          </h1>
          <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-950/70 text-cyan-300 rounded-full border border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.15)]">
            Preferences
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your business identity, tax rates, billing info, and data backups
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Settings saved successfully!
        </div>
      )}

      {importStatus && (
        <div className="p-4 bg-cyan-950/60 border border-cyan-500/30 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          {importStatus}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Profile */}
        <div className="theme-card p-5 sm:p-6 theme-card-hover space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-blue-900/60 pb-3">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>Business Profile & Contact</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Business Name
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full text-xs theme-input px-3.5 py-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Owner / Manager Name
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full text-xs theme-input px-3.5 py-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs theme-input px-3.5 py-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs theme-input px-3.5 py-2.5"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Store / Office Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs theme-input px-3.5 py-2.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full text-xs theme-input px-3.5 py-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Display Currency Symbol
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full text-xs theme-input px-3 py-2.5"
              >
                <option value="$" className="bg-slate-900 text-white">$ (USD - United States Dollar)</option>
                <option value="₹" className="bg-slate-900 text-white">₹ (INR - Indian Rupee)</option>
                <option value="€" className="bg-slate-900 text-white">€ (EUR - Euro)</option>
                <option value="£" className="bg-slate-900 text-white">£ (GBP - British Pound)</option>
                <option value="C$" className="bg-slate-900 text-white">C$ (CAD - Canadian Dollar)</option>
                <option value="A$" className="bg-slate-900 text-white">A$ (AUD - Australian Dollar)</option>
                <option value="AED " className="bg-slate-900 text-white">AED (United Arab Emirates Dirham)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoicing Defaults */}
        <div className="theme-card p-5 sm:p-6 theme-card-hover space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-blue-900/60 pb-3">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Invoicing & Inventory Defaults</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                className="w-full text-xs theme-input px-3.5 py-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Tax / GST Rate (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs theme-input px-3.5 py-2.5"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Invoice Footer Terms
              </label>
              <input
                type="text"
                value={formData.invoiceNotes}
                onChange={(e) => setFormData({ ...formData, invoiceNotes: e.target.value })}
                className="w-full text-xs theme-input px-3.5 py-2.5"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="negStock"
                checked={formData.enableNegativeStock}
                onChange={(e) => setFormData({ ...formData, enableNegativeStock: e.target.checked })}
                className="w-4 h-4 text-cyan-500 rounded border-blue-900/80 bg-[#071120] focus:ring-cyan-500"
              />
              <label htmlFor="negStock" className="text-xs text-slate-300 font-medium cursor-pointer">
                Allow sales even when stock is zero (Negative Inventory Mode)
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 theme-btn-primary rounded-xl"
          >
            <Save className="w-4 h-4" />
            Save Preferences
          </button>
        </div>
      </form>

      {/* Data Management & Backup */}
      <div className="theme-card p-5 sm:p-6 theme-card-hover space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-blue-900/60 pb-3">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Data Storage & Portability</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Your business data is stored with instant offline-first persistence. You can download a complete JSON archive of all transactions, customers, and inventory or restore an existing backup.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-2 px-4 py-2.5 theme-btn-primary rounded-xl"
          >
            <Download className="w-3.5 h-3.5" />
            Download Complete Backup (JSON)
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2.5 theme-btn-secondary rounded-xl cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Restore Backup
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => {
              if (confirm('Reset to standard demo dataset? Current local modifications will be replaced.')) {
                resetToDemoData();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 ml-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Sample Data
          </button>
        </div>
      </div>
    </div>
  );
};
