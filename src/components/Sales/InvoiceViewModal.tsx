import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  Download,
  CreditCard,
  Ban,
  FileMinus,
  AlertCircle
} from 'lucide-react';
import { BusinessProfile, Invoice, PaymentMode } from '../../types';
import { formatCurrency, formatDate } from '../../core/formatters';
import { PrintableTaxInvoice } from './PrintableTaxInvoice';

interface InvoiceViewModalProps {
  invoice: Invoice | null;
  business: BusinessProfile;
  onClose: () => void;
  onRecordPayment: (invoiceId: string, amount: number, mode: PaymentMode, reference?: string) => void;
  onCancelInvoice: (invoiceId: string, reason: string) => void;
  onIssueCreditNote: (invoiceId: string, amount: number, reason: string) => void;
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({
  invoice,
  business,
  onClose,
  onRecordPayment,
  onCancelInvoice,
  onIssueCreditNote
}) => {
  const [copyType, setCopyType] = useState<
    'ORIGINAL FOR RECIPIENT' | 'DUPLICATE FOR TRANSPORTER' | 'TRIPLICATE FOR SUPPLIER'
  >('ORIGINAL FOR RECIPIENT');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<PaymentMode>('UPI');
  const [payRef, setPayRef] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditReason, setCreditReason] = useState('');

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text =
      `Hello ${invoice.customerName}! Here are the details of your GST Tax Invoice ${invoice.invoiceNumber} from ${business.tradeName}:\n` +
      `Date: ${formatDate(invoice.date)}\n` +
      `Total: ${formatCurrency(invoice.grandTotal)}\n` +
      `Balance Due: ${formatCurrency(invoice.amountDue)}\n` +
      `Status: ${invoice.paymentStatus}\n` +
      `Thank you for your business!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}_tax_invoice.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    onRecordPayment(invoice.id, payAmount, payMode, payRef);
    setShowPaymentModal(false);
  };

  const submitCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    onCancelInvoice(invoice.id, cancelReason.trim());
    setShowCancelModal(false);
  };

  const submitCreditNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (creditAmount <= 0 || !creditReason.trim()) return;
    onIssueCreditNote(invoice.id, creditAmount, creditReason.trim());
    setShowCreditModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="bg-[#FFFFFF] rounded-[10px] border border-[#DAD9D3] w-full max-w-5xl my-6 flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
        {/* Actions Bar */}
        <div className="p-3.5 border-b border-[#E4E3DE] flex flex-wrap items-center justify-between gap-3 bg-[#F6F6F3] no-print">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[14px] font-semibold text-[#17181A]">
              {invoice.invoiceNumber}
            </span>
            <span
              className={`px-2 py-0.5 rounded-[10px] text-[12px] font-medium ${
                invoice.status === 'CANCELLED'
                  ? 'bg-[#EEEEEA] text-[#4A4D53]'
                  : invoice.paymentStatus === 'PAID'
                  ? 'bg-[#E7F0EA] text-[#1B5E3B]'
                  : invoice.paymentStatus === 'PARTIAL'
                  ? 'bg-[#FDF4DC] text-[#7A5300]'
                  : 'bg-[#FBEEE3] text-[#A14A0B]'
              }`}
            >
              {invoice.status === 'CANCELLED' ? 'Cancelled' : invoice.paymentStatus}
            </span>

            <select
              value={copyType}
              onChange={e => setCopyType(e.target.value as any)}
              className="text-[12px] bg-[#FFFFFF] border border-[#DAD9D3] rounded px-2 py-1 text-[#17181A] outline-none"
            >
              <option value="ORIGINAL FOR RECIPIENT">Original (Buyer)</option>
              <option value="DUPLICATE FOR TRANSPORTER">Duplicate (Transporter)</option>
              <option value="TRIPLICATE FOR SUPPLIER">Triplicate (Supplier)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {invoice.status !== 'CANCELLED' && invoice.amountDue > 0 && (
              <button
                onClick={() => {
                  setPayAmount(invoice.amountDue);
                  setShowPaymentModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B5E3B] hover:bg-[#123F28] text-white rounded text-[12px] font-medium transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Receive payment</span>
              </button>
            )}

            {invoice.status === 'ISSUED' && (
              <button
                onClick={() => {
                  setCreditAmount(invoice.grandTotal);
                  setShowCreditModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#DAD9D3] hover:bg-[#F6F6F3] text-[#17181A] rounded text-[12px] font-medium transition-colors cursor-pointer"
              >
                <FileMinus className="w-3.5 h-3.5 text-[#5E6168]" />
                <span className="hidden sm:inline">Credit note</span>
              </button>
            )}

            {invoice.status === 'ISSUED' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#A14A0B]/30 hover:bg-[#FBEEE3] text-[#A14A0B] rounded text-[12px] font-medium transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cancel bill</span>
              </button>
            )}

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FFFFFF] border border-[#DAD9D3] hover:bg-[#F6F6F3] text-[#1B5E3B] rounded text-[12px] font-medium transition-colors cursor-pointer"
              title="Share on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="p-1.5 border border-[#DAD9D3] hover:bg-[#F6F6F3] text-[#17181A] rounded text-[12px] cursor-pointer"
              title="Download JSON Snapshot"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#17181A] hover:bg-[#2A2B2E] text-white rounded text-[12px] font-medium transition-colors cursor-pointer active:scale-98"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded flex items-center justify-center text-[#5E6168] hover:text-[#17181A] hover:bg-[#E4E3DE] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cancellation Notice */}
        {invoice.status === 'CANCELLED' && (
          <div className="bg-[#FBEEE3] border-b border-[#A14A0B]/20 p-2.5 text-[12px] text-[#A14A0B] flex items-center gap-2 no-print">
            <AlertCircle className="w-4 h-4 text-[#A14A0B] flex-shrink-0" />
            <span>
              <strong>Cancelled Document:</strong> Cancelled on {formatDate(invoice.cancelledAt || invoice.updatedAt)}.
              Reason: <em>"{invoice.cancellationReason || 'Correction'}"</em>.
            </span>
          </div>
        )}

        {/* Invoice View Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F6F6F3]">
          <PrintableTaxInvoice
            invoice={invoice}
            business={business}
            copyType={copyType}
          />
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[10px] border border-[#DAD9D3] w-full max-w-sm p-5 flex flex-col gap-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#E4E3DE] pb-2">
              <h3 className="font-semibold text-[#17181A] text-[14px]">Receive payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-[#5E6168]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitPayment} className="flex flex-col gap-3 text-[13px]">
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={invoice.amountDue}
                  step="any"
                  value={payAmount}
                  onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-[15px] font-semibold p-2 border border-[#DAD9D3] rounded"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Payment mode</label>
                <select
                  value={payMode}
                  onChange={e => setPayMode(e.target.value as any)}
                  className="w-full p-2 border border-[#DAD9D3] rounded"
                >
                  <option value="UPI">UPI / QR</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank transfer (IMPS/NEFT)</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Reference #</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/2839210920"
                  value={payRef}
                  onChange={e => setPayRef(e.target.value)}
                  className="w-full p-2 border border-[#DAD9D3] rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E3DE]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3 py-1.5 border border-[#DAD9D3] rounded text-[#5E6168]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1B5E3B] text-white rounded font-medium"
                >
                  Confirm receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[10px] border border-[#DAD9D3] w-full max-w-sm p-5 flex flex-col gap-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#E4E3DE] pb-2">
              <h3 className="font-semibold text-[#A14A0B] text-[14px]">Cancel invoice</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-[#5E6168]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[12px] text-[#5E6168]">
              Per GST rules, issued invoices are immutable. Cancelling preserves the record in the sales register, restores catalog stock, and reverses customer balance.
            </p>
            <form onSubmit={submitCancel} className="flex flex-col gap-3 text-[13px]">
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Reason for cancellation *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Wrong item billed / customer order cancelled"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  className="w-full p-2 border border-[#DAD9D3] rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E3DE]">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-3 py-1.5 border border-[#DAD9D3] rounded text-[#5E6168]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#A14A0B] text-white rounded font-medium"
                >
                  Confirm void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Note Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[10px] border border-[#DAD9D3] w-full max-w-sm p-5 flex flex-col gap-3 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#E4E3DE] pb-2">
              <h3 className="font-semibold text-[#17181A] text-[14px]">Issue credit note</h3>
              <button onClick={() => setShowCreditModal(false)} className="text-[#5E6168]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submitCreditNote} className="flex flex-col gap-3 text-[13px]">
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Credit amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={invoice.grandTotal}
                  step="any"
                  value={creditAmount}
                  onChange={e => setCreditAmount(parseFloat(e.target.value) || 0)}
                  className="w-full font-mono text-[15px] font-semibold p-2 border border-[#DAD9D3] rounded"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Reason for credit note *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Sales return / Damaged goods discount"
                  value={creditReason}
                  onChange={e => setCreditReason(e.target.value)}
                  className="w-full p-2 border border-[#DAD9D3] rounded"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E3DE]">
                <button
                  type="button"
                  onClick={() => setShowCreditModal(false)}
                  className="px-3 py-1.5 border border-[#DAD9D3] rounded text-[#5E6168]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#17181A] text-white rounded font-medium"
                >
                  Issue credit note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
