import { formatCurrency, formatDate } from './formatters';
import { getCustomers, getInvoices, getItems } from './storage';

export interface AIQueryResponse {
  query: string;
  matchedIntent: string;
  periodDescription: string;
  calculationBasis: string; // e.g. "Invoice issuance date, non-cancelled invoices"
  headlineAnswer: string;
  detailedExplanation: string;
  metrics: {
    label: string;
    value: string;
  }[];
  sourceTransactions: {
    id: string;
    title: string;
    subtitle: string;
    amount: string;
    status: string;
  }[];
  suggestedFollowUps: string[];
}

/**
 * Deterministic AI Business Q&A Engine
 * Strictly grounded in real transaction books, returns exact underlying IDs and calculation basis.
 */
export function queryBusinessAssistant(rawQuery: string): AIQueryResponse {
  const q = rawQuery.trim().toLowerCase();
  const invoices = getInvoices().filter(inv => inv.status !== 'CANCELLED');
  const items = getItems();
  const customers = getCustomers();

  // Helper date matchers
  const todayStr = '2026-10-31'; // PRD timestamp October 2026

  // 1. RECEIVABLES & UNPAID / OVERDUE
  if (
    q.includes('owe') ||
    q.includes('unpaid') ||
    q.includes('due') ||
    q.includes('overdue') ||
    q.includes('pending payment') ||
    q.includes('receivable')
  ) {
    const unpaidInvoices = invoices.filter(inv => inv.amountDue > 0);
    const totalDue = unpaidInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const overdueInvoices = unpaidInvoices.filter(inv => inv.dueDate && inv.dueDate < todayStr);
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);

    const sources = unpaidInvoices.map(inv => ({
      id: inv.id,
      title: `${inv.invoiceNumber} — ${inv.customerName}`,
      subtitle: `Due: ${formatDate(inv.dueDate)} | Status: ${inv.paymentStatus}`,
      amount: formatCurrency(inv.amountDue),
      status: inv.dueDate < todayStr ? 'OVERDUE' : inv.paymentStatus
    }));

    return {
      query: rawQuery,
      matchedIntent: 'RECEIVABLES_AUDIT',
      periodDescription: 'As of Today (31 Oct 2026)',
      calculationBasis: 'Sum of amountDue across all issued, non-cancelled invoices',
      headlineAnswer: `You have ${formatCurrency(totalDue)} in outstanding receivables across ${unpaidInvoices.length} invoices.`,
      detailedExplanation: overdueAmount > 0
        ? `Of this amount, ${formatCurrency(overdueAmount)} is critically overdue past the payment terms date.`
        : 'All pending invoices are currently within their credit terms period.',
      metrics: [
        { label: 'Total Receivables', value: formatCurrency(totalDue) },
        { label: 'Overdue Amount', value: formatCurrency(overdueAmount) },
        { label: 'Unpaid Invoices', value: String(unpaidInvoices.length) }
      ],
      sourceTransactions: sources,
      suggestedFollowUps: [
        'Which customer owes the most?',
        'How much GST did I collect this month?',
        'Show low stock items'
      ]
    };
  }

  // 2. GST TAX LIABILITY
  if (
    q.includes('gst') ||
    q.includes('tax') ||
    q.includes('cgst') ||
    q.includes('sgst') ||
    q.includes('igst')
  ) {
    const totalCgst = invoices.reduce((sum, inv) => sum + inv.totalCgst, 0);
    const totalSgst = invoices.reduce((sum, inv) => sum + inv.totalSgst, 0);
    const totalIgst = invoices.reduce((sum, inv) => sum + inv.totalIgst, 0);
    const totalTax = totalCgst + totalSgst + totalIgst;

    const sources = invoices.map(inv => ({
      id: inv.id,
      title: `${inv.invoiceNumber} (${inv.customerName})`,
      subtitle: `Type: ${inv.supplyType === 'INTRA_STATE' ? 'Intra-State (CGST+SGST)' : 'Inter-State (IGST)'}`,
      amount: formatCurrency(inv.totalTax),
      status: inv.status
    }));

    return {
      query: rawQuery,
      matchedIntent: 'TAX_LIABILITY_SUMMARY',
      periodDescription: 'Current Financial Year (2026-27)',
      calculationBasis: 'Sum of line-level CGST, SGST, and IGST on issued invoices',
      headlineAnswer: `Your total GST tax liability is ${formatCurrency(totalTax)}.`,
      detailedExplanation: `Breakdown: CGST is ${formatCurrency(totalCgst)}, SGST is ${formatCurrency(totalSgst)}, and Interstate IGST is ${formatCurrency(totalIgst)}.`,
      metrics: [
        { label: 'Total GST Collected', value: formatCurrency(totalTax) },
        { label: 'CGST (Central)', value: formatCurrency(totalCgst) },
        { label: 'SGST (State)', value: formatCurrency(totalSgst) },
        { label: 'IGST (Inter-State)', value: formatCurrency(totalIgst) }
      ],
      sourceTransactions: sources,
      suggestedFollowUps: [
        'How much did I sell this month?',
        'Who owes me money?',
        'Export GSTR-1 report'
      ]
    };
  }

  // 3. LOW STOCK / INVENTORY
  if (
    q.includes('stock') ||
    q.includes('inventory') ||
    q.includes('low') ||
    q.includes('reorder') ||
    q.includes('exhausted')
  ) {
    const lowStockItems = items.filter(
      item => item.type === 'GOODS' && item.currentStock <= item.lowStockThreshold
    );

    const sources = lowStockItems.map(item => ({
      id: item.id,
      title: `${item.name} (${item.sku})`,
      subtitle: `Min Threshold: ${item.lowStockThreshold} ${item.unit}`,
      amount: `${item.currentStock} ${item.unit} left`,
      status: item.currentStock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
    }));

    return {
      query: rawQuery,
      matchedIntent: 'LOW_STOCK_AUDIT',
      periodDescription: 'Real-time stock on hand',
      calculationBasis: 'currentStock <= lowStockThreshold for all GOODS items',
      headlineAnswer: lowStockItems.length > 0
        ? `There are ${lowStockItems.length} items currently at or below their reorder threshold.`
        : 'All stock levels are healthy! No items are currently below reorder thresholds.',
      detailedExplanation: lowStockItems.length > 0
        ? `Critical items needing replenishment include: ${lowStockItems.map(i => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}.`
        : 'All catalog goods have sufficient safety buffers.',
      metrics: [
        { label: 'Low Stock Items', value: String(lowStockItems.length) },
        { label: 'Total Catalog Items', value: String(items.length) }
      ],
      sourceTransactions: sources,
      suggestedFollowUps: [
        'What are my top selling items?',
        'How much did I sell this month?',
        'Who owes me money?'
      ]
    };
  }

  // 4. TOP SELLING ITEMS
  if (
    q.includes('top item') ||
    q.includes('selling') ||
    q.includes('popular') ||
    q.includes('best seller') ||
    q.includes('product')
  ) {
    const itemSales: Record<string, { name: string; qty: number; revenue: number; unit: string }> = {};

    for (const inv of invoices) {
      for (const line of inv.lines) {
        if (!itemSales[line.itemId]) {
          itemSales[line.itemId] = {
            name: line.itemName,
            qty: 0,
            revenue: 0,
            unit: line.unit
          };
        }
        itemSales[line.itemId].qty += line.quantity;
        itemSales[line.itemId].revenue += line.total;
      }
    }

    const sorted = Object.entries(itemSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    const top = sorted.slice(0, 5);

    const sources = top.map(item => ({
      id: item.id,
      title: item.name,
      subtitle: `Sold: ${item.qty} ${item.unit}`,
      amount: formatCurrency(item.revenue),
      status: 'TOP_SELLER'
    }));

    return {
      query: rawQuery,
      matchedIntent: 'TOP_SELLING_ITEMS',
      periodDescription: 'Current Financial Year (2026-27)',
      calculationBasis: 'Aggregated line-item quantity and revenue from issued invoices',
      headlineAnswer: top.length > 0
        ? `Your highest revenue generator is "${top[0].name}" with ${formatCurrency(top[0].revenue)} in total sales.`
        : 'No sales records available yet.',
      detailedExplanation: `Top items contribute significantly to your gross billings. Review the ranked list below for quantities and revenue generated.`,
      metrics: [
        { label: 'Top Item', value: top[0]?.name || '-' },
        { label: 'Top Item Revenue', value: formatCurrency(top[0]?.revenue || 0) },
        { label: 'Total Distinct Items Sold', value: String(sorted.length) }
      ],
      sourceTransactions: sources,
      suggestedFollowUps: [
        'How much did I sell this month?',
        'Who owes me money?',
        'Show low stock items'
      ]
    };
  }

  // 5. SALES & REVENUE (Default / General Sales Query)
  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalInvoices = invoices.length;
  const avgTicket = totalInvoices > 0 ? totalSales / totalInvoices : 0;

  const sources = invoices.slice(0, 5).map(inv => ({
    id: inv.id,
    title: `${inv.invoiceNumber} — ${inv.customerName}`,
    subtitle: `Date: ${formatDate(inv.date)} | Mode: ${inv.payments[0]?.mode || 'UNPAID'}`,
    amount: formatCurrency(inv.grandTotal),
    status: inv.paymentStatus
  }));

  return {
    query: rawQuery,
    matchedIntent: 'SALES_REVENUE_OVERVIEW',
    periodDescription: 'Current Financial Year (2026-27)',
    calculationBasis: 'Sum of grandTotal on all issued, non-cancelled invoices',
    headlineAnswer: `Your gross sales total is ${formatCurrency(totalSales)} across ${totalInvoices} issued invoices.`,
    detailedExplanation: `Average invoice ticket size is ${formatCurrency(avgTicket)}. ${invoices.filter(i => i.paymentStatus === 'PAID').length} invoices are fully settled.`,
    metrics: [
      { label: 'Total Gross Sales', value: formatCurrency(totalSales) },
      { label: 'Invoices Issued', value: String(totalInvoices) },
      { label: 'Average Ticket', value: formatCurrency(avgTicket) }
    ],
    sourceTransactions: sources,
    suggestedFollowUps: [
      'Who hasn’t paid me?',
      'How much GST did I collect?',
      'Which items are running low on stock?'
    ]
  };
}
