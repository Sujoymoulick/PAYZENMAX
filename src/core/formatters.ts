// Indian Currency, Words, Dates and GSTIN Validation Utilities

/**
 * Format a number as Indian Currency string: ₹ 1,23,456.78
 */
export function formatCurrency(amount: number | undefined | null, includeSymbol = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return includeSymbol ? '₹ 0.00' : '0.00';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const fixed = absAmount.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');

  // Indian numbering system: last 3 digits, then groups of 2
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const result = `${isNegative ? '-' : ''}${formattedInteger}.${decimalPart}`;
  return includeSymbol ? `₹ ${result}` : result;
}

/**
 * Convert number to words in Indian Numbering System (Lakhs & Crores)
 * e.g. 15420.50 -> "Rupees Fifteen Thousand Four Hundred Twenty and Fifty Paise Only"
 */
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(num: number): string {
  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  if (num > 0) {
    str += ones[num] + ' ';
  }
  return str.trim();
}

export function numberToWordsIndian(amount: number): string {
  if (!amount || amount === 0) return 'Zero Rupees Only';

  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let remaining = rupees;
  let words = '';

  const crores = Math.floor(remaining / 10000000);
  remaining %= 10000000;

  const lakhs = Math.floor(remaining / 100000);
  remaining %= 100000;

  const thousands = Math.floor(remaining / 1000);
  remaining %= 1000;

  if (crores > 0) {
    words += convertBelowThousand(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertBelowThousand(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertBelowThousand(thousands) + ' Thousand ';
  }
  if (remaining > 0) {
    words += convertBelowThousand(remaining) + ' ';
  }

  words = words.trim();
  let result = words.length > 0 ? `Rupees ${words}` : '';

  if (paise > 0) {
    const paiseWords = convertBelowThousand(paise);
    result += (result ? ' and ' : '') + `${paiseWords} Paise`;
  }

  return (result + ' Only').replace(/\s+/g, ' ');
}

/**
 * Validate GSTIN (15 characters: 2 state + 10 PAN + 1 entity + 1 'Z' + 1 checksum)
 * Regex: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
 */
export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  const cleaned = gstin.trim().toUpperCase();
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(cleaned);
}

/**
 * Extract State Code from GSTIN (first 2 digits)
 */
export function getStateCodeFromGSTIN(gstin: string): string | null {
  if (!gstin || gstin.trim().length < 2) return null;
  const code = gstin.trim().substring(0, 2);
  return /^[0-9]{2}$/.test(code) ? code : null;
}

/**
 * Format ISO date string YYYY-MM-DD to DD-MM-YYYY or readable string
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '-';
  try {
    const [year, month, day] = isoDate.split('T')[0].split('-');
    if (!year || !month || !day) return isoDate;
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

/**
 * Get current date in YYYY-MM-DD
 */
export function getCurrentDateISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate sequential invoice number (e.g. "INV-2627-0042")
 * Validates maximum 16 characters per CBIC GST rules!
 */
export function generateInvoiceNumber(prefix: string, sequenceNumber: number): string {
  const cleanPrefix = (prefix || 'INV/26-27/').trim();
  const seqPadded = String(sequenceNumber).padStart(4, '0');
  const candidate = `${cleanPrefix}${seqPadded}`;
  if (candidate.length > 16) {
    // Truncate prefix if needed to respect 16-character limit
    const allowedPrefixLen = 16 - seqPadded.length;
    return `${cleanPrefix.substring(0, allowedPrefixLen)}${seqPadded}`;
  }
  return candidate;
}
