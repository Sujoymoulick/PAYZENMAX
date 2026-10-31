import React from 'react';
import { BusinessProfile, Invoice } from '../../types';
import { formatCurrency, formatDate, numberToWordsIndian } from '../../core/formatters';

interface PrintableTaxInvoiceProps {
  invoice: Invoice;
  business: BusinessProfile;
  copyType?: 'ORIGINAL FOR RECIPIENT' | 'DUPLICATE FOR TRANSPORTER' | 'TRIPLICATE FOR SUPPLIER';
}

export const PrintableTaxInvoice: React.FC<PrintableTaxInvoiceProps> = ({
  invoice,
  business,
  copyType = 'ORIGINAL FOR RECIPIENT'
}) => {
  const isIntraState = invoice.supplyType === 'INTRA_STATE';

  // UPI payment QR link generation (standard Indian UPI spec: upi://pay?pa=...&pn=...&am=...&cu=INR)
  const upiPayUrl = business.upiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
        `upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.tradeName)}&am=${invoice.amountDue > 0 ? invoice.amountDue : invoice.grandTotal}&cu=INR&tn=${invoice.invoiceNumber}`
      )}`
    : null;

  return (
    <div className="printable-invoice-container bg-white text-slate-900 border border-slate-300 rounded-lg p-6 max-w-4xl mx-auto text-xs shadow-sm font-sans">
      {/* Top Header / Tax Invoice Banner */}
      <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 border border-slate-300 px-2 py-0.5 rounded">
            {copyType}
          </span>
          <h1 className="text-xl font-black font-display tracking-tight text-slate-900 mt-1 uppercase">
            Tax Invoice
          </h1>
          <p className="text-[10px] text-slate-500">
            Issued under Section 31 of CGST Act, 2017 & Rule 46 of CGST Rules
          </p>
        </div>

        <div className="text-right">
          <div className="font-mono text-sm font-black text-slate-900">
            {invoice.invoiceNumber}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Date: <span className="font-semibold text-slate-800">{formatDate(invoice.date)}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Due: <span className="font-semibold text-slate-700">{formatDate(invoice.dueDate)}</span>
          </div>
        </div>
      </div>

      {/* Seller & Buyer Grid */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200">
        {/* Seller Info */}
        <div className="space-y-1 pr-2 border-r border-slate-200">
          <div className="text-[10px] uppercase font-bold text-slate-400">Sold By / Supplier</div>
          <div className="text-sm font-bold text-slate-900">{business.legalName}</div>
          <div className="text-xs text-slate-700 font-medium">{business.tradeName}</div>
          <div className="text-[11px] text-slate-600 leading-snug">{business.address}, {business.city} - {business.pincode}</div>
          <div className="text-[11px] text-slate-800 font-medium">
            GSTIN: <span className="font-mono font-bold text-slate-950">{business.gstin}</span>
          </div>
          <div className="text-[11px] text-slate-600">
            State: <span className="font-semibold">{business.stateName}</span> (Code: <span className="font-mono font-semibold">{business.stateCode}</span>)
          </div>
          <div className="text-[10px] text-slate-500">
            Phone: {business.phone} • Email: {business.email}
          </div>
        </div>

        {/* Buyer Info */}
        <div className="space-y-1 pl-2">
          <div className="text-[10px] uppercase font-bold text-slate-400">Billed To / Recipient</div>
          <div className="text-sm font-bold text-slate-900">{invoice.customerName}</div>
          <div className="text-[11px] text-slate-600 leading-snug">{invoice.billingAddress || 'Local Address'}</div>
          <div className="text-[11px] text-slate-800 font-medium">
            GSTIN: <span className="font-mono font-bold text-slate-950">{invoice.customerGstin || 'Unregistered Consumer (B2C)'}</span>
          </div>
          <div className="text-[11px] text-slate-600">
            State: <span className="font-semibold">{invoice.customerStateName}</span> (Code: <span className="font-mono font-semibold">{invoice.customerStateCode}</span>)
          </div>
          <div className="text-[11px] text-slate-700 font-medium pt-0.5">
            Place of Supply: <span className="font-semibold">{invoice.placeOfSupply}</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Reverse Charge Applicable: <span className="font-semibold">No</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="py-3">
        <table className="w-full text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 border-b border-slate-300">
              <th className="p-1.5 border-r border-slate-300 text-center w-7">#</th>
              <th className="p-1.5 border-r border-slate-300">Description of Goods / Services</th>
              <th className="p-1.5 border-r border-slate-300 text-center w-16">HSN/SAC</th>
              <th className="p-1.5 border-r border-slate-300 text-center w-14">Qty</th>
              <th className="p-1.5 border-r border-slate-300 text-right w-16">Rate (₹)</th>
              <th className="p-1.5 border-r border-slate-300 text-right w-14">Disc</th>
              <th className="p-1.5 border-r border-slate-300 text-right w-18">Taxable (₹)</th>
              {isIntraState ? (
                <>
                  <th className="p-1.5 border-r border-slate-300 text-right w-14">CGST</th>
                  <th className="p-1.5 border-r border-slate-300 text-right w-14">SGST</th>
                </>
              ) : (
                <th className="p-1.5 border-r border-slate-300 text-right w-16">IGST</th>
              )}
              <th className="p-1.5 text-right w-20">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-[11px]">
            {invoice.lines.map((line, idx) => (
              <tr key={line.id} className="align-top">
                <td className="p-1.5 border-r border-slate-300 text-center text-slate-500">{idx + 1}</td>
                <td className="p-1.5 border-r border-slate-300 font-medium text-slate-900">
                  {line.itemName}
                </td>
                <td className="p-1.5 border-r border-slate-300 text-center font-mono text-slate-600">
                  {line.hsnSac || '-'}
                </td>
                <td className="p-1.5 border-r border-slate-300 text-center font-mono">
                  {line.quantity} {line.unit}
                </td>
                <td className="p-1.5 border-r border-slate-300 text-right font-mono">
                  {line.unitPrice.toFixed(2)}
                </td>
                <td className="p-1.5 border-r border-slate-300 text-right font-mono text-slate-500">
                  {line.discountAmount > 0 ? line.discountAmount.toFixed(2) : '-'}
                </td>
                <td className="p-1.5 border-r border-slate-300 text-right font-mono font-medium">
                  {line.taxableValue.toFixed(2)}
                </td>
                {isIntraState ? (
                  <>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono text-slate-600">
                      {line.cgstAmount.toFixed(2)}
                      <span className="block text-[9px] text-slate-400">({line.cgstRate}%)</span>
                    </td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono text-slate-600">
                      {line.sgstAmount.toFixed(2)}
                      <span className="block text-[9px] text-slate-400">({line.sgstRate}%)</span>
                    </td>
                  </>
                ) : (
                  <td className="p-1.5 border-r border-slate-300 text-right font-mono text-slate-600">
                    {line.igstAmount.toFixed(2)}
                    <span className="block text-[9px] text-slate-400">({line.igstRate}%)</span>
                  </td>
                )}
                <td className="p-1.5 text-right font-mono font-bold text-slate-950">
                  {line.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tax Summary Table (Mandatory HSN breakdown under GST rules) */}
      <div className="py-2">
        <div className="text-[10px] font-bold uppercase text-slate-600 mb-1">
          GST Tax Breakdown Summary (HSN/SAC)
        </div>
        <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
          <thead className="bg-slate-50 border-b border-slate-300 font-bold">
            <tr>
              <th className="p-1 border-r border-slate-300">HSN/SAC</th>
              <th className="p-1 border-r border-slate-300 text-right">Taxable Val (₹)</th>
              {isIntraState ? (
                <>
                  <th className="p-1 border-r border-slate-300 text-right">CGST (₹)</th>
                  <th className="p-1 border-r border-slate-300 text-right">SGST (₹)</th>
                </>
              ) : (
                <th className="p-1 border-r border-slate-300 text-right">IGST (₹)</th>
              )}
              <th className="p-1 text-right">Total Tax (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {invoice.hsnSummary.map(row => (
              <tr key={row.hsnSac}>
                <td className="p-1 border-r border-slate-300">{row.hsnSac} ({row.gstRate}%)</td>
                <td className="p-1 border-r border-slate-300 text-right">{row.taxableValue.toFixed(2)}</td>
                {isIntraState ? (
                  <>
                    <td className="p-1 border-r border-slate-300 text-right">{row.cgstAmount.toFixed(2)}</td>
                    <td className="p-1 border-r border-slate-300 text-right">{row.sgstAmount.toFixed(2)}</td>
                  </>
                ) : (
                  <td className="p-1 border-r border-slate-300 text-right">{row.igstAmount.toFixed(2)}</td>
                )}
                <td className="p-1 text-right font-bold">{row.totalTax.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Aggregates & Words Section */}
      <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-slate-300">
        <div>
          <div className="text-[10px] font-bold uppercase text-slate-500">Invoice Value in Words:</div>
          <div className="text-xs font-bold text-slate-800 italic mt-0.5 leading-snug">
            {numberToWordsIndian(invoice.grandTotal)}
          </div>

          {/* Payment Status indicator */}
          <div className="mt-3 p-2 rounded bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600">Payment Status:</span>
              <span className={`font-bold ${invoice.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {invoice.paymentStatus}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] mt-0.5">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-mono font-medium">{formatCurrency(invoice.amountPaid)}</span>
            </div>
            {invoice.amountDue > 0 && (
              <div className="flex items-center justify-between text-[11px] mt-0.5 text-rose-700 font-bold">
                <span>Balance Due:</span>
                <span className="font-mono">{formatCurrency(invoice.amountDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Aggregates Box */}
        <div className="space-y-1 text-right font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500 font-sans">Gross Subtotal:</span>
            <span>{formatCurrency(invoice.subTotal)}</span>
          </div>
          {invoice.totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span className="font-sans">Discount:</span>
              <span>- {formatCurrency(invoice.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1">
            <span className="font-sans">Taxable Value:</span>
            <span>{formatCurrency(invoice.taxableAmount)}</span>
          </div>

          {isIntraState ? (
            <>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Total CGST:</span>
                <span>{formatCurrency(invoice.totalCgst)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-sans">Total SGST:</span>
                <span>{formatCurrency(invoice.totalSgst)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-blue-800 font-semibold">
              <span className="font-sans">Total IGST:</span>
              <span>{formatCurrency(invoice.totalIgst)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-500">
            <span className="font-sans">Round-off:</span>
            <span>{invoice.roundOff >= 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
          </div>

          <div className="flex justify-between font-bold text-base text-slate-950 border-t-2 border-slate-800 pt-1">
            <span className="font-display font-black text-sm">TOTAL INVOICE VALUE:</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Bank Details, UPI QR and Signature Box */}
      <div className="grid grid-cols-3 gap-3 pt-3">
        {/* Bank & UPI Details */}
        <div className="col-span-2 space-y-1 text-[10px] text-slate-600 pr-2">
          <div className="font-bold text-slate-800 uppercase">Bank & UPI Payment Details:</div>
          <div>Bank: <span className="font-semibold text-slate-800">{business.bankName || 'HDFC Bank Ltd'}</span></div>
          <div>A/C No: <span className="font-mono font-bold text-slate-900">{business.bankAccountNumber || '50200049283719'}</span></div>
          <div>IFSC: <span className="font-mono font-bold text-slate-900">{business.bankIfsc || 'HDFC0000240'}</span></div>
          <div>UPI VPA: <span className="font-mono font-bold text-emerald-700">{business.upiId || 'vanguardtech@hdfcbank'}</span></div>

          <div className="pt-2 text-[9px] text-slate-400">
            <div className="font-bold uppercase text-slate-500">Terms & Conditions:</div>
            <div className="whitespace-pre-line">{invoice.termsAndConditions || business.termsAndConditions}</div>
          </div>
        </div>

        {/* QR & Authorized Signatory */}
        <div className="text-right flex flex-col justify-between items-end border-l border-slate-200 pl-3">
          {upiPayUrl && (
            <div className="flex flex-col items-center">
              <img
                src={upiPayUrl}
                alt="UPI Payment QR"
                className="w-16 h-16 border border-slate-300 p-0.5 rounded"
              />
              <span className="text-[9px] text-slate-500 font-mono mt-0.5">Scan to Pay via UPI</span>
            </div>
          )}

          <div className="text-center pt-4 w-full">
            <div className="text-[10px] font-bold text-slate-800">For {business.legalName}</div>
            <div className="h-10"></div>
            <div className="text-[9px] uppercase border-t border-slate-400 pt-1 text-slate-500 font-semibold">
              Authorized Signatory
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
