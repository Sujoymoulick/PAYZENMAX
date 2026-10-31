import React, { useState, useEffect } from 'react';
import { X, Package, ShieldCheck } from 'lucide-react';
import { Item, ItemType } from '../../types';
import { getCurrentDateISO } from '../../core/formatters';

interface ItemModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  onSave: (item: Item) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [type, setType] = useState<ItemType>('GOODS');
  const [hsnSac, setHsnSac] = useState('8443');
  const [unit, setUnit] = useState('PCS');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(18);
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSku(item.sku);
      setType(item.type);
      setHsnSac(item.hsnSac);
      setUnit(item.unit);
      setSellingPrice(item.sellingPrice);
      setPurchasePrice(item.purchasePrice || 0);
      setGstRate(item.gstRate);
      setCurrentStock(item.currentStock);
      setLowStockThreshold(item.lowStockThreshold);
      setDescription(item.description || '');
    } else {
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setType('GOODS');
      setHsnSac('8443');
      setUnit('PCS');
      setSellingPrice(0);
      setPurchasePrice(0);
      setGstRate(18);
      setCurrentStock(10);
      setLowStockThreshold(5);
      setDescription('');
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: Item = {
      id: item?.id || `item_${Date.now()}`,
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now()}`,
      type,
      hsnSac: hsnSac.trim() || (type === 'SERVICE' ? '9987' : '8443'),
      unit,
      sellingPrice: Number(sellingPrice) || 0,
      purchasePrice: Number(purchasePrice) || undefined,
      gstRate: Number(gstRate) || 0,
      currentStock: type === 'SERVICE' ? 999 : Number(currentStock) || 0,
      lowStockThreshold: type === 'SERVICE' ? 0 : Number(lowStockThreshold) || 0,
      description: description.trim(),
      createdAt: item?.createdAt || getCurrentDateISO(),
      updatedAt: getCurrentDateISO()
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 font-display text-base">
              {item ? 'Edit Catalog Item' : 'New Catalog Item'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Item Type & SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as ItemType)}
                className="w-full p-2 border border-slate-300 rounded-lg mt-1 font-semibold"
              >
                <option value="GOODS">Goods (Physical Product)</option>
                <option value="SERVICE">Service</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">SKU / Item Code</label>
              <input
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full font-mono p-2 border border-slate-300 rounded-lg mt-1"
                placeholder="e.g. PRN-80-POS"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="font-bold text-slate-700">Item Name / Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg mt-1 text-slate-900 font-medium"
              placeholder="e.g. Thermal Receipt Printer 80mm"
            />
          </div>

          {/* HSN/SAC, Unit and GST Rate */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700">
                {type === 'GOODS' ? 'HSN Code' : 'SAC Code'}
              </label>
              <input
                type="text"
                value={hsnSac}
                onChange={e => setHsnSac(e.target.value)}
                className="w-full font-mono p-2 border border-slate-300 rounded-lg mt-1"
                placeholder="4 or 6 digits"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Unit of Measure</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg mt-1 font-semibold"
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="NOS">NOS (Numbers)</option>
                <option value="BOX">BOX</option>
                <option value="SET">SET</option>
                <option value="KGS">KGS</option>
                <option value="MTR">MTR (Meters)</option>
                <option value="HRS">HRS (Hours)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700">GST Slab</label>
              <select
                value={gstRate}
                onChange={e => setGstRate(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg mt-1 font-mono font-bold"
              >
                <option value="0">0% (Nil)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% Standard</option>
                <option value="28">28% High</option>
              </select>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Selling Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={sellingPrice}
                onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full font-mono font-bold p-2 border border-slate-300 rounded-lg mt-1 text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Purchase / Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={purchasePrice}
                onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full font-mono p-2 border border-slate-300 rounded-lg mt-1 text-slate-600"
              />
            </div>
          </div>

          {/* Stock Tracking (only for GOODS) */}
          {type === 'GOODS' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <label className="font-bold text-slate-700">Stock on Hand</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={currentStock}
                  onChange={e => setCurrentStock(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono font-bold p-2 border border-slate-300 rounded-lg mt-1 bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono p-2 border border-slate-300 rounded-lg mt-1 bg-white"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="font-bold text-slate-700">Description / Technical Notes</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg mt-1"
              placeholder="e.g. Dimensions, specifications, or warranty details..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
            >
              {item ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
