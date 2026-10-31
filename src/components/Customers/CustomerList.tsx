import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  Edit2
} from 'lucide-react';
import { Customer } from '../../types';
import { CustomerModal } from './CustomerModal';

interface CustomerListProps {
  customers: Customer[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSaveCustomer: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  searchQuery,
  onSaveCustomer
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'B2B' | 'B2C' | 'OUTSTANDING'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const inr = (n: number) => '₹' + Number(Math.round(n)).toLocaleString('en-IN');

  const filteredCustomers = customers.filter(c => {
    if (filterType === 'B2B' && !c.isB2B) return false;
    if (filterType === 'B2C' && c.isB2B) return false;
    if (filterType === 'OUTSTANDING' && (c.currentBalance || 0) <= 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchGstin = (c.gstin || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      if (!matchName && !matchGstin && !matchPhone) return false;
    }

    return true;
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in no-print">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] p-4 rounded-[10px] border border-[#E4E3DE]">
        <div className="inline-flex bg-[#EAEAE5] p-[3px] rounded-lg text-[13px] font-medium gap-0.5">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-[#FFFFFF] text-[#17181A] shadow-xs font-semibold'
                : 'text-[#4A4D53] hover:text-[#17181A]'
            }`}
          >
            All Customers ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('B2B')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterType === 'B2B'
                ? 'bg-[#FFFFFF] text-[#17181A] shadow-xs font-semibold'
                : 'text-[#4A4D53] hover:text-[#17181A]'
            }`}
          >
            B2B (GST registered)
          </button>
          <button
            onClick={() => setFilterType('B2C')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterType === 'B2C'
                ? 'bg-[#FFFFFF] text-[#17181A] shadow-xs font-semibold'
                : 'text-[#4A4D53] hover:text-[#17181A]'
            }`}
          >
            B2C Retail
          </button>
          <button
            onClick={() => setFilterType('OUTSTANDING')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              filterType === 'OUTSTANDING'
                ? 'bg-[#FBEEE3] text-[#A14A0B] shadow-xs font-semibold'
                : 'text-[#A14A0B] hover:text-[#7A2E05]'
            }`}
          >
            With due balance
          </button>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B5E3B] hover:bg-[#123F28] text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New customer</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] rounded-[10px] border border-[#E4E3DE] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F6F6F3] text-[#5E6168] text-[11px] font-semibold uppercase tracking-[0.04em] border-b border-[#E4E3DE]">
              <tr>
                <th className="py-2.5 px-4">Customer Name</th>
                <th className="py-2.5 px-4">GSTIN &amp; State</th>
                <th className="py-2.5 px-4">Contact</th>
                <th className="py-2.5 px-4">Billing Address</th>
                <th className="py-2.5 px-4 text-right">Outstanding (₹)</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEEEA]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#5E6168]">
                    <Users className="w-8 h-8 mx-auto text-[#DAD9D3] mb-2" />
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-[#FDFDFD] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#17181A]">{c.name}</div>
                      <div className="text-[11px] text-[#5E6168]">
                        {c.isB2B ? 'Registered B2B' : 'Consumer B2C'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-[#17181A] text-[12px]">
                        {c.gstin ? c.gstin : <span className="text-[#5E6168]">Unregistered</span>}
                      </div>
                      <div className="text-[11px] text-[#5E6168]">
                        {c.stateCode} · {c.stateName}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#5E6168]">
                      <div>{c.phone}</div>
                      {c.email && <div className="text-[11px]">{c.email}</div>}
                    </td>

                    <td className="py-3 px-4 text-[#5E6168] max-w-xs truncate">
                      {c.address}, {c.city}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {c.currentBalance > 0 ? (
                        <span className="font-mono font-semibold text-[#A14A0B]">
                          {inr(c.currentBalance)}
                        </span>
                      ) : (
                        <span className="font-mono text-[#5E6168]">₹0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-[#5E6168] hover:text-[#17181A] hover:bg-[#EEEEEA] rounded transition-colors cursor-pointer"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-[#F6F6F3] border-t border-[#E4E3DE] flex items-center justify-between text-[12px] text-[#5E6168]">
          <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
          <span className="font-medium text-[#17181A]">
            Total Outstanding: <span className="font-mono text-[#A14A0B]">{inr(totalOutstanding)}</span>
          </span>
        </div>
      </div>

      <CustomerModal
        isOpen={modalOpen}
        customer={editingCustomer}
        onClose={() => setModalOpen(false)}
        onSave={onSaveCustomer}
      />
    </div>
  );
};
