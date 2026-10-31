import {
  GSTSupplyType,
  InvoiceLine,
  TaxBreakdownRow,
  TaxMode
} from '../types';

/**
 * Deterministic GST Calculation Engine
 * 
 * Rules:
 * 1. Arithmetic is performed in integer paise (1 Rupee = 100 paise) to eliminate floating-point drift.
 * 2. If Seller State == Customer State -> INTRA_STATE: Tax is split equally into CGST (half) and SGST (half).
 * 3. If Seller State != Customer State -> INTER_STATE: Tax is all IGST (full rate).
 * 4. Tax-Exclusive: Taxable Value = (Unit Price * Qty) - Discount. Tax = Taxable Value * Rate.
 * 5. Tax-Inclusive: Gross Amount = (Unit Price * Qty) - Discount.
 *    Taxable Value = Gross Amount / (1 + Rate / 100). Tax = Gross Amount - Taxable Value.
 * 6. Line total = Taxable Value + CGST + SGST + IGST.
 * 7. Invoice Total = Sum of line totals + Round-off adjustment.
 */

export function determineSupplyType(sellerStateCode: string, customerStateCode: string): GSTSupplyType {
  const seller = (sellerStateCode || '').trim();
  const customer = (customerStateCode || '').trim();
  if (!seller || !customer) return 'INTRA_STATE';
  return seller === customer ? 'INTRA_STATE' : 'INTER_STATE';
}

export interface LineCalculationInput {
  quantity: number;
  unitPrice: number; // in Rupees
  discountPercent: number; // e.g. 5 for 5%
  taxMode: TaxMode;
  gstRate: number; // e.g. 18 for 18%
  supplyType: GSTSupplyType;
}

export interface LineCalculationResult {
  discountAmount: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  total: number;
}

// Helper to convert rupees to paise integer
export const toPaise = (rupees: number): number => Math.round((rupees || 0) * 100);
// Helper to convert paise integer back to rupees with 2 decimal precision
export const toRupees = (paise: number): number => Number((paise / 100).toFixed(2));

export function calculateLineItem(input: LineCalculationInput): LineCalculationResult {
  const qty = Math.max(0, input.quantity || 0);
  const unitPricePaise = toPaise(input.unitPrice || 0);
  const rawTotalPaise = qty * unitPricePaise;

  // Discount calculation
  const discountPct = Math.min(100, Math.max(0, input.discountPercent || 0));
  const discountPaise = Math.round((rawTotalPaise * discountPct) / 100);
  const netAmountPaise = Math.max(0, rawTotalPaise - discountPaise);

  const gstRate = Math.max(0, input.gstRate || 0);
  const isIntra = input.supplyType === 'INTRA_STATE';

  let taxablePaise = 0;
  let taxPaise = 0;

  if (input.taxMode === 'INCLUSIVE' && gstRate > 0) {
    // Net amount already includes GST
    // Taxable = Net / (1 + Rate / 100) = (Net * 100) / (100 + Rate)
    taxablePaise = Math.round((netAmountPaise * 10000) / (10000 + Math.round(gstRate * 100)));
    taxPaise = netAmountPaise - taxablePaise;
  } else {
    // Tax Exclusive
    taxablePaise = netAmountPaise;
    taxPaise = Math.round((taxablePaise * Math.round(gstRate * 100)) / 10000);
  }

  let cgstRate = 0;
  let cgstPaise = 0;
  let sgstRate = 0;
  let sgstPaise = 0;
  let igstRate = 0;
  let igstPaise = 0;

  if (isIntra) {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    // Split tax evenly
    cgstPaise = Math.round(taxPaise / 2);
    sgstPaise = taxPaise - cgstPaise; // ensure no lost paise
  } else {
    igstRate = gstRate;
    igstPaise = taxPaise;
  }

  const lineTotalPaise = taxablePaise + cgstPaise + sgstPaise + igstPaise;

  return {
    discountAmount: toRupees(discountPaise),
    taxableValue: toRupees(taxablePaise),
    cgstRate,
    cgstAmount: toRupees(cgstPaise),
    sgstRate,
    sgstAmount: toRupees(sgstPaise),
    igstRate,
    igstAmount: toRupees(igstPaise),
    total: toRupees(lineTotalPaise)
  };
}

export interface InvoiceAggregates {
  subTotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  hsnSummary: TaxBreakdownRow[];
}

export function calculateInvoiceTotals(lines: InvoiceLine[]): InvoiceAggregates {
  let subTotalPaise = 0;
  let totalDiscountPaise = 0;
  let taxablePaise = 0;
  let totalCgstPaise = 0;
  let totalSgstPaise = 0;
  let totalIgstPaise = 0;

  const hsnMap: Record<string, {
    hsnSac: string;
    taxablePaise: number;
    gstRate: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
  }> = {};

  for (const line of lines) {
    const rawLinePaise = toPaise(line.quantity * line.unitPrice);
    subTotalPaise += rawLinePaise;
    totalDiscountPaise += toPaise(line.discountAmount);
    taxablePaise += toPaise(line.taxableValue);
    totalCgstPaise += toPaise(line.cgstAmount);
    totalSgstPaise += toPaise(line.sgstAmount);
    totalIgstPaise += toPaise(line.igstAmount);

    const key = `${line.hsnSac || 'OTHER'}_${line.gstRate}`;
    if (!hsnMap[key]) {
      hsnMap[key] = {
        hsnSac: line.hsnSac || 'OTHER',
        taxablePaise: 0,
        gstRate: line.gstRate,
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise: 0
      };
    }
    hsnMap[key].taxablePaise += toPaise(line.taxableValue);
    hsnMap[key].cgstPaise += toPaise(line.cgstAmount);
    hsnMap[key].sgstPaise += toPaise(line.sgstAmount);
    hsnMap[key].igstPaise += toPaise(line.igstAmount);
  }

  const totalTaxPaise = totalCgstPaise + totalSgstPaise + totalIgstPaise;
  const unroundedGrandTotalPaise = taxablePaise + totalTaxPaise;

  // Round off to nearest whole rupee
  const roundedGrandTotalPaise = Math.round(unroundedGrandTotalPaise / 100) * 100;
  const roundOffPaise = roundedGrandTotalPaise - unroundedGrandTotalPaise;

  const hsnSummary: TaxBreakdownRow[] = Object.values(hsnMap).map(row => ({
    hsnSac: row.hsnSac,
    taxableValue: toRupees(row.taxablePaise),
    gstRate: row.gstRate,
    cgstAmount: toRupees(row.cgstPaise),
    sgstAmount: toRupees(row.sgstPaise),
    igstAmount: toRupees(row.igstPaise),
    totalTax: toRupees(row.cgstPaise + row.sgstPaise + row.igstPaise)
  }));

  return {
    subTotal: toRupees(subTotalPaise),
    totalDiscount: toRupees(totalDiscountPaise),
    taxableAmount: toRupees(taxablePaise),
    totalCgst: toRupees(totalCgstPaise),
    totalSgst: toRupees(totalSgstPaise),
    totalIgst: toRupees(totalIgstPaise),
    totalTax: toRupees(totalTaxPaise),
    roundOff: toRupees(roundOffPaise),
    grandTotal: toRupees(roundedGrandTotalPaise),
    hsnSummary
  };
}
