import React, { useState } from 'react';
import {
  Package,
  PlusCircle,
  AlertTriangle,
  Edit2,
  Sliders
} from 'lucide-react';
import { Item } from '../../types';
import { ItemModal } from './ItemModal';

interface ItemListProps {
  items: Item[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSaveItem: (item: Item) => void;
  onAdjustStock: (itemId: string, delta: number, reason: string) => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  searchQuery,
  onSaveItem,
  onAdjustStock
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'GOODS' | 'SERVICE' | 'LOW_STOCK'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [stockAdjustItem, setStockAdjustItem] = useState<Item | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Stock shipment arrival');

  const inr = (n: number) => '₹' + Number(Math.round(n)).toLocaleString('en-IN');

  const filteredItems = items.filter(item => {
    if (filterType === 'GOODS' && item.type !== 'GOODS') return false;
    if (filterType === 'SERVICE' && item.type !== 'SERVICE') return false;
    if (filterType === 'LOW_STOCK') {
      if (item.type !== 'GOODS' || item.currentStock > item.lowStockThreshold) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchHsn = (item.hsnSac || '').toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchHsn) return false;
    }

    return true;
  });

  const lowStockCount = items.filter(
    i => i.type === 'GOODS' && i.currentStock <= i.lowStockThreshold
  ).length;

  const handleOpenNew = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const submitStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustItem || adjustDelta === 0) return;
    onAdjustStock(stockAdjustItem.id, adjustDelta, adjustReason);
    setStockAdjustItem(null);
  };

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in no-print">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] p-4 rounded-[10px] border border-[#E4E3DE]">
        {/* Type Filter Pills */}
        <div className="inline-flex bg-[#EAEAE5] p-[3px] rounded-lg text-[13px] font-medium gap-0.5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-[#FFFFFF] text-[#17181A] shadow-xs font-semibold'
                : 'text-[#4A4D53] hover:text-[#17181A]'
            }`}
          >
            All Items ({items.length})
          </button>
          <button
            onClick={() => setFilterType('GOODS')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterType === 'GOODS'
                ? 'bg-[#FFFFFF] text-[#17181A] shadow-xs font-semibold'
                : 'text-[#4A4D53] hover:text-[#17181A]'
            }`}
          >
            Goods
          </button>
          <button
            onClick={() => setFilterType('SERVICE')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterType === 'SERVICE'
                ? 'bg-[#FFFFFF] text-[#17181A] shadow-xs font-semibold'
                : 'text-[#4A4D53] hover:text-[#17181A]'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setFilterType('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'LOW_STOCK'
                ? 'bg-[#FBEEE3] text-[#A14A0B] shadow-xs font-semibold'
                : 'text-[#A14A0B] hover:text-[#7A2E05]'
            }`}
          >
            <span>Low stock</span>
            {lowStockCount > 0 && (
              <span className="font-mono text-[11px] font-bold">({lowStockCount})</span>
            )}
          </button>
        </div>

        {/* Add Item Button */}
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B5E3B] hover:bg-[#123F28] text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New catalog item</span>
        </button>
      </div>

      {/* Items Table */}
      <div className="bg-[#FFFFFF] rounded-[10px] border border-[#E4E3DE] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F6F6F3] text-[#5E6168] text-[11px] font-semibold uppercase tracking-[0.04em] border-b border-[#E4E3DE]">
              <tr>
                <th className="py-2.5 px-4">Item &amp; SKU</th>
                <th className="py-2.5 px-4">HSN / SAC</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-center">GST Slab</th>
                <th className="py-2.5 px-4 text-right">Selling Price</th>
                <th className="py-2.5 px-4 text-center">Stock Level</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEEEA]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5E6168]">
                    <Package className="w-8 h-8 mx-auto text-[#DAD9D3] mb-2" />
                    No items found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isLow =
                    item.type === 'GOODS' && item.currentStock <= item.lowStockThreshold;

                  return (
                    <tr key={item.id} className="hover:bg-[#FDFDFD] transition-colors">
                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#17181A]">{item.name}</div>
                        <div className="text-[11px] text-[#5E6168] font-mono mt-0.5">
                          SKU: {item.sku}
                        </div>
                      </td>

                      {/* HSN */}
                      <td className="py-3 px-4 font-mono text-[#5E6168] text-[12px]">
                        {item.hsnSac}
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="text-[12px] text-[#5E6168]">
                          {item.type === 'GOODS' ? 'Goods' : 'Service'}
                        </span>
                      </td>

                      {/* GST */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-[#17181A]">
                        {item.gstRate}%
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right font-mono font-medium text-[#17181A]">
                        {inr(item.sellingPrice)}
                        <span className="text-[11px] font-sans text-[#5E6168] block">
                          per {item.unit}
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-4 text-center">
                        {item.type === 'GOODS' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`font-mono font-semibold px-2 py-0.5 rounded-[10px] text-[12px] ${
                                isLow
                                  ? 'bg-[#FBEEE3] text-[#A14A0B]'
                                  : 'bg-[#E7F0EA] text-[#1B5E3B]'
                              }`}
                            >
                              {item.currentStock} {item.unit}
                            </span>
                            {isLow && (
                              <span title={`Threshold: ${item.lowStockThreshold} ${item.unit}`}>
                                <AlertTriangle className="w-3.5 h-3.5 text-[#A14A0B]" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#5E6168] text-[12px]">Service</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          {item.type === 'GOODS' && (
                            <button
                              onClick={() => {
                                setStockAdjustItem(item);
                                setAdjustDelta(10);
                              }}
                              className="p-1.5 text-[#5E6168] hover:text-[#1B5E3B] hover:bg-[#E7F0EA] rounded transition-colors cursor-pointer"
                              title="Adjust Stock"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-[#5E6168] hover:text-[#17181A] hover:bg-[#EEEEEA] rounded transition-colors cursor-pointer"
                            title="Edit Item Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F6F6F3] border-t border-[#E4E3DE] flex items-center justify-between text-[12px] text-[#5E6168]">
          <span>Showing {filteredItems.length} of {items.length} items</span>
          <span>Automatic stock decrement on bill issue</span>
        </div>
      </div>

      {/* Item Modal */}
      <ItemModal
        isOpen={modalOpen}
        item={editingItem}
        onClose={() => setModalOpen(false)}
        onSave={onSaveItem}
      />

      {/* Stock Adjustment Modal */}
      {stockAdjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[10px] border border-[#DAD9D3] w-full max-w-sm p-5 flex flex-col gap-3 shadow-xl">
            <div className="border-b border-[#E4E3DE] pb-2">
              <h3 className="font-semibold text-[#17181A] text-[14px]">
                Adjust Stock: {stockAdjustItem.name}
              </h3>
              <div className="text-[12px] text-[#5E6168]">
                Current stock: {stockAdjustItem.currentStock} {stockAdjustItem.unit}
              </div>
            </div>

            <form onSubmit={submitStockAdjustment} className="flex flex-col gap-3 text-[13px]">
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Quantity adjustment (+/-)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    required
                    value={adjustDelta}
                    onChange={e => setAdjustDelta(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-[#DAD9D3] rounded font-mono font-semibold text-[15px]"
                  />
                  <span className="text-[#5E6168] font-medium">{stockAdjustItem.unit}</span>
                </div>
                <div className="text-[11px] text-[#5E6168] mt-0.5">
                  Resulting stock: {Math.max(0, stockAdjustItem.currentStock + adjustDelta)} {stockAdjustItem.unit}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Reason for adjustment</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full p-2 border border-[#DAD9D3] rounded text-[13px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E3DE]">
                <button
                  type="button"
                  onClick={() => setStockAdjustItem(null)}
                  className="px-3 py-1.5 border border-[#DAD9D3] rounded text-[#5E6168]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1B5E3B] text-white rounded font-medium"
                >
                  Save adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
