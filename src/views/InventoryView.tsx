import React, { useState } from 'react';
import {
  Package,
  PackagePlus,
  ArrowUpDown,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Edit2,
  Trash2,
  History,
  Download,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Product } from '../types';
import { formatCurrency, formatDateTime, exportToCSV } from '../utils/formatters';

interface InventoryViewProps {
  onOpenAddProduct: () => void;
  onEditProduct: (p: Product) => void;
  onOpenAdjustStock: (p?: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenAddProduct,
  onEditProduct,
  onOpenAdjustStock,
}) => {
  const { products, stockMovements: inventoryLogs, deleteProduct, settings } = useBusiness();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [activeTab, setActiveTab] = useState<'catalog' | 'logs'>('catalog');

  // Unique categories
  const categories: string[] = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = categoryFilter === 'ALL' || prod.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'OUT_OF_STOCK') {
      matchesStatus = prod.stockQuantity <= 0;
    } else if (statusFilter === 'LOW_STOCK') {
      matchesStatus = prod.stockQuantity > 0 && prod.stockQuantity <= prod.minStockLevel;
    } else if (statusFilter === 'IN_STOCK') {
      matchesStatus = prod.stockQuantity > prod.minStockLevel;
    }

    return matchesSearch && matchesCat && matchesStatus;
  });

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.stockQuantity * p.purchasePrice,
    0
  );
  const totalRetailValue = products.reduce(
    (sum, p) => sum + p.stockQuantity * p.sellingPrice,
    0
  );
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockLevel).length;

  const handleExportCSV = () => {
    const rows = filteredProducts.map((p) => ({
      Name: p.name,
      SKU: p.sku,
      Category: p.category,
      StockQuantity: p.stockQuantity,
      MinThreshold: p.minStockLevel,
      CostPrice: p.purchasePrice,
      SellingPrice: p.sellingPrice,
      TotalCostVal: p.stockQuantity * p.purchasePrice,
      Supplier: p.supplier || '',
    }));
    exportToCSV(`inventory_catalog_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 theme-card p-5 sm:p-6 theme-card-hover">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Inventory & Products
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-cyan-950/70 text-cyan-300 rounded-full border border-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.15)]">
              {products.length} SKUs
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track real-time stock levels, purchase prices, valuations, and stock adjustments
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold theme-btn-secondary rounded-xl"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </button>
          <button
            onClick={() => onOpenAdjustStock()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold theme-btn-secondary rounded-xl"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            Adjust Stock
          </button>
          <button
            onClick={onOpenAddProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs theme-btn-primary rounded-xl"
          >
            <PackagePlus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="theme-card p-4 theme-card-hover">
          <div className="text-[11px] font-semibold text-slate-400">Total Inventory Cost</div>
          <div className="text-xl font-black text-white mt-1 font-mono tracking-tight">
            {formatCurrency(totalInventoryValue, settings.currency)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Asset value at purchase cost</div>
        </div>

        <div className="theme-card p-4 border-emerald-500/30 hover:border-emerald-400/50 theme-card-hover">
          <div className="text-[11px] font-semibold text-emerald-400">Estimated Retail Value</div>
          <div className="text-xl font-black text-emerald-400 mt-1 font-mono tracking-tight">
            {formatCurrency(totalRetailValue, settings.currency)}
          </div>
          <div className="text-xs text-emerald-500 mt-1">Potential gross sales value</div>
        </div>

        <div className="theme-card p-4 theme-card-hover">
          <div className="text-[11px] font-semibold text-slate-400">Total Units in Stock</div>
          <div className="text-xl font-black text-white mt-1 font-mono tracking-tight">
            {products.reduce((s, p) => s + p.stockQuantity, 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Physical units in warehouse</div>
        </div>

        <div
          className={`theme-card p-4 theme-card-hover ${
            lowStockCount > 0 ? 'border-rose-500/40 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.12)]' : ''
          }`}
        >
          <div className="text-[11px] font-semibold text-rose-400 flex items-center justify-between">
            <span>Low / Zero Stock Alerts</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 mt-1 font-mono tracking-tight">{lowStockCount} items</div>
          <div className="text-xs text-rose-400/80 mt-1">Below minimum threshold</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-blue-900/50">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'catalog'
              ? 'border-cyan-400 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Product Catalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-cyan-400 text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Stock Movement History ({inventoryLogs.length})
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Search & Filters */}
          <div className="theme-card p-4 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-cyan-400/70 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search products by title, SKU, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs theme-input pl-9 pr-4 py-2.5"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs rounded-xl border border-blue-900/60 bg-[#0c192c] px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c === 'ALL' ? 'All Categories' : c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs rounded-xl border border-blue-900/60 bg-[#0c192c] px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Stock Status</option>
                <option value="IN_STOCK" className="bg-slate-900 text-white">In Stock (Safe)</option>
                <option value="LOW_STOCK" className="bg-slate-900 text-white">Low Stock (Alert)</option>
                <option value="OUT_OF_STOCK" className="bg-slate-900 text-white">Out of Stock (0)</option>
              </select>
            </div>
          </div>

          {/* Product Table */}
          <div className="theme-card overflow-hidden">
            {filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No products match the selected criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-blue-900/60 bg-[#071120] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-3.5 px-4">Product</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4 text-right">Cost Price</th>
                      <th className="py-3.5 px-4 text-right">Selling Price</th>
                      <th className="py-3.5 px-4 text-center">Stock Level</th>
                      <th className="py-3.5 px-4 text-right">Total Sold</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-950/70">
                    {filteredProducts.map((prod) => {
                      const isLow = prod.stockQuantity <= prod.minStockLevel;
                      const isOut = prod.stockQuantity <= 0;

                      return (
                        <tr key={prod.id} className="hover:bg-blue-950/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{prod.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {prod.sku} {prod.supplier ? `• ${prod.supplier}` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-cyan-300 border border-cyan-500/20 font-medium text-[11px]">
                              {prod.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                            {formatCurrency(prod.purchasePrice, settings.currency)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                            {formatCurrency(prod.sellingPrice, settings.currency)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                isOut
                                  ? 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
                                  : isLow
                                  ? 'bg-amber-950/70 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                                  : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(52,211,153,0.15)]'
                              }`}
                            >
                              {prod.stockQuantity} units
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                            {prod.totalSold || 0}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onOpenAdjustStock(prod)}
                                title="Quick Adjust Stock"
                                className="p-1.5 text-cyan-400 hover:text-cyan-200 hover:bg-blue-950/60 rounded-lg transition-colors"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onEditProduct(prod)}
                                title="Edit Product"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-blue-950/60 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${prod.name}?`)) {
                                    deleteProduct(prod.id);
                                  }
                                }}
                                title="Delete Product"
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Inventory Logs Table */
        <div className="theme-card overflow-hidden">
          {inventoryLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No stock movement logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-blue-900/60 bg-[#071120] text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4 text-center">Change</th>
                    <th className="py-3.5 px-4 text-center">Previous → New</th>
                    <th className="py-3.5 px-4">Reason / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-950/70">
                  {inventoryLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-950/30 transition-colors">
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {formatDateTime(log.date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        {log.productName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                            log.type === 'in'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                              : log.type === 'out'
                              ? 'bg-rose-950/70 text-rose-300 border-rose-500/40'
                              : 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40'
                          }`}
                        >
                          {log.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold font-mono text-white">
                        {log.type === 'in' ? `+${log.quantity}` : log.type === 'out' ? `-${log.quantity}` : log.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {log.previousStock} → <strong className="text-white">{log.newStock}</strong>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
