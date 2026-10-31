import React, { useState } from 'react';
import {
  FileText,
  Download,
  PlusCircle,
  Eye
} from 'lucide-react';
import { Invoice } from '../../types';

interface InvoiceListProps {
  invoices: Invoice[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onNewInvoice: () => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  searchQuery,
  onSearchChange,
  onSelectInvoice,
  onNewInvoice
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED'>('ALL');
  const [supplyFilter, setSupplyFilter] = useState<'ALL' | 'INTRA_STATE' | 'INTER_STATE'>('ALL');

  const inr = (n: number) => '₹' + Number(Math.round(n)).toLocaleString('en-IN');

  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'CANCELLED') {
        if (inv.status !== 'CANCELLED') return false;
      } else {
        if (inv.status === 'CANCELLED' || inv.paymentStatus !== statusFilter) return false;
      }
    }

    if (supplyFilter !== 'ALL' && inv.supplyType !== supplyFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchCust = inv.customerName.toLowerCase().includes(q);
      const matchGstin = (inv.customerGstin || '').toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchGstin) return false;
    }

    return true;
  });

  const exportCSV = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Customer Name',
      'Customer GSTIN',
      'Supply Type',
      'Place of Supply',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Total Tax',
      'Grand Total',
      'Amount Paid',
      'Amount Due',
      'Payment Status',
      'Document Status'
    ];

    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.date,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      inv.customerGstin || 'Unregistered',
      inv.supplyType,
      `"${inv.placeOfSupply}"`,
      inv.taxableAmount.toFixed(2),
      inv.totalCgst.toFixed(2),
      inv.totalSgst.toFixed(2),
      inv.totalIgst.toFixed(2),
      inv.totalTax.toFixed(2),
      inv.grandTotal.toFixed(2),
      inv.amountPaid.toFixed(2),
      inv.amountDue.toFixed(2),
      inv.paymentStatus,
      inv.status
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Register_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusPills: Record<string, { bg: string; fg: string }> = {
    PAID: { bg: '#E7F0EA', fg: '#1B5E3B' },
    UNPAID: { bg: '#FBEEE3', fg: '#A14A0B' },
    PARTIAL: { bg: '#FDF4DC', fg: '#7A5300' },
    CANCELLED: { bg: '#EEEEEA', fg: '#4A4D53' }
  };

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in no-print">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] p-4 rounded-[10px] border border-[#E4E3DE]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="inline-flex bg-[#EAEAE5] p-[3px] rounded-lg text-[13px] font-medium gap-0.5">
            {(['ALL', 'PAID', 'PARTIAL', 'UNPAID', 'CANCELLED'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-[#FFFFFF] text-[#17181A] shadow-xs font-semibold'
                    : 'text-[#4A4D53] hover:text-[#17181A]'
                }`}
              >
                {s === 'ALL'
                  ? 'All bills'
                  : s === 'PAID'
                  ? 'Paid'
                  : s === 'PARTIAL'
                  ? 'Part paid'
                  : s === 'UNPAID'
                  ? 'Unpaid'
                  : 'Cancelled'}
              </button>
            ))}
          </div>

          <select
            value={supplyFilter}
            onChange={e => setSupplyFilter(e.target.value as any)}
            className="text-[12px] bg-[#FFFFFF] border border-[#DAD9D3] rounded-md px-2.5 py-1.5 text-[#17181A] outline-none"
          >
            <option value="ALL">All Supply (Intra &amp; Inter)</option>
            <option value="INTRA_STATE">Intra-State (CGST+SGST)</option>
            <option value="INTER_STATE">Inter-State (IGST)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#DAD9D3] hover:bg-[#F6F6F3] text-[#17181A] text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#5E6168]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onNewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B5E3B] hover:bg-[#123F28] text-white text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New bill (Alt+N)</span>
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#FFFFFF] rounded-[10px] border border-[#E4E3DE] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[#5E6168] text-[12px]">
                <th className="font-medium p-[8px_20px] border-t border-b border-[#E4E3DE]">
                  Invoice
                </th>
                <th className="font-medium p-[8px_12px] border-t border-b border-[#E4E3DE]">
                  Customer
                </th>
                <th className="font-medium p-[8px_12px] border-t border-b border-[#E4E3DE]">
                  Supply
                </th>
                <th className="font-medium p-[8px_12px] border-t border-b border-[#E4E3DE] text-right">
                  Taxable
                </th>
                <th className="font-medium p-[8px_12px] border-t border-b border-[#E4E3DE] text-right">
                  GST
                </th>
                <th className="font-medium p-[8px_12px] border-t border-b border-[#E4E3DE] text-right">
                  Total
                </th>
                <th className="font-medium p-[8px_12px] border-t border-b border-[#E4E3DE]">
                  Status
                </th>
                <th className="font-medium p-[8px_20px_8px_12px] border-t border-b border-[#E4E3DE] text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#5E6168]">
                    <FileText className="w-8 h-8 mx-auto text-[#DAD9D3] mb-2" />
                    No invoices found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const isCancelled = inv.status === 'CANCELLED';
                  const pillKey = isCancelled
                    ? 'CANCELLED'
                    : inv.paymentStatus === 'PAID'
                    ? 'PAID'
                    : inv.paymentStatus === 'PARTIAL'
                    ? 'PARTIAL'
                    : 'UNPAID';
                  const pill = statusPills[pillKey] || statusPills.UNPAID;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="border-b border-[#EFEEEA] hover:bg-[#FDFDFD] cursor-pointer transition-colors"
                      style={{ color: isCancelled ? '#6B6E74' : '#17181A' }}
                    >
                      <td className="p-[11px_20px] whitespace-nowrap">
                        <span
                          className={`font-mono text-[12px] text-[#1B5E3B] ${
                            isCancelled ? 'line-through text-[#6B6E74]' : ''
                          }`}
                        >
                          {inv.invoiceNumber}
                        </span>
                        <div className="text-[12px] text-[#5E6168]">{inv.date}</div>
                      </td>

                      <td className="p-[11px_12px]">
                        <div className="font-medium text-[#17181A]">{inv.customerName}</div>
                        <div className="font-mono text-[11px] text-[#5E6168]">
                          {inv.customerGstin || (inv.isB2B ? 'B2B' : 'B2C')}
                        </div>
                      </td>

                      <td className="p-[11px_12px] whitespace-nowrap">
                        <div>
                          {inv.supplyType === 'INTER_STATE'
                            ? 'Inter-state · IGST'
                            : 'Intra-state · C+SGST'}
                        </div>
                        <div className="text-[12px] text-[#5E6168]">
                          POS {inv.placeOfSupply.split('-')[1]?.trim() || 'Maharashtra'}
                        </div>
                      </td>

                      <td className="p-[11px_12px] text-right whitespace-nowrap font-mono">
                        {inr(inv.taxableAmount)}
                      </td>

                      <td className="p-[11px_12px] text-right whitespace-nowrap font-mono">
                        {inr(inv.totalTax)}
                      </td>

                      <td className="p-[11px_12px] text-right whitespace-nowrap font-mono font-medium text-[#17181A]">
                        {inr(inv.grandTotal)}
                      </td>

                      <td className="p-[11px_12px] whitespace-nowrap">
                        <span
                          className="inline-block text-[12px] font-medium px-2 py-0.5 rounded-[10px]"
                          style={{ backgroundColor: pill.bg, color: pill.fg }}
                        >
                          {isCancelled
                            ? 'Cancelled'
                            : inv.paymentStatus === 'PAID'
                            ? 'Paid'
                            : inv.paymentStatus === 'PARTIAL'
                            ? 'Part paid'
                            : 'Unpaid'}
                        </span>
                        <div className="text-[11px] text-[#5E6168] mt-0.5">
                          {isCancelled
                            ? inv.cancellationReason || 'Cancelled'
                            : inv.paymentStatus === 'PARTIAL'
                            ? `${inr(inv.amountPaid)} received`
                            : inv.paymentStatus === 'UNPAID'
                            ? `Credit · due ${inv.dueDate || '30 days'}`
                            : inv.payments[0]?.mode || 'Paid'}
                        </div>
                      </td>

                      <td className="p-[11px_20px_11px_12px] text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onSelectInvoice(inv);
                          }}
                          className="p-1.5 text-[#5E6168] hover:text-[#1B5E3B] hover:bg-[#E7F0EA] rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-[#F6F6F3] border-t border-[#E4E3DE] flex items-center justify-between text-[12px] text-[#5E6168]">
          <span>Showing {filteredInvoices.length} of {invoices.length} records</span>
          <span>Click any bill row to open its printable tax view</span>
        </div>
      </div>
    </div>
  );
};
