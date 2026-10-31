import {
  AuditLog,
  BusinessProfile,
  CreditNote,
  Customer,
  Invoice,
  Item,
  PaymentRecord
} from '../types';
import { generateInvoiceNumber, getCurrentDateISO } from './formatters';

const STORAGE_KEYS = {
  BUSINESS: 'gst_business_profile_v2',
  CUSTOMERS: 'gst_customers_v2',
  ITEMS: 'gst_items_v2',
  INVOICES: 'gst_invoices_v2',
  AUDIT_LOGS: 'gst_audit_logs_v2',
  INITIALIZED: 'gst_initialized_v2'
};

// Seed realistic Indian demo business aligned with Design Reference
const DEFAULT_BUSINESS: BusinessProfile = {
  id: 'biz_01',
  legalName: 'Vanguard Electronics LLP',
  tradeName: 'Vanguard Electronics',
  gstin: '27AAJCV4821M1Z6',
  stateCode: '27',
  stateName: 'Maharashtra',
  address: 'Shop 12, Lamington Road, Grant Road East',
  city: 'Mumbai',
  pincode: '400007',
  phone: '+91 98201 44550',
  email: 'billing@vanguardelectronics.in',
  bankName: 'HDFC Bank Ltd',
  bankAccountNumber: '50200049283719',
  bankIfsc: 'HDFC0000240',
  upiId: 'vanguardelec@hdfcbank',
  invoicePrefix: 'VT/26-27/',
  nextInvoiceNumber: 149,
  financialYear: '2026-27',
  defaultTaxMode: 'EXCLUSIVE',
  termsAndConditions: '1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged on overdue payments after 30 days.\n3. Subject to Mumbai jurisdiction only.'
};

const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust_01',
    name: 'Shree Ganesh Traders',
    gstin: '27AAKFS3310B1ZQ',
    isB2B: true,
    stateCode: '27',
    stateName: 'Maharashtra',
    address: '45, Market Yard, Gultekdi',
    city: 'Pune',
    pincode: '411037',
    phone: '+91 98220 33100',
    email: 'accounts@shreeganeshtraders.in',
    openingBalance: 0,
    currentBalance: 0,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-30'
  },
  {
    id: 'cust_02',
    name: 'Patel Infotech Pvt Ltd',
    gstin: '24AAGCP7742K1Z2',
    isB2B: true,
    stateCode: '24', // Gujarat (Inter-state IGST)
    stateName: 'Gujarat',
    address: 'B-402, Titanium City Centre, Anandnagar',
    city: 'Ahmedabad',
    pincode: '380015',
    phone: '+91 98250 77420',
    email: 'finance@patelinfotech.com',
    openingBalance: 0,
    currentBalance: 139240, // Overdue due 28 Nov
    createdAt: '2026-10-05',
    updatedAt: '2026-10-29'
  },
  {
    id: 'cust_03',
    name: 'Kulkarni Systems',
    gstin: '27ABMFK9021D1Z8',
    isB2B: true,
    stateCode: '27',
    stateName: 'Maharashtra',
    address: '104, IT Park, MIDC Bhosari',
    city: 'Pimpri-Chinchwad',
    pincode: '411026',
    phone: '+91 98900 90210',
    email: 'ops@kulkarnisystems.com',
    openingBalance: 0,
    currentBalance: 35756, // Remaining due on part-paid bill
    createdAt: '2026-10-10',
    updatedAt: '2026-10-28'
  },
  {
    id: 'cust_04',
    name: 'Nexa Retail LLP',
    gstin: '29AAQFN5518H1ZK',
    isB2B: true,
    stateCode: '29', // Karnataka (Inter-state IGST)
    stateName: 'Karnataka',
    address: '88, 100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    phone: '+91 98450 55180',
    email: 'nexa.retail@gmail.com',
    openingBalance: 0,
    currentBalance: 0,
    createdAt: '2026-10-12',
    updatedAt: '2026-10-27'
  },
  {
    id: 'cust_05',
    name: 'Deshmukh Electricals',
    gstin: '27AAPFD2287L1ZC',
    isB2B: true,
    stateCode: '27',
    stateName: 'Maharashtra',
    address: 'Shop 5, Railway Station Road',
    city: 'Nashik',
    pincode: '422001',
    phone: '+91 94222 22870',
    email: 'deshmukh.elec@rediffmail.com',
    openingBalance: 0,
    currentBalance: 0,
    createdAt: '2026-10-02',
    updatedAt: '2026-10-25'
  },
  {
    id: 'cust_06',
    name: 'Walk-in customer',
    isB2B: false,
    stateCode: '27',
    stateName: 'Maharashtra',
    address: 'Local Counter Sale',
    city: 'Mumbai',
    pincode: '400007',
    phone: '-',
    openingBalance: 0,
    currentBalance: 0,
    createdAt: '2026-10-15',
    updatedAt: '2026-10-30'
  }
];

const DEFAULT_ITEMS: Item[] = [
  {
    id: 'item_01',
    name: 'Hikvision 4MP Dome Camera',
    sku: 'HIK-4MP-DOME',
    type: 'GOODS',
    hsnSac: '8525',
    unit: 'PCS',
    sellingPrice: 4250,
    purchasePrice: 3200,
    gstRate: 18,
    currentStock: 3, // LOW STOCK
    lowStockThreshold: 10,
    description: 'Ultra HD 4MP IP Network IR Dome Camera with PoE',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-30'
  },
  {
    id: 'item_02',
    name: 'TP-Link Archer C6 Router',
    sku: 'TPL-ARCH-C6',
    type: 'GOODS',
    hsnSac: '8517',
    unit: 'PCS',
    sellingPrice: 2850,
    purchasePrice: 2100,
    gstRate: 18,
    currentStock: 2, // LOW STOCK
    lowStockThreshold: 8,
    description: 'AC1200 Wireless MU-MIMO Gigabit Wi-Fi Router',
    createdAt: '2026-10-01',
    updatedAt: '2026-10-29'
  },
  {
    id: 'item_03',
    name: 'Cat6 Cable 305m box',
    sku: 'CAT6-305M-BOX',
    type: 'GOODS',
    hsnSac: '8544',
    unit: 'BOX',
    sellingPrice: 6200,
    purchasePrice: 4800,
    gstRate: 18,
    currentStock: 1, // LOW STOCK
    lowStockThreshold: 5,
    description: 'Pure copper 23AWG gigabit ethernet roll',
    createdAt: '2026-10-02',
    updatedAt: '2026-10-30'
  },
  {
    id: 'item_04',
    name: 'Logitech MK270 Keyboard + Mouse',
    sku: 'LOGI-MK270-COM',
    type: 'GOODS',
    hsnSac: '8471',
    unit: 'SET',
    sellingPrice: 1650,
    purchasePrice: 1250,
    gstRate: 18,
    currentStock: 4, // LOW STOCK
    lowStockThreshold: 12,
    description: 'Long-range wireless desktop combo with nano receiver',
    createdAt: '2026-10-02',
    updatedAt: '2026-10-28'
  },
  {
    id: 'item_05',
    name: 'Dell Latitude 3440 Commercial Laptop',
    sku: 'DELL-LAT-3440',
    type: 'GOODS',
    hsnSac: '8471',
    unit: 'PCS',
    sellingPrice: 59000,
    purchasePrice: 51000,
    gstRate: 18,
    currentStock: 7,
    lowStockThreshold: 3,
    description: '13th Gen Intel Core i5, 16GB RAM, 512GB SSD',
    createdAt: '2026-10-05',
    updatedAt: '2026-10-28'
  },
  {
    id: 'item_06',
    name: 'CCTV Installation & Network Setup',
    sku: 'SRV-CCTV-INST',
    type: 'SERVICE',
    hsnSac: '9987',
    unit: 'HRS',
    sellingPrice: 1250,
    gstRate: 18,
    currentStock: 999,
    lowStockThreshold: 0,
    description: 'Onsite structured cabling and DVR configuration',
    createdAt: '2026-10-05',
    updatedAt: '2026-10-28'
  }
];

// Invoices matching the exact reference table in Main.dc.html
const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv_148',
    invoiceNumber: 'VT/26-27/0148',
    financialYear: '2026-27',
    date: '2026-10-30',
    dueDate: '2026-11-14',
    status: 'ISSUED',
    sellerGstin: '27AAJCV4821M1Z6',
    sellerStateCode: '27',
    customerId: 'cust_01',
    customerName: 'Shree Ganesh Traders',
    customerGstin: '27AAKFS3310B1ZQ',
    customerStateCode: '27',
    customerStateName: 'Maharashtra',
    billingAddress: '45, Market Yard, Gultekdi, Pune',
    placeOfSupply: '27 - Maharashtra',
    isB2B: true,
    supplyType: 'INTRA_STATE',
    lines: [
      {
        id: 'line_148_1',
        itemId: 'item_01',
        itemName: 'Hikvision 4MP Dome Camera',
        hsnSac: '8525',
        unit: 'PCS',
        quantity: 10,
        unitPrice: 4250,
        taxMode: 'EXCLUSIVE',
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 42500,
        gstRate: 18,
        cgstRate: 9,
        cgstAmount: 3825,
        sgstRate: 9,
        sgstAmount: 3825,
        igstRate: 0,
        igstAmount: 0,
        total: 50150
      }
    ],
    hsnSummary: [
      {
        hsnSac: '8525',
        taxableValue: 42500,
        gstRate: 18,
        cgstAmount: 3825,
        sgstAmount: 3825,
        igstAmount: 0,
        totalTax: 7650
      }
    ],
    subTotal: 42500,
    totalDiscount: 0,
    taxableAmount: 42500,
    totalCgst: 3825,
    totalSgst: 3825,
    totalIgst: 0,
    totalTax: 7650,
    roundOff: 0,
    grandTotal: 50150,
    amountPaid: 50150,
    amountDue: 0,
    paymentStatus: 'PAID',
    payments: [
      {
        id: 'pay_148',
        date: '2026-10-30',
        amount: 50150,
        mode: 'UPI',
        referenceNo: 'UPI/309921094',
        notes: 'Paid via PhonePe'
      }
    ],
    issuedAt: '2026-10-30T10:30:00Z',
    createdAt: '2026-10-30',
    updatedAt: '2026-10-30'
  },
  {
    id: 'inv_147',
    invoiceNumber: 'VT/26-27/0147',
    financialYear: '2026-27',
    date: '2026-10-30',
    dueDate: '2026-10-30',
    status: 'ISSUED',
    sellerGstin: '27AAJCV4821M1Z6',
    sellerStateCode: '27',
    customerId: 'cust_06',
    customerName: 'Walk-in customer',
    customerStateCode: '27',
    customerStateName: 'Maharashtra',
    billingAddress: 'Local Counter Sale',
    placeOfSupply: '27 - Maharashtra',
    isB2B: false,
    supplyType: 'INTRA_STATE',
    lines: [
      {
        id: 'line_147_1',
        itemId: 'item_02',
        itemName: 'TP-Link Archer C6 Router',
        hsnSac: '8517',
        unit: 'PCS',
        quantity: 1,
        unitPrice: 2850,
        taxMode: 'EXCLUSIVE',
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 2850,
        gstRate: 18,
        cgstRate: 9,
        cgstAmount: 256.5,
        sgstRate: 9,
        sgstAmount: 256.5,
        igstRate: 0,
        igstAmount: 0,
        total: 3363
      }
    ],
    hsnSummary: [
      {
        hsnSac: '8517',
        taxableValue: 2850,
        gstRate: 18,
        cgstAmount: 256.5,
        sgstAmount: 256.5,
        igstAmount: 0,
        totalTax: 513
      }
    ],
    subTotal: 2850,
    totalDiscount: 0,
    taxableAmount: 2850,
    totalCgst: 256.5,
    totalSgst: 256.5,
    totalIgst: 0,
    totalTax: 513,
    roundOff: 0,
    grandTotal: 3363,
    amountPaid: 3363,
    amountDue: 0,
    paymentStatus: 'PAID',
    payments: [
      {
        id: 'pay_147',
        date: '2026-10-30',
        amount: 3363,
        mode: 'CASH',
        notes: 'Cash received at counter'
      }
    ],
    issuedAt: '2026-10-30T12:15:00Z',
    createdAt: '2026-10-30',
    updatedAt: '2026-10-30'
  },
  {
    id: 'inv_146',
    invoiceNumber: 'VT/26-27/0146',
    financialYear: '2026-27',
    date: '2026-10-29',
    dueDate: '2026-11-28', // Credit · due 28 Nov
    status: 'ISSUED',
    sellerGstin: '27AAJCV4821M1Z6',
    sellerStateCode: '27',
    customerId: 'cust_02',
    customerName: 'Patel Infotech Pvt Ltd',
    customerGstin: '24AAGCP7742K1Z2',
    customerStateCode: '24', // Gujarat IGST!
    customerStateName: 'Gujarat',
    billingAddress: 'B-402, Titanium City Centre, Anandnagar, Ahmedabad',
    placeOfSupply: '24 - Gujarat',
    isB2B: true,
    supplyType: 'INTER_STATE',
    lines: [
      {
        id: 'line_146_1',
        itemId: 'item_05',
        itemName: 'Dell Latitude 3440 Commercial Laptop',
        hsnSac: '8471',
        unit: 'PCS',
        quantity: 2,
        unitPrice: 59000,
        taxMode: 'EXCLUSIVE',
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 118000,
        gstRate: 18,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 18,
        igstAmount: 21240,
        total: 139240
      }
    ],
    hsnSummary: [
      {
        hsnSac: '8471',
        taxableValue: 118000,
        gstRate: 18,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 21240,
        totalTax: 21240
      }
    ],
    subTotal: 118000,
    totalDiscount: 0,
    taxableAmount: 118000,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 21240,
    totalTax: 21240,
    roundOff: 0,
    grandTotal: 139240,
    amountPaid: 0,
    amountDue: 139240,
    paymentStatus: 'UNPAID',
    payments: [],
    notes: 'Credit · due 28 Nov',
    issuedAt: '2026-10-29T14:40:00Z',
    createdAt: '2026-10-29',
    updatedAt: '2026-10-29'
  },
  {
    id: 'inv_145',
    invoiceNumber: 'VT/26-27/0145',
    financialYear: '2026-27',
    date: '2026-10-28',
    dueDate: '2026-11-12',
    status: 'ISSUED',
    sellerGstin: '27AAJCV4821M1Z6',
    sellerStateCode: '27',
    customerId: 'cust_03',
    customerName: 'Kulkarni Systems',
    customerGstin: '27ABMFK9021D1Z8',
    customerStateCode: '27',
    customerStateName: 'Maharashtra',
    billingAddress: '104, IT Park, MIDC Bhosari, Pimpri-Chinchwad',
    placeOfSupply: '27 - Maharashtra',
    isB2B: true,
    supplyType: 'INTRA_STATE',
    lines: [
      {
        id: 'line_145_1',
        itemId: 'item_03',
        itemName: 'Cat6 Cable 305m box',
        hsnSac: '8544',
        unit: 'BOX',
        quantity: 10,
        unitPrice: 6200,
        taxMode: 'EXCLUSIVE',
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 62000,
        gstRate: 18,
        cgstRate: 9,
        cgstAmount: 5580,
        sgstRate: 9,
        sgstAmount: 5580,
        igstRate: 0,
        igstAmount: 0,
        total: 73160
      },
      {
        id: 'line_145_2',
        itemId: 'item_04',
        itemName: 'Logitech MK270 Keyboard + Mouse',
        hsnSac: '8471',
        unit: 'SET',
        quantity: 1.333,
        unitPrice: 1650,
        taxMode: 'EXCLUSIVE',
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 2200,
        gstRate: 18,
        cgstRate: 9,
        cgstAmount: 198,
        sgstRate: 9,
        sgstAmount: 198,
        igstRate: 0,
        igstAmount: 0,
        total: 2596
      }
    ],
    hsnSummary: [
      {
        hsnSac: '8544',
        taxableValue: 62000,
        gstRate: 18,
        cgstAmount: 5580,
        sgstAmount: 5580,
        igstAmount: 0,
        totalTax: 11160
      },
      {
        hsnSac: '8471',
        taxableValue: 2200,
        gstRate: 18,
        cgstAmount: 198,
        sgstAmount: 198,
        igstAmount: 0,
        totalTax: 396
      }
    ],
    subTotal: 64200,
    totalDiscount: 0,
    taxableAmount: 64200,
    totalCgst: 5778,
    totalSgst: 5778,
    totalIgst: 0,
    totalTax: 11556,
    roundOff: 0,
    grandTotal: 75756,
    amountPaid: 40000,
    amountDue: 35756,
    paymentStatus: 'PARTIAL',
    payments: [
      {
        id: 'pay_145',
        date: '2026-10-28',
        amount: 40000,
        mode: 'BANK_TRANSFER',
        referenceNo: 'HDFC-IMPS-8841',
        notes: '₹40,000 received via IMPS'
      }
    ],
    issuedAt: '2026-10-28T16:20:00Z',
    createdAt: '2026-10-28',
    updatedAt: '2026-10-28'
  },
  {
    id: 'inv_144',
    invoiceNumber: 'VT/26-27/0144',
    financialYear: '2026-27',
    date: '2026-10-27',
    dueDate: '2026-11-10',
    status: 'ISSUED',
    sellerGstin: '27AAJCV4821M1Z6',
    sellerStateCode: '27',
    customerId: 'cust_04',
    customerName: 'Nexa Retail LLP',
    customerGstin: '29AAQFN5518H1ZK',
    customerStateCode: '29', // Karnataka IGST!
    customerStateName: 'Karnataka',
    billingAddress: '88, 100 Feet Road, Indiranagar, Bengaluru',
    placeOfSupply: '29 - Karnataka',
    isB2B: true,
    supplyType: 'INTER_STATE',
    lines: [
      {
        id: 'line_144_1',
        itemId: 'item_01',
        itemName: 'Hikvision 4MP Dome Camera',
        hsnSac: '8525',
        unit: 'PCS',
        quantity: 8,
        unitPrice: 4250,
        taxMode: 'EXCLUSIVE',
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 34000,
        gstRate: 18,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 18,
        igstAmount: 6120,
        total: 40120
      },
      {
        id: 'line_144_2',
        itemId: 'item_02',
        itemName: 'TP-Link Archer C6 Router',
        hsnSac: '8517',
        unit: 'PCS',
        quantity: 1,
        unitPrice: 2900,
        taxMode: 'EXCLUSIVE',
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 2900,
        gstRate: 18,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        igstRate: 18,
        igstAmount: 522,
        total: 3422
      }
    ],
    hsnSummary: [
      {
        hsnSac: '8525',
        taxableValue: 34000,
        gstRate: 18,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 6120,
        totalTax: 6120
      },
      {
        hsnSac: '8517',
        taxableValue: 2900,
        gstRate: 18,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 522,
        totalTax: 522
      }
    ],
    subTotal: 36900,
    totalDiscount: 0,
    taxableAmount: 36900,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 6642,
    totalTax: 6642,
    roundOff: 0,
    grandTotal: 43542,
    amountPaid: 43542,
    amountDue: 0,
    paymentStatus: 'PAID',
    payments: [
      {
        id: 'pay_144',
        date: '2026-10-27',
        amount: 43542,
        mode: 'BANK_TRANSFER',
        referenceNo: 'NEFT-551982',
        notes: 'Paid via bank transfer'
      }
    ],
    issuedAt: '2026-10-27T11:00:00Z',
    createdAt: '2026-10-27',
    updatedAt: '2026-10-27'
  },
  {
    id: 'inv_143',
    invoiceNumber: 'VT/26-27/0143',
    financialYear: '2026-27',
    date: '2026-10-26',
    dueDate: '2026-10-26',
    status: 'CANCELLED',
    cancellationReason: 'Wrong item billed',
    cancelledAt: '2026-10-26T17:00:00Z',
    sellerGstin: '27AAJCV4821M1Z6',
    sellerStateCode: '27',
    customerId: 'cust_06',
    customerName: 'Walk-in customer',
    customerStateCode: '27',
    customerStateName: 'Maharashtra',
    billingAddress: 'Local Counter Sale',
    placeOfSupply: '27 - Maharashtra',
    isB2B: false,
    supplyType: 'INTRA_STATE',
    lines: [
      {
        id: 'line_143_1',
        itemId: 'item_04',
        itemName: 'Logitech MK270 Keyboard + Mouse',
        hsnSac: '8471',
        unit: 'SET',
        quantity: 1,
        unitPrice: 1240,
        taxMode: 'EXCLUSIVE',
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 1240,
        gstRate: 18,
        cgstRate: 9,
        cgstAmount: 111.6,
        sgstRate: 9,
        sgstAmount: 111.6,
        igstRate: 0,
        igstAmount: 0,
        total: 1463.2
      }
    ],
    hsnSummary: [
      {
        hsnSac: '8471',
        taxableValue: 1240,
        gstRate: 18,
        cgstAmount: 111.6,
        sgstAmount: 111.6,
        igstAmount: 0,
        totalTax: 223.2
      }
    ],
    subTotal: 1240,
    totalDiscount: 0,
    taxableAmount: 1240,
    totalCgst: 111.6,
    totalSgst: 111.6,
    totalIgst: 0,
    totalTax: 223.2,
    roundOff: -0.2,
    grandTotal: 1463,
    amountPaid: 0,
    amountDue: 0,
    paymentStatus: 'UNPAID',
    payments: [],
    issuedAt: '2026-10-26T15:00:00Z',
    createdAt: '2026-10-26',
    updatedAt: '2026-10-26'
  },
  {
    id: 'inv_142',
    invoiceNumber: 'VT/26-27/0142',
    financialYear: '2026-27',
    date: '2026-10-25',
    dueDate: '2026-11-08',
    status: 'ISSUED',
    sellerGstin: '27AAJCV4821M1Z6',
    sellerStateCode: '27',
    customerId: 'cust_05',
    customerName: 'Deshmukh Electricals',
    customerGstin: '27AAPFD2287L1ZC',
    customerStateCode: '27',
    customerStateName: 'Maharashtra',
    billingAddress: 'Shop 5, Railway Station Road, Nashik',
    placeOfSupply: '27 - Maharashtra',
    isB2B: true,
    supplyType: 'INTRA_STATE',
    lines: [
      {
        id: 'line_142_1',
        itemId: 'item_03',
        itemName: 'Cat6 Cable 305m box',
        hsnSac: '8544',
        unit: 'BOX',
        quantity: 3,
        unitPrice: 6200,
        taxMode: 'EXCLUSIVE',
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 18600,
        gstRate: 18,
        cgstRate: 9,
        cgstAmount: 1674,
        sgstRate: 9,
        sgstAmount: 1674,
        igstRate: 0,
        igstAmount: 0,
        total: 21948
      }
    ],
    hsnSummary: [
      {
        hsnSac: '8544',
        taxableValue: 18600,
        gstRate: 18,
        cgstAmount: 1674,
        sgstAmount: 1674,
        igstAmount: 0,
        totalTax: 3348
      }
    ],
    subTotal: 18600,
    totalDiscount: 0,
    taxableAmount: 18600,
    totalCgst: 1674,
    totalSgst: 1674,
    totalIgst: 0,
    totalTax: 3348,
    roundOff: 0,
    grandTotal: 21948,
    amountPaid: 21948,
    amountDue: 0,
    paymentStatus: 'PAID',
    payments: [
      {
        id: 'pay_142',
        date: '2026-10-25',
        amount: 21948,
        mode: 'CHEQUE',
        referenceNo: 'CHQ-890124',
        notes: 'Cheque cleared'
      }
    ],
    issuedAt: '2026-10-25T11:30:00Z',
    createdAt: '2026-10-25',
    updatedAt: '2026-10-25'
  }
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_01',
    timestamp: '2026-10-25T11:30:00Z',
    entityType: 'INVOICE',
    entityId: 'inv_142',
    action: 'ISSUE',
    details: 'Invoice VT/26-27/0142 issued to Deshmukh Electricals for ₹21,948.00',
    actor: 'Owner'
  },
  {
    id: 'log_02',
    timestamp: '2026-10-26T17:00:00Z',
    entityType: 'INVOICE',
    entityId: 'inv_143',
    action: 'CANCEL',
    details: 'Invoice VT/26-27/0143 cancelled: Wrong item billed',
    actor: 'Owner'
  },
  {
    id: 'log_03',
    timestamp: '2026-10-28T16:20:00Z',
    entityType: 'INVOICE',
    entityId: 'inv_145',
    action: 'ISSUE',
    details: 'Invoice VT/26-27/0145 issued with ₹40,000 partial payment',
    actor: 'Counter Staff'
  },
  {
    id: 'log_04',
    timestamp: '2026-10-29T14:40:00Z',
    entityType: 'INVOICE',
    entityId: 'inv_146',
    action: 'ISSUE',
    details: 'Invoice VT/26-27/0146 issued to Patel Infotech (Gujarat IGST) for ₹1,39,240.00',
    actor: 'Owner'
  },
  {
    id: 'log_05',
    timestamp: '2026-10-30T10:30:00Z',
    entityType: 'INVOICE',
    entityId: 'inv_148',
    action: 'ISSUE',
    details: 'Invoice VT/26-27/0148 issued for ₹50,150.00 via UPI',
    actor: 'Counter Staff'
  }
];

// Initialize storage if empty
export function initStorage(): void {
  const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInit) {
    resetToDemoData();
  }
}

export function resetToDemoData(): void {
  localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(DEFAULT_BUSINESS));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_ITEMS));
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(DEFAULT_INVOICES));
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(DEFAULT_AUDIT_LOGS));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

// Business
export function getBusinessProfile(): BusinessProfile {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.BUSINESS);
  return raw ? JSON.parse(raw) : DEFAULT_BUSINESS;
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(profile));
  logAudit('BUSINESS', profile.id, 'UPDATE', `Updated business profile: ${profile.tradeName}`);
}

// Customers
export function getCustomers(): Customer[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  return raw ? JSON.parse(raw) : [];
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers();
  const index = customers.findIndex(c => c.id === customer.id);
  if (index >= 0) {
    customers[index] = { ...customer, updatedAt: getCurrentDateISO() };
    logAudit('CUSTOMER', customer.id, 'UPDATE', `Updated customer: ${customer.name}`);
  } else {
    customers.push({
      ...customer,
      createdAt: getCurrentDateISO(),
      updatedAt: getCurrentDateISO()
    });
    logAudit('CUSTOMER', customer.id, 'CREATE', `Created new customer: ${customer.name}`);
  }
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
}

// Items
export function getItems(): Item[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
  return raw ? JSON.parse(raw) : [];
}

export function saveItem(item: Item): void {
  const items = getItems();
  const index = items.findIndex(i => i.id === item.id);
  if (index >= 0) {
    items[index] = { ...item, updatedAt: getCurrentDateISO() };
    logAudit('ITEM', item.id, 'UPDATE', `Updated item: ${item.name}`);
  } else {
    items.push({
      ...item,
      createdAt: getCurrentDateISO(),
      updatedAt: getCurrentDateISO()
    });
    logAudit('ITEM', item.id, 'CREATE', `Created item: ${item.name} (SKU: ${item.sku})`);
  }
  localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
}

export function adjustItemStock(itemId: string, delta: number, reason: string): void {
  const items = getItems();
  const item = items.find(i => i.id === itemId);
  if (item && item.type === 'GOODS') {
    item.currentStock = Math.max(0, item.currentStock + delta);
    item.updatedAt = getCurrentDateISO();
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    logAudit('ITEM', itemId, 'UPDATE', `Adjusted stock by ${delta > 0 ? '+' : ''}${delta} (${reason})`);
  }
}

// Invoices
export function getInvoices(): Invoice[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
  return raw ? JSON.parse(raw) : [];
}

export function getInvoiceById(id: string): Invoice | undefined {
  return getInvoices().find(inv => inv.id === id);
}

export function saveDraftInvoice(invoice: Invoice): Invoice {
  const invoices = getInvoices();
  const index = invoices.findIndex(i => i.id === invoice.id);
  const now = new Date().toISOString();
  const updated: Invoice = {
    ...invoice,
    status: 'DRAFT',
    updatedAt: now
  };

  if (index >= 0) {
    invoices[index] = updated;
    logAudit('INVOICE', invoice.id, 'UPDATE', `Updated draft invoice ${invoice.invoiceNumber}`);
  } else {
    invoices.unshift(updated);
    logAudit('INVOICE', invoice.id, 'CREATE', `Created draft invoice ${invoice.invoiceNumber}`);
  }

  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  return updated;
}

export function issueInvoice(invoice: Invoice): Invoice {
  const invoices = getInvoices();
  const now = new Date().toISOString();

  const issuedInvoice: Invoice = {
    ...invoice,
    status: 'ISSUED',
    issuedAt: now,
    updatedAt: now,
    issuedSnapshot: JSON.stringify(invoice)
  };

  const index = invoices.findIndex(i => i.id === invoice.id);
  if (index >= 0) {
    invoices[index] = issuedInvoice;
  } else {
    invoices.unshift(issuedInvoice);
  }
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

  for (const line of issuedInvoice.lines) {
    if (line.itemId) {
      adjustItemStock(line.itemId, -line.quantity, `Issued with ${issuedInvoice.invoiceNumber}`);
    }
  }

  if (issuedInvoice.customerId && issuedInvoice.amountDue > 0) {
    const customers = getCustomers();
    const cust = customers.find(c => c.id === issuedInvoice.customerId);
    if (cust) {
      cust.currentBalance += issuedInvoice.amountDue;
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  }

  const biz = getBusinessProfile();
  biz.nextInvoiceNumber += 1;
  saveBusinessProfile(biz);

  logAudit(
    'INVOICE',
    issuedInvoice.id,
    'ISSUE',
    `Issued Invoice ${issuedInvoice.invoiceNumber} for ₹${issuedInvoice.grandTotal.toFixed(2)} to ${issuedInvoice.customerName}`
  );

  return issuedInvoice;
}

export function recordInvoicePayment(invoiceId: string, payment: Omit<PaymentRecord, 'id'>): Invoice {
  const invoices = getInvoices();
  const invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  if (invoice.status !== 'ISSUED') {
    throw new Error('Payments can only be recorded against ISSUED invoices');
  }

  const payRecord: PaymentRecord = {
    ...payment,
    id: `pay_${Date.now()}`
  };

  const newPayments = [...invoice.payments, payRecord];
  const newAmountPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
  const newAmountDue = Math.max(0, invoice.grandTotal - newAmountPaid);

  let newStatus: Invoice['paymentStatus'] = 'UNPAID';
  if (newAmountDue === 0) newStatus = 'PAID';
  else if (newAmountPaid > 0) newStatus = 'PARTIAL';

  invoice.payments = newPayments;
  invoice.amountPaid = newAmountPaid;
  invoice.amountDue = newAmountDue;
  invoice.paymentStatus = newStatus;
  invoice.updatedAt = new Date().toISOString();

  if (invoice.customerId) {
    const customers = getCustomers();
    const cust = customers.find(c => c.id === invoice.customerId);
    if (cust) {
      cust.currentBalance = Math.max(0, cust.currentBalance - payment.amount);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  }

  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  logAudit(
    'INVOICE',
    invoice.id,
    'PAYMENT',
    `Recorded payment of ₹${payment.amount.toFixed(2)} via ${payment.mode} on invoice ${invoice.invoiceNumber}`
  );

  return invoice;
}

export function cancelInvoice(invoiceId: string, reason: string): Invoice {
  const invoices = getInvoices();
  const invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  if (invoice.status === 'CANCELLED') {
    throw new Error('Invoice is already cancelled');
  }

  invoice.status = 'CANCELLED';
  invoice.cancellationReason = reason;
  invoice.cancelledAt = new Date().toISOString();
  invoice.updatedAt = new Date().toISOString();

  for (const line of invoice.lines) {
    if (line.itemId) {
      adjustItemStock(line.itemId, line.quantity, `Cancelled invoice ${invoice.invoiceNumber}`);
    }
  }

  if (invoice.customerId && invoice.amountDue > 0) {
    const customers = getCustomers();
    const cust = customers.find(c => c.id === invoice.customerId);
    if (cust) {
      cust.currentBalance = Math.max(0, cust.currentBalance - invoice.amountDue);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  }

  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  logAudit('INVOICE', invoice.id, 'CANCEL', `Cancelled invoice ${invoice.invoiceNumber}. Reason: ${reason}`);

  return invoice;
}

export function issueCreditNote(invoiceId: string, noteAmount: number, reason: string): CreditNote {
  const invoices = getInvoices();
  const invoice = invoices.find(i => i.id === invoiceId);
  if (!invoice) throw new Error('Invoice not found');

  const creditNoteId = `cn_${Date.now()}`;
  const noteNumber = `CN-${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}`;

  const creditNote: CreditNote = {
    id: creditNoteId,
    noteNumber,
    originalInvoiceId: invoice.id,
    originalInvoiceNumber: invoice.invoiceNumber,
    date: getCurrentDateISO(),
    reason,
    totalAmount: noteAmount,
    taxReversal: {
      taxableValue: Number((noteAmount / 1.18).toFixed(2)),
      cgstAmount: Number(((noteAmount - noteAmount / 1.18) / 2).toFixed(2)),
      sgstAmount: Number(((noteAmount - noteAmount / 1.18) / 2).toFixed(2)),
      igstAmount: 0
    },
    createdAt: new Date().toISOString()
  };

  invoice.creditNotes = invoice.creditNotes || [];
  invoice.creditNotes.push(creditNote);
  invoice.updatedAt = new Date().toISOString();

  if (invoice.customerId) {
    const customers = getCustomers();
    const cust = customers.find(c => c.id === invoice.customerId);
    if (cust) {
      cust.currentBalance = Math.max(0, cust.currentBalance - noteAmount);
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }
  }

  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  logAudit(
    'INVOICE',
    invoice.id,
    'CREDIT_NOTE',
    `Issued Credit Note ${noteNumber} for ₹${noteAmount.toFixed(2)} against ${invoice.invoiceNumber}`
  );

  return creditNote;
}

export function getAuditLogs(): AuditLog[] {
  initStorage();
  const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
  return raw ? JSON.parse(raw) : [];
}

export function logAudit(
  entityType: AuditLog['entityType'],
  entityId: string,
  action: AuditLog['action'],
  details: string,
  actor = 'User'
): void {
  const logs = getAuditLogs();
  const log: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    entityType,
    entityId,
    action,
    details,
    actor
  };
  logs.unshift(log);
  if (logs.length > 500) logs.pop();
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
}

export function createDataExport(): string {
  const payload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    business: getBusinessProfile(),
    customers: getCustomers(),
    items: getItems(),
    invoices: getInvoices(),
    auditLogs: getAuditLogs()
  };
  return JSON.stringify(payload, null, 2);
}

export function restoreDataBackup(jsonString: string): { success: boolean; message: string; recordCounts?: Record<string, number> } {
  try {
    const data = JSON.parse(jsonString);
    if (!data.business || !data.customers || !data.items || !data.invoices) {
      return { success: false, message: 'Invalid backup format: Missing required collections.' };
    }

    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(data.business));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(data.items));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(data.invoices));
    if (data.auditLogs) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data.auditLogs));
    }
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    logAudit('BACKUP', 'restore', 'RESTORE', `Restored backup containing ${data.invoices.length} invoices`);

    return {
      success: true,
      message: 'Backup restored successfully!',
      recordCounts: {
        customers: data.customers.length,
        items: data.items.length,
        invoices: data.invoices.length
      }
    };
  } catch (err: any) {
    return { success: false, message: `Failed to restore: ${err.message || 'Invalid JSON'}` };
  }
}
