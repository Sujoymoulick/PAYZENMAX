// Core Domain Types for GST Business Platform

export type TaxMode = 'EXCLUSIVE' | 'INCLUSIVE';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT';
export type ItemType = 'GOODS' | 'SERVICE';
export type GSTSupplyType = 'INTRA_STATE' | 'INTER_STATE';

export interface IndianState {
  code: string; // 2-digit e.g. "27"
  name: string; // e.g. "Maharashtra"
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' }
];

export interface BusinessProfile {
  id: string;
  legalName: string;
  tradeName: string;
  gstin: string; // 15 characters, e.g. 27AAAAA0000A1Z5
  stateCode: string; // 2 digits
  stateName: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  upiId?: string;
  invoicePrefix: string; // e.g. "INV-2627-"
  nextInvoiceNumber: number; // sequential counter
  financialYear: string; // e.g. "2026-2027"
  defaultTaxMode: TaxMode;
  termsAndConditions?: string;
}

export interface Customer {
  id: string;
  name: string;
  gstin?: string; // If empty, unregistered B2C consumer
  isB2B: boolean;
  stateCode: string;
  stateName: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  email?: string;
  openingBalance: number; // in rupees
  currentBalance: number; // in rupees (positive = owes money)
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  type: ItemType;
  hsnSac: string; // 4, 6 or 8 digits
  unit: string; // PCS, KGS, BOX, MTR, NOS, HRS, SET
  sellingPrice: number; // in rupees
  purchasePrice?: number;
  gstRate: number; // 0, 5, 12, 18, 28 (%)
  currentStock: number;
  lowStockThreshold: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLine {
  id: string;
  itemId: string;
  itemName: string;
  hsnSac: string;
  unit: string;
  quantity: number;
  unitPrice: number; // base selling price entered
  taxMode: TaxMode; // exclusive vs inclusive
  discountPercent: number;
  discountAmount: number; // calculated discount in rupees
  taxableValue: number; // taxable amount in rupees
  gstRate: number; // e.g. 18
  cgstRate: number; // 9
  cgstAmount: number;
  sgstRate: number; // 9
  sgstAmount: number;
  igstRate: number; // 18 or 0
  igstAmount: number;
  total: number; // final line total
}

export interface TaxBreakdownRow {
  hsnSac: string;
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  referenceNo?: string;
  notes?: string;
}

export interface CreditNote {
  id: string;
  noteNumber: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  date: string;
  reason: string;
  totalAmount: number;
  taxReversal: {
    taxableValue: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
  };
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // unique, max 16 chars
  financialYear: string;
  date: string; // ISO date YYYY-MM-DD
  dueDate: string;
  status: InvoiceStatus;
  cancellationReason?: string;
  cancelledAt?: string;

  // Parties
  sellerGstin: string;
  sellerStateCode: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  customerStateCode: string;
  customerStateName: string;
  billingAddress: string;
  placeOfSupply: string; // state code & name
  isB2B: boolean;
  supplyType: GSTSupplyType; // INTRA_STATE or INTER_STATE

  // Line items
  lines: InvoiceLine[];

  // Tax Breakdown summary per HSN
  hsnSummary: TaxBreakdownRow[];

  // Aggregates (in Rupees, stored with 2 decimal precision)
  subTotal: number; // gross before tax
  totalDiscount: number;
  taxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  roundOff: number; // e.g. +0.20 or -0.35
  grandTotal: number; // final payable

  // Payments
  amountPaid: number;
  amountDue: number;
  paymentStatus: PaymentStatus;
  payments: PaymentRecord[];

  notes?: string;
  termsAndConditions?: string;

  // Credit Notes linked
  creditNotes?: CreditNote[];

  // Snapshot for immutability when issued
  issuedAt?: string;
  issuedSnapshot?: string; // serialized JSON snapshot of the issued state
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  entityType: 'INVOICE' | 'ITEM' | 'CUSTOMER' | 'BUSINESS' | 'BACKUP';
  entityId: string;
  action: 'CREATE' | 'ISSUE' | 'CANCEL' | 'PAYMENT' | 'CREDIT_NOTE' | 'UPDATE' | 'RESTORE';
  details: string;
  actor: string;
}

export interface SalesFilter {
  dateRange: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_FY' | 'ALL' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  status?: InvoiceStatus | 'ALL';
  paymentStatus?: PaymentStatus | 'ALL';
  customerId?: string;
}
