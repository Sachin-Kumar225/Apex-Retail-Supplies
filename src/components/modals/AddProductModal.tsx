import React, { useState, useEffect } from 'react';
import { X, PackagePlus, AlertCircle } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Product } from '../../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, settings, products } = useBusiness();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stockQuantity, setStockQuantity] = useState<number | ''>('');
  const [minStockLevel, setMinStockLevel] = useState<number | ''>(5);
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category);
      setPurchasePrice(productToEdit.purchasePrice);
      setSellingPrice(productToEdit.sellingPrice);
      setStockQuantity(productToEdit.stockQuantity);
      setMinStockLevel(productToEdit.minStockLevel);
      setSupplier(productToEdit.supplier);
      setDescription(productToEdit.description);
    } else {
      setName('');
      setSku(`SKU-${Date.now().toString().slice(-5)}`);
      setCategory('Electronics');
      setPurchasePrice('');
      setSellingPrice('');
      setStockQuantity('');
      setMinStockLevel(5);
      setSupplier('');
      setDescription('');
    }
    setErrorMsg('');
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    if (sellingPrice === '' || Number(sellingPrice) < 0) {
      setErrorMsg('Please enter a valid non-negative selling price.');
      return;
    }

    if (stockQuantity === '' || Number(stockQuantity) < 0) {
      setErrorMsg('Please enter a valid stock quantity.');
      return;
    }

    // Check duplicate SKU
    const existingSku = products.find(
      (p) => p.sku.toLowerCase() === sku.trim().toLowerCase() && p.id !== productToEdit?.id
    );
    if (existingSku) {
      setErrorMsg(`SKU "${sku}" is already in use by another product.`);
      return;
    }

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim(),
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice),
        stockQuantity: Number(stockQuantity),
        minStockLevel: Number(minStockLevel) || 0,
        supplier: supplier.trim(),
        description: description.trim(),
      });
    } else {
      addProduct({
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim(),
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice),
        stockQuantity: Number(stockQuantity),
        minStockLevel: Number(minStockLevel) || 0,
        supplier: supplier.trim(),
        description: description.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0a1526] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden border border-blue-900/80 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/60 bg-[#071120]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.2)]">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {productToEdit ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-slate-400">Configure catalog details, pricing & stock limits</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Product Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wireless Ergonomic Mouse"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs theme-input px-3.5 py-2.5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SKU / Barcode <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full text-xs theme-input px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs theme-input px-3 py-2"
              />
              <datalist id="category-suggestions">
                <option value="Electronics" />
                <option value="Accessories" />
                <option value="Home & Kitchen" />
                <option value="Apparel" />
                <option value="Stationery" />
                <option value="Groceries" />
                <option value="Hardware" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Purchase Cost ({settings.currency})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full text-xs theme-input px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Selling Price ({settings.currency}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full text-xs theme-input px-3 py-2 font-mono font-bold text-cyan-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Initial Stock Qty <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full text-xs theme-input px-3 py-2 font-mono font-bold text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="0"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full text-xs theme-input px-3 py-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Wholesale Distributing"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full text-xs theme-input px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Key specifications, warranty period, location in store..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs theme-input px-3 py-2 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold theme-btn-secondary rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold theme-btn-primary rounded-xl"
            >
              {productToEdit ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
