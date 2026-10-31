import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react';
import { BusinessProfile, Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../core/formatters';

interface ReportsViewProps {
  invoices: Invoice[];
  business: BusinessProfile;
  onSelectInvoice: (invoice: Invoice) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  business,
  onSelectInvoice
}) => {
  const [activeTab, setActiveTab] = useState<'GSTR1' | 'SALES_REGISTER' | 'RECEIVABLES'>('GSTR1');

  const inr = (n: number) => '₹' + Number(Math.round(n)).toLocaleString('en-IN');

  const validInvoices = invoices.filter(inv => inv.status !== 'CANCELLED');
  const b2bInvoices = validInvoices.filter(inv => inv.isB2B);
  const b2cInvoices = validInvoices.filter(inv => !inv.isB2B);

  const hsnMap: Record<
    string,
    {
      hsnSac: string;
      qty: number;
      unit: string;
      taxable: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      totalValue: number;
    }
  > = {};

  for (const inv of validInvoices) {
    for (const line of inv.lines) {
      const code = line.hsnSac || 'OTHER';
      if (!hsnMap[code]) {
        hsnMap[code] = {
          hsnSac: code,
          qty: 0,
          unit: line.unit,
          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalTax: 0,
          totalValue: 0
        };
      }
      hsnMap[code].qty += line.quantity;
      hsnMap[code].taxable += line.taxableValue;
      hsnMap[code].cgst += line.cgstAmount;
      hsnMap[code].sgst += line.sgstAmount;
      hsnMap[code].igst += line.igstAmount;
      hsnMap[code].totalTax += line.cgstAmount + line.sgstAmount + line.igstAmount;
      hsnMap[code].totalValue += line.total;
    }
  }

  const hsnSummaryList = Object.values(hsnMap);
  const unpaidInvoices = validInvoices.filter(inv => inv.amountDue > 0);
  const totalReceivables = unpaidInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

  const exportGSTR1JSON = () => {
    const payload = {
      gstin: business.gstin,
      fp: '102026',
      b2b: b2bInvoices.map(inv => ({
        ctin: inv.customerGstin,
        inv: [
          {
            inum: inv.invoiceNumber,
            idt: inv.date,
            val: inv.grandTotal,
            pos: inv.customerStateCode,
            rchrg: 'N',
            inv_typ: 'R',
            itms: inv.lines.map(line => ({
              num: 1,
              itm_det: {
                rt: line.gstRate,
                txval: line.taxableValue,
                iamt: line.igstAmount,
                camt: line.cgstAmount,
                samt: line.sgstAmount,
                csamt: 0
              }
            }))
          }
        ]
      })),
      b2cs: b2cInvoices.map(inv => ({
        sply_ty: inv.supplyType === 'INTRA_STATE' ? 'INTRA' : 'INTER',
        pos: inv.customerStateCode,
        txval: inv.taxableAmount,
        camt: inv.totalCgst,
        samt: inv.totalSgst,
        iamt: inv.totalIgst
      })),
      hsn: {
        data: hsnSummaryList.map(h => ({
          hsn_sc: h.hsnSac,
          uqc: h.unit,
          qty: h.qty,
          txval: Number(h.taxable.toFixed(2)),
          iamt: Number(h.igst.toFixed(2)),
          camt: Number(h.cgst.toFixed(2)),
          samt: Number(h.sgst.toFixed(2)),
          csamt: 0
        }))
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_Export_${business.gstin}_Oct2026.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5 font-sans animate-fade-in no-print">
      {/* Top Banner */}
      <div className="bg-[#FFFFFF] p-4 rounded-[10px] border border-[#E4E3DE] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-semibold text-[#17181A]">
              GST compliance &amp; reports
            </h2>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-[10px] bg-[#E7F0EA] text-[#1B5E3B]">
              Deterministic
            </span>
          </div>
          <div className="text-[12px] text-[#5E6168] mt-0.5">
            GSTR-1 tables formatted for GST portal specifications · Calculated from issued bills
          </div>
        </div>

        <button
          onClick={exportGSTR1JSON}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1B5E3B] hover:bg-[#123F28] text-white rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export GSTR-1 JSON</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E4E3DE]">
        <button
          onClick={() => setActiveTab('GSTR1')}
          className={`pb-2.5 px-4 text-[13px] font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'GSTR1'
              ? 'border-[#1B5E3B] text-[#1B5E3B] font-semibold'
              : 'border-transparent text-[#5E6168] hover:text-[#17181A]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>GSTR-1 Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('SALES_REGISTER')}
          className={`pb-2.5 px-4 text-[13px] font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'SALES_REGISTER'
              ? 'border-[#1B5E3B] text-[#1B5E3B] font-semibold'
              : 'border-transparent text-[#5E6168] hover:text-[#17181A]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Sales register</span>
        </button>

        <button
          onClick={() => setActiveTab('RECEIVABLES')}
          className={`pb-2.5 px-4 text-[13px] font-medium border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'RECEIVABLES'
              ? 'border-[#1B5E3B] text-[#1B5E3B] font-semibold'
              : 'border-transparent text-[#5E6168] hover:text-[#17181A]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Receivables aging ({inr(totalReceivables)})</span>
        </button>
      </div>

      {/* TAB 1: GSTR-1 */}
      {activeTab === 'GSTR1' && (
        <div className="flex flex-col gap-5">
          {/* Table 4: B2B */}
          <div className="bg-[#FFFFFF] rounded-[10px] border border-[#E4E3DE] overflow-hidden">
            <div className="p-3.5 border-b border-[#E4E3DE] bg-[#F6F6F3] flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-[#17181A] text-[12px] uppercase tracking-[0.04em]">
                  4. Taxable outward supplies to registered persons (B2B)
                </h3>
                <div className="text-[11px] text-[#5E6168]">
                  {b2bInvoices.length} invoices with customer GSTIN
                </div>
              </div>
              <span className="font-mono text-[13px] font-semibold text-[#17181A]">
                Total: {inr(b2bInvoices.reduce((s, i) => s + i.grandTotal, 0))}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#FFFFFF] text-[#5E6168] text-[11px] font-semibold uppercase tracking-[0.04em] border-b border-[#E4E3DE]">
                  <tr>
                    <th className="py-2 px-3">GSTIN of Buyer</th>
                    <th className="py-2 px-3">Receiver Name</th>
                    <th className="py-2 px-3">Invoice #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">POS</th>
                    <th className="py-2 px-3 text-right">Taxable</th>
                    <th className="py-2 px-3 text-right">CGST</th>
                    <th className="py-2 px-3 text-right">SGST</th>
                    <th className="py-2 px-3 text-right">IGST</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEEEA] font-mono text-[12px]">
                  {b2bInvoices.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-[#FDFDFD] cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-semibold text-[#17181A]">{inv.customerGstin}</td>
                      <td className="py-2.5 px-3 font-sans text-[#17181A]">{inv.customerName}</td>
                      <td className="py-2.5 px-3 text-[#1B5E3B]">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-[#5E6168]">{inv.date}</td>
                      <td className="py-2.5 px-3 text-[#5E6168]">{inv.customerStateCode}</td>
                      <td className="py-2.5 px-3 text-right">{inr(inv.taxableAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-[#5E6168]">{inr(inv.totalCgst)}</td>
                      <td className="py-2.5 px-3 text-right text-[#5E6168]">{inr(inv.totalSgst)}</td>
                      <td className="py-2.5 px-3 text-right text-[#2E5AAC]">{inr(inv.totalIgst)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#17181A]">
                        {inr(inv.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 7: B2C Small */}
          <div className="bg-[#FFFFFF] rounded-[10px] border border-[#E4E3DE] overflow-hidden">
            <div className="p-3.5 border-b border-[#E4E3DE] bg-[#F6F6F3] flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-[#17181A] text-[12px] uppercase tracking-[0.04em]">
                  7. Taxable supplies to unregistered persons (B2C Small)
                </h3>
                <div className="text-[11px] text-[#5E6168]">
                  {b2cInvoices.length} retail invoices to consumers
                </div>
              </div>
              <span className="font-mono text-[13px] font-semibold text-[#17181A]">
                Total: {inr(b2cInvoices.reduce((s, i) => s + i.grandTotal, 0))}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#FFFFFF] text-[#5E6168] text-[11px] font-semibold uppercase tracking-[0.04em] border-b border-[#E4E3DE]">
                  <tr>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Place of Supply</th>
                    <th className="py-2 px-3 text-right">Taxable</th>
                    <th className="py-2 px-3 text-right">CGST</th>
                    <th className="py-2 px-3 text-right">SGST</th>
                    <th className="py-2 px-3 text-right">IGST</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEEEA] font-mono text-[12px]">
                  {b2cInvoices.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-[#FDFDFD] cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-sans text-[#17181A]">
                        {inv.supplyType === 'INTRA_STATE' ? 'OE (Other than E-Comm)' : 'Interstate Consumer'}
                      </td>
                      <td className="py-2.5 px-3 text-[#5E6168] font-sans">{inv.placeOfSupply}</td>
                      <td className="py-2.5 px-3 text-right">{inr(inv.taxableAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-[#5E6168]">{inr(inv.totalCgst)}</td>
                      <td className="py-2.5 px-3 text-right text-[#5E6168]">{inr(inv.totalSgst)}</td>
                      <td className="py-2.5 px-3 text-right text-[#2E5AAC]">{inr(inv.totalIgst)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#17181A]">{inr(inv.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 12: HSN Summary */}
          <div className="bg-[#FFFFFF] rounded-[10px] border border-[#E4E3DE] overflow-hidden">
            <div className="p-3.5 border-b border-[#E4E3DE] bg-[#F6F6F3]">
              <h3 className="font-semibold text-[#17181A] text-[12px] uppercase tracking-[0.04em]">
                12. HSN-wise summary of outward supplies
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#FFFFFF] text-[#5E6168] text-[11px] font-semibold uppercase tracking-[0.04em] border-b border-[#E4E3DE]">
                  <tr>
                    <th className="py-2 px-3">HSN / SAC</th>
                    <th className="py-2 px-3">Unit (UQC)</th>
                    <th className="py-2 px-3 text-right">Total Qty</th>
                    <th className="py-2 px-3 text-right">Taxable</th>
                    <th className="py-2 px-3 text-right">CGST</th>
                    <th className="py-2 px-3 text-right">SGST</th>
                    <th className="py-2 px-3 text-right">IGST</th>
                    <th className="py-2 px-3 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEEEA] font-mono text-[12px]">
                  {hsnSummaryList.map(h => (
                    <tr key={h.hsnSac} className="hover:bg-[#FDFDFD]">
                      <td className="py-2.5 px-3 font-semibold text-[#17181A]">{h.hsnSac}</td>
                      <td className="py-2.5 px-3 font-sans text-[#5E6168]">{h.unit}</td>
                      <td className="py-2.5 px-3 text-right">{h.qty}</td>
                      <td className="py-2.5 px-3 text-right">{inr(h.taxable)}</td>
                      <td className="py-2.5 px-3 text-right text-[#5E6168]">{inr(h.cgst)}</td>
                      <td className="py-2.5 px-3 text-right text-[#5E6168]">{inr(h.sgst)}</td>
                      <td className="py-2.5 px-3 text-right text-[#2E5AAC]">{inr(h.igst)}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#1B5E3B]">
                        {inr(h.totalTax)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES REGISTER */}
      {activeTab === 'SALES_REGISTER' && (
        <div className="bg-[#FFFFFF] rounded-[10px] border border-[#E4E3DE] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F6F6F3] text-[#5E6168] text-[11px] font-semibold uppercase tracking-[0.04em] border-b border-[#E4E3DE]">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">State</th>
                  <th className="py-2.5 px-4 text-right">Taxable</th>
                  <th className="py-2.5 px-4 text-right">Tax</th>
                  <th className="py-2.5 px-4 text-right">Grand Total</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEEEA]">
                {validInvoices.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-[#FDFDFD] cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-[12px] text-[#1B5E3B]">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 text-[#5E6168]">{inv.date}</td>
                    <td className="py-3 px-4 font-medium text-[#17181A]">{inv.customerName}</td>
                    <td className="py-3 px-4 text-[#5E6168]">{inv.placeOfSupply}</td>
                    <td className="py-3 px-4 text-right font-mono">{inr(inv.taxableAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono">{inr(inv.totalTax)}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#17181A]">{inr(inv.grandTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-[10px] text-[12px] font-medium ${
                        inv.paymentStatus === 'PAID' ? 'bg-[#E7F0EA] text-[#1B5E3B]' : 'bg-[#FBEEE3] text-[#A14A0B]'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RECEIVABLES */}
      {activeTab === 'RECEIVABLES' && (
        <div className="bg-[#FFFFFF] rounded-[10px] border border-[#E4E3DE] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#F6F6F3] text-[#5E6168] text-[11px] font-semibold uppercase tracking-[0.04em] border-b border-[#E4E3DE]">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4 text-right">Invoice Total</th>
                  <th className="py-2.5 px-4 text-right">Amount Paid</th>
                  <th className="py-2.5 px-4 text-right">Balance Due</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEEEA]">
                {unpaidInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#5E6168]">
                      <CheckCircle className="w-8 h-8 mx-auto text-[#1B5E3B] mb-2" />
                      All invoices are fully settled. Zero outstanding balance.
                    </td>
                  </tr>
                ) : (
                  unpaidInvoices.map(inv => (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-[#FDFDFD] cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-[12px] text-[#1B5E3B]">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-[#5E6168]">
                        {inv.dueDate}
                        {inv.dueDate < '2026-10-31' && (
                          <span className="text-[10px] text-[#A14A0B] font-semibold block">OVERDUE</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#17181A]">{inv.customerName}</td>
                      <td className="py-3 px-4 text-right font-mono">{inr(inv.grandTotal)}</td>
                      <td className="py-3 px-4 text-right font-mono text-[#1B5E3B]">{inr(inv.amountPaid)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#A14A0B]">
                        {inr(inv.amountDue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onSelectInvoice(inv);
                          }}
                          className="px-2.5 py-1 bg-[#E7F0EA] hover:bg-[#D4E7DA] text-[#1B5E3B] font-medium text-[12px] rounded cursor-pointer"
                        >
                          Receive payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
