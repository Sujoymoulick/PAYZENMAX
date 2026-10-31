import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  Printer,
  X,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import {
  BusinessProfile,
  Customer,
  GSTSupplyType,
  Invoice,
  InvoiceLine,
  Item,
  PaymentMode,
  TaxMode
} from '../../types';
import {
  calculateInvoiceTotals,
  calculateLineItem,
  determineSupplyType
} from '../../core/gstEngine';
import {
  generateInvoiceNumber,
  getCurrentDateISO,
  numberToWordsIndian
} from '../../core/formatters';

interface InvoiceComposerProps {
  business: BusinessProfile;
  customers: Customer[];
  items: Item[];
  initialInvoice?: Invoice | null;
  onSaveDraft: (invoice: Invoice) => void;
  onIssueInvoice: (invoice: Invoice) => void;
  onCancel: () => void;
  onQuickAddCustomer: (customer: Customer) => void;
}

export const InvoiceComposer: React.FC<InvoiceComposerProps> = ({
  business,
  customers,
  items,
  initialInvoice,
  onSaveDraft,
  onIssueInvoice,
  onCancel,
  onQuickAddCustomer
}) => {
  const inr = (n: number) => '₹' + Number(Math.round(n)).toLocaleString('en-IN');

  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    initialInvoice?.invoiceNumber ||
      generateInvoiceNumber(business.invoicePrefix, business.nextInvoiceNumber)
  );
  const [invoiceDate, setInvoiceDate] = useState<string>(
    initialInvoice?.date || getCurrentDateISO()
  );
  const [dueDate, setDueDate] = useState<string>(
    initialInvoice?.dueDate || getCurrentDateISO()
  );

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialInvoice?.customerId || ''
  );
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);

  const [newCustName, setNewCustName] = useState('');
  const [newCustGstin, setNewCustGstin] = useState('');
  const [newCustStateCode, setNewCustStateCode] = useState(business.stateCode);
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerStateCode = selectedCustomer?.stateCode || business.stateCode;
  const customerStateName = selectedCustomer?.stateName || business.stateName;

  const supplyType: GSTSupplyType = determineSupplyType(business.stateCode, customerStateCode);

  const defaultLine: InvoiceLine = {
    id: `line_${Date.now()}`,
    itemId: '',
    itemName: '',
    hsnSac: '8471',
    unit: 'PCS',
    quantity: 1,
    unitPrice: 0,
    taxMode: business.defaultTaxMode || 'EXCLUSIVE',
    discountPercent: 0,
    discountAmount: 0,
    taxableValue: 0,
    gstRate: 18,
    cgstRate: 9,
    cgstAmount: 0,
    sgstRate: 9,
    sgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    total: 0
  };

  const [lines, setLines] = useState<InvoiceLine[]>(
    initialInvoice?.lines && initialInvoice.lines.length > 0
      ? initialInvoice.lines
      : [defaultLine]
  );

  const [amountPaid, setAmountPaid] = useState<number>(
    initialInvoice?.amountPaid !== undefined ? initialInvoice.amountPaid : 0
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [notes, setNotes] = useState<string>(initialInvoice?.notes || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateLine = (index: number, updates: Partial<InvoiceLine>) => {
    setLines(prevLines => {
      const updated = [...prevLines];
      const current = { ...updated[index], ...updates };

      const calc = calculateLineItem({
        quantity: current.quantity,
        unitPrice: current.unitPrice,
        discountPercent: current.discountPercent,
        taxMode: current.taxMode,
        gstRate: current.gstRate,
        supplyType
      });

      updated[index] = {
        ...current,
        discountAmount: calc.discountAmount,
        taxableValue: calc.taxableValue,
        cgstRate: calc.cgstRate,
        cgstAmount: calc.cgstAmount,
        sgstRate: calc.sgstRate,
        sgstAmount: calc.sgstAmount,
        igstRate: calc.igstRate,
        igstAmount: calc.igstAmount,
        total: calc.total
      };

      return updated;
    });
  };

  useEffect(() => {
    setLines(prevLines =>
      prevLines.map(line => {
        const calc = calculateLineItem({
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
          taxMode: line.taxMode,
          gstRate: line.gstRate,
          supplyType
        });
        return {
          ...line,
          ...calc
        };
      })
    );
  }, [supplyType]);

  const handleItemSelect = (index: number, itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    updateLine(index, {
      itemId: item.id,
      itemName: item.name,
      hsnSac: item.hsnSac,
      unit: item.unit,
      unitPrice: item.sellingPrice,
      gstRate: item.gstRate
    });
  };

  const addLine = () => {
    setLines(prev => [
      ...prev,
      {
        ...defaultLine,
        id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`
      }
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) {
      setLines([defaultLine]);
      return;
    }
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  const totals = calculateInvoiceTotals(lines);

  const [payInFull, setPayInFull] = useState(true);
  useEffect(() => {
    if (payInFull) {
      setAmountPaid(totals.grandTotal);
    }
  }, [totals.grandTotal, payInFull]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name: newCustName.trim(),
      gstin: newCustGstin.trim().toUpperCase() || undefined,
      isB2B: Boolean(newCustGstin.trim()),
      stateCode: newCustStateCode,
      stateName: business.stateName,
      address: newCustAddress.trim() || 'Local Customer Address',
      city: 'City',
      pincode: '400001',
      phone: newCustPhone.trim() || '+91 98000 00000',
      openingBalance: 0,
      currentBalance: 0,
      createdAt: getCurrentDateISO(),
      updatedAt: getCurrentDateISO()
    };

    onQuickAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setShowNewCustomerModal(false);
    setNewCustName('');
    setNewCustGstin('');
  };

  const buildInvoiceObject = (): Invoice => {
    const cust = selectedCustomer || {
      id: 'cust_walkin',
      name: 'Walk-in customer',
      gstin: undefined,
      stateCode: business.stateCode,
      stateName: business.stateName,
      address: 'Local Counter Sale',
      isB2B: false
    };

    const amtPaid = Math.min(totals.grandTotal, Math.max(0, amountPaid || 0));
    const amtDue = Math.max(0, totals.grandTotal - amtPaid);

    let payStatus: Invoice['paymentStatus'] = 'UNPAID';
    if (amtDue === 0 && totals.grandTotal > 0) payStatus = 'PAID';
    else if (amtPaid > 0) payStatus = 'PARTIAL';

    const payments =
      amtPaid > 0
        ? [
            {
              id: `pay_${Date.now()}`,
              date: invoiceDate,
              amount: amtPaid,
              mode: paymentMode,
              referenceNo: paymentRef,
              notes: 'Recorded at bill creation'
            }
          ]
        : [];

    return {
      id: initialInvoice?.id || `inv_${Date.now()}`,
      invoiceNumber,
      financialYear: business.financialYear,
      date: invoiceDate,
      dueDate,
      status: 'DRAFT',
      sellerGstin: business.gstin,
      sellerStateCode: business.stateCode,
      customerId: cust.id,
      customerName: cust.name,
      customerGstin: cust.gstin,
      customerStateCode: cust.stateCode,
      customerStateName: cust.stateName,
      billingAddress: cust.address,
      placeOfSupply: `${cust.stateCode} - ${cust.stateName}`,
      isB2B: Boolean(cust.gstin),
      supplyType,
      lines,
      hsnSummary: totals.hsnSummary,
      subTotal: totals.subTotal,
      totalDiscount: totals.totalDiscount,
      taxableAmount: totals.taxableAmount,
      totalCgst: totals.totalCgst,
      totalSgst: totals.totalSgst,
      totalIgst: totals.totalIgst,
      totalTax: totals.totalTax,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      amountPaid: amtPaid,
      amountDue: amtDue,
      paymentStatus: payStatus,
      payments,
      notes,
      termsAndConditions: business.termsAndConditions,
      createdAt: initialInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

  const handleIssue = () => {
    if (lines.length === 0 || !lines[0].itemName.trim()) {
      setValidationError('Please add at least one valid item to the bill.');
      return;
    }
    if (totals.grandTotal <= 0) {
      setValidationError('Invoice total must be greater than zero.');
      return;
    }

    setValidationError(null);
    const invoice = buildInvoiceObject();
    onIssueInvoice(invoice);
  };

  const handleSaveDraft = () => {
    const invoice = buildInvoiceObject();
    onSaveDraft(invoice);
  };

  return (
    <div className="bg-[#FFFFFF] rounded-[10px] border border-[#E4E3DE] p-6 max-w-5xl mx-auto flex flex-col gap-5 animate-fade-in no-print font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E4E3DE]">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-md border border-[#DAD9D3] flex items-center justify-center text-[#5E6168] hover:text-[#17181A] hover:bg-[#F6F6F3] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-[18px] font-semibold text-[#17181A]">
              {initialInvoice ? `Edit Bill ${initialInvoice.invoiceNumber}` : 'New tax invoice'}
            </h2>
            <div className="text-[12px] text-[#5E6168]">
              CBIC Rule 46 Compliant · Deterministic calculation
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#DAD9D3] hover:bg-[#F6F6F3] text-[#17181A] text-[13px] font-medium rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#5E6168]" />
            <span>Save draft</span>
          </button>

          <button
            onClick={handleIssue}
            className="flex items-center gap-2 px-4 py-2 bg-[#1B5E3B] hover:bg-[#123F28] text-[#FFFFFF] text-[13px] font-medium rounded-lg transition-colors shadow-xs active:scale-98 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Issue &amp; print bill</span>
          </button>
        </div>
      </div>

      {/* Validation Banner */}
      {validationError && (
        <div className="p-3 bg-[#FBEEE3] border border-[#A14A0B]/20 rounded-lg text-[#A14A0B] text-[13px] font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Header Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#F6F6F3] rounded-[10px] border border-[#E4E3DE]">
        {/* Customer Field */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#5E6168]">
              Customer / Buyer
            </label>
            <button
              type="button"
              onClick={() => setShowNewCustomerModal(true)}
              className="text-[12px] text-[#1B5E3B] hover:text-[#123F28] underline underline-offset-[2px] font-medium cursor-pointer"
            >
              + Quick add
            </button>
          </div>

          <select
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="w-full text-[13px] font-medium bg-[#FFFFFF] border border-[#DAD9D3] rounded-md p-2 text-[#17181A] focus:border-[#17181A] outline-none"
          >
            <option value="">-- Walk-in customer (B2C) --</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.gstin ? `(${c.gstin})` : '(B2C)'}
              </option>
            ))}
          </select>

          {selectedCustomer ? (
            <div className="text-[11px] text-[#5E6168] mt-1 space-y-0.5">
              <div>
                GSTIN:{' '}
                <span className="font-mono text-[#17181A] font-medium">
                  {selectedCustomer.gstin || 'Unregistered B2C'}
                </span>
              </div>
              <div>
                State: {selectedCustomer.stateCode} · {selectedCustomer.stateName}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-[#5E6168] mt-1">
              Local consumer counter sale in {business.stateName}
            </div>
          )}
        </div>

        {/* Invoice Series & Dates */}
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#5E6168] block mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNumber}
              maxLength={16}
              onChange={e => setInvoiceNumber(e.target.value)}
              className="w-full text-[13px] font-mono font-medium bg-[#FFFFFF] border border-[#DAD9D3] rounded-md p-1.5 text-[#17181A] focus:border-[#17181A] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-[#5E6168] block mb-0.5">Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full text-[12px] bg-[#FFFFFF] border border-[#DAD9D3] rounded-md p-1.5 text-[#17181A]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#5E6168] block mb-0.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full text-[12px] bg-[#FFFFFF] border border-[#DAD9D3] rounded-md p-1.5 text-[#17181A]"
              />
            </div>
          </div>
        </div>

        {/* Place of Supply & Tax Mode */}
        <div className="bg-[#FFFFFF] rounded-md p-3 border border-[#DAD9D3] flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#5E6168] mb-1">
              Place of Supply &amp; Tax Split
            </div>
            <div className="text-[13px] font-medium text-[#17181A]">
              POS {customerStateCode} · {customerStateName}
            </div>
          </div>

          <div className="mt-2 text-[12px]">
            {supplyType === 'INTRA_STATE' ? (
              <div className="text-[#1B5E3B] bg-[#E7F0EA] p-2 rounded border border-[#C9D9CF]">
                <span className="font-semibold block">Intra-State Supply</span>
                <span className="text-[11px] text-[#5E6168]">
                  CGST (half) + SGST (half)
                </span>
              </div>
            ) : (
              <div className="text-[#2E5AAC] bg-[#F0F4FA] p-2 rounded border border-[#CAD8EC]">
                <span className="font-semibold block">Inter-State Supply</span>
                <span className="text-[11px] text-[#5E6168]">
                  IGST (full tax)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-[14px] font-semibold text-[#17181A]">Line items</h3>
          <span className="text-[12px] text-[#5E6168]">
            {supplyType === 'INTRA_STATE' ? 'Tax: CGST + SGST' : 'Tax: IGST'}
          </span>
        </div>

        <div className="overflow-x-auto border border-[#E4E3DE] rounded-[8px]">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#F6F6F3] text-[#5E6168] text-[11px] font-semibold uppercase tracking-[0.04em] border-b border-[#E4E3DE]">
              <tr>
                <th className="p-2 w-7 text-center">#</th>
                <th className="p-2 min-w-[200px]">Item description</th>
                <th className="p-2 w-20">HSN</th>
                <th className="p-2 w-16 text-right">Qty</th>
                <th className="p-2 w-24 text-right">Rate (₹)</th>
                <th className="p-2 w-16 text-right">Disc %</th>
                <th className="p-2 w-16 text-center">GST %</th>
                <th className="p-2 w-24 text-right">Tax (₹)</th>
                <th className="p-2 w-24 text-right">Total (₹)</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEEEA]">
              {lines.map((line, idx) => (
                <tr key={line.id} className="hover:bg-[#FDFDFD]">
                  <td className="p-2 text-center text-[#5E6168] font-mono text-[12px]">
                    {idx + 1}
                  </td>
                  <td className="p-2">
                    <select
                      value={line.itemId}
                      onChange={e => handleItemSelect(idx, e.target.value)}
                      className="w-full text-[12px] bg-[#FFFFFF] border border-[#DAD9D3] rounded p-1 mb-1 outline-none text-[#17181A]"
                    >
                      <option value="">-- Catalog item --</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.currentStock} {item.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Item description..."
                      value={line.itemName}
                      onChange={e => updateLine(idx, { itemName: e.target.value })}
                      className="w-full text-[12px] bg-[#FFFFFF] border border-[#DAD9D3] rounded p-1 outline-none text-[#17181A]"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={line.hsnSac}
                      onChange={e => updateLine(idx, { hsnSac: e.target.value })}
                      className="w-full font-mono text-[12px] border border-[#DAD9D3] rounded p-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={line.quantity}
                      onChange={e =>
                        updateLine(idx, { quantity: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full font-mono text-[12px] font-medium text-right border border-[#DAD9D3] rounded p-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={line.unitPrice}
                      onChange={e =>
                        updateLine(idx, { unitPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full font-mono text-[12px] font-medium text-right border border-[#DAD9D3] rounded p-1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={line.discountPercent}
                      onChange={e =>
                        updateLine(idx, { discountPercent: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full font-mono text-[12px] text-right border border-[#DAD9D3] rounded p-1"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      value={line.gstRate}
                      onChange={e =>
                        updateLine(idx, { gstRate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full font-mono text-[12px] text-center border border-[#DAD9D3] rounded p-1 font-semibold"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>
                  <td className="p-2 text-right font-mono text-[12px] text-[#5E6168]">
                    {inr(
                      supplyType === 'INTRA_STATE'
                        ? line.cgstAmount + line.sgstAmount
                        : line.igstAmount
                    )}
                  </td>
                  <td className="p-2 text-right font-mono text-[12px] font-semibold text-[#17181A]">
                    {inr(line.total)}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="text-[#5E6168] hover:text-[#A14A0B] cursor-pointer"
                      title="Remove row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addLine}
          className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F6F3] hover:bg-[#EEEEEA] text-[#17181A] text-[12px] font-medium rounded-md border border-[#DAD9D3] cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add line item (Alt+A)</span>
        </button>
      </div>

      {/* Bottom Panel: Payment and Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-[#E4E3DE]">
        {/* Payment Recording */}
        <div className="bg-[#F6F6F3] rounded-[10px] border border-[#E4E3DE] p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#5E6168]">
              Payment details
            </span>
            <label className="flex items-center gap-1.5 text-[12px] text-[#17181A] cursor-pointer">
              <input
                type="checkbox"
                checked={payInFull}
                onChange={e => {
                  setPayInFull(e.target.checked);
                  if (e.target.checked) setAmountPaid(totals.grandTotal);
                }}
                className="accent-[#1B5E3B]"
              />
              <span>Paid in full</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-[#5E6168] block mb-0.5">Amount received</label>
              <input
                type="number"
                min="0"
                step="any"
                value={amountPaid}
                onChange={e => {
                  setPayInFull(false);
                  setAmountPaid(parseFloat(e.target.value) || 0);
                }}
                className="w-full text-[13px] font-mono font-medium bg-[#FFFFFF] border border-[#DAD9D3] rounded p-1.5"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#5E6168] block mb-0.5">Payment mode</label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full text-[12px] bg-[#FFFFFF] border border-[#DAD9D3] rounded p-1.5"
              >
                <option value="UPI">UPI / QR</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CREDIT">Credit (Unpaid)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#5E6168] block mb-0.5">Reference / Notes</label>
            <input
              type="text"
              placeholder="e.g. UTR / Cheque # or delivery note"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-[12px] bg-[#FFFFFF] border border-[#DAD9D3] rounded p-1.5"
            />
          </div>
        </div>

        {/* Aggregates Summary */}
        <div className="bg-[#FFFFFF] border border-[#E4E3DE] rounded-[10px] p-4 flex flex-col gap-2 font-mono text-[13px]">
          <div className="flex justify-between text-[#5E6168]">
            <span className="font-sans">Taxable value:</span>
            <span>{inr(totals.taxableAmount)}</span>
          </div>

          {supplyType === 'INTRA_STATE' ? (
            <>
              <div className="flex justify-between text-[#5E6168]">
                <span className="font-sans">CGST:</span>
                <span>{inr(totals.totalCgst)}</span>
              </div>
              <div className="flex justify-between text-[#5E6168]">
                <span className="font-sans">SGST:</span>
                <span>{inr(totals.totalSgst)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-[#2E5AAC]">
              <span className="font-sans">IGST:</span>
              <span>{inr(totals.totalIgst)}</span>
            </div>
          )}

          <div className="flex justify-between text-[#5E6168]">
            <span className="font-sans">Round off:</span>
            <span>{totals.roundOff >= 0 ? `+${totals.roundOff}` : totals.roundOff}</span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-[#17181A] text-[16px] font-semibold text-[#17181A]">
            <span className="font-sans text-[14px]">Total invoice value:</span>
            <span>{inr(totals.grandTotal)}</span>
          </div>

          <div className="text-[11px] font-sans text-[#5E6168] italic text-right pt-0.5">
            {numberToWordsIndian(totals.grandTotal)}
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-[10px] border border-[#DAD9D3] w-full max-w-md p-5 flex flex-col gap-3 shadow-lg">
            <div className="flex justify-between items-center border-b border-[#E4E3DE] pb-2">
              <h3 className="font-semibold text-[#17181A] text-[15px]">Quick add customer</h3>
              <button
                type="button"
                onClick={() => setShowNewCustomerModal(false)}
                className="text-[#5E6168] hover:text-[#17181A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="flex flex-col gap-3 text-[13px]">
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shree Ganesh Traders"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full p-2 border border-[#DAD9D3] rounded"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">GSTIN (Optional)</label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 27AAKFS3310B1ZQ"
                  value={newCustGstin}
                  onChange={e => {
                    const val = e.target.value.toUpperCase();
                    setNewCustGstin(val);
                    if (val.length >= 2) setNewCustStateCode(val.substring(0, 2));
                  }}
                  className="w-full font-mono p-2 border border-[#DAD9D3] rounded"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Billing Address</label>
                <input
                  type="text"
                  placeholder="Market Yard, Pune"
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  className="w-full p-2 border border-[#DAD9D3] rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E4E3DE]">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-3 py-1.5 border border-[#DAD9D3] rounded text-[#5E6168]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1B5E3B] text-white rounded font-medium"
                >
                  Save &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
