import React, { useState } from 'react';
import { Mic, ArrowRight } from 'lucide-react';
import { Invoice, Item } from '../../types';
import { DashboardPeriod } from '../Layout/Header';

interface DashboardViewProps {
  invoices: Invoice[];
  items: Item[];
  activePeriod: DashboardPeriod;
  onSelectInvoice: (invoice: Invoice) => void;
  onNavigateToInvoices: () => void;
  onNavigateToItems: () => void;
  onNavigateToReports: (reportType?: string) => void;
  onOpenAssistantWithQuery: (query: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  items,
  activePeriod,
  onSelectInvoice,
  onNavigateToInvoices,
  onNavigateToItems,
  onNavigateToReports,
  onOpenAssistantWithQuery
}) => {
  // Explain panel toggle state: 'sales' | 'gst' | 'due' | null
  const [explainMetric, setExplainMetric] = useState<'sales' | 'gst' | 'due' | null>(null);

  // Ask your books active question index
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);

  // INR currency formatter matching design
  const inr = (n: number) => '₹' + Number(Math.round(n)).toLocaleString('en-IN');

  // Period data definitions matching design reference
  const periodData: Record<
    DashboardPeriod,
    {
      label: string;
      scope: string;
      sales: number;
      taxable: number;
      c: number;
      s: number;
      i: number;
      inv: number;
      cancelled: number;
      range: string;
    }
  > = {
    today: {
      label: 'Today',
      scope: '31 Oct',
      sales: 12040,
      taxable: 10204,
      c: 918,
      s: 918,
      i: 0,
      inv: 3,
      cancelled: 0,
      range: '31 Oct 2026'
    },
    week: {
      label: 'This week',
      scope: '25–31 Oct',
      sales: 348320,
      taxable: 295186,
      c: 12626,
      s: 12626,
      i: 27882,
      inv: 14,
      cancelled: 1,
      range: '25 Oct – 31 Oct 2026'
    },
    month: {
      label: 'This month',
      scope: 'October',
      sales: 996240,
      taxable: 844271,
      c: 46769,
      s: 46769,
      i: 58431,
      inv: 48,
      cancelled: 2,
      range: '1 Oct – 31 Oct 2026'
    },
    fy: {
      label: 'FY 2026-27',
      scope: 'Apr–Oct',
      sales: 5842700,
      taxable: 4951441,
      c: 289389,
      s: 289389,
      i: 312481,
      inv: 312,
      cancelled: 6,
      range: '1 Apr – 31 Oct 2026'
    }
  };

  const cur = periodData[activePeriod];
  const gstTotal = cur.c + cur.s + cur.i;
  const due = 231486;

  // Explain details definition
  const explainDetails = {
    sales: {
      title: 'Sales · ' + cur.label,
      formula: 'Σ invoice total (incl. GST, after round-off)',
      filters: [
        { k: 'Date range', v: cur.range },
        { k: 'Status', v: 'Issued, paid, part paid, unpaid' },
        { k: 'Excluded', v: cur.cancelled + ' cancelled · credit notes' }
      ],
      rows: [
        { k: 'Taxable value', v: inr(cur.taxable), w: 'font-normal' },
        { k: 'GST', v: inr(gstTotal), w: 'font-normal' },
        { k: 'Total', v: inr(cur.sales), w: 'font-semibold' }
      ],
      linkText: `View ${cur.inv - cur.cancelled} invoices`,
      action: onNavigateToInvoices
    },
    gst: {
      title: 'Output GST · ' + cur.label,
      formula: 'Same state (27) → CGST + SGST · Other state → IGST',
      filters: [
        { k: 'Date range', v: cur.range },
        { k: 'Seller state', v: 'Maharashtra (27)' },
        { k: 'Excluded', v: 'Cancelled invoices' }
      ],
      rows: [
        { k: 'CGST', v: inr(cur.c), w: 'font-normal' },
        { k: 'SGST', v: inr(cur.s), w: 'font-normal' },
        { k: 'IGST', v: inr(cur.i), w: 'font-normal' },
        { k: 'Total liability', v: inr(gstTotal), w: 'font-semibold' }
      ],
      linkText: 'Open HSN summary',
      action: () => onNavigateToReports('GSTR1')
    },
    due: {
      title: 'Receivables · as of 31 Oct 2026',
      formula: 'Σ (invoice total − payments received) on unpaid / part-paid',
      filters: [
        { k: 'Status', v: 'Unpaid, part paid' },
        { k: 'Customers', v: '6' },
        { k: 'Period', v: 'All open invoices' }
      ],
      rows: [
        { k: 'Invoiced', v: inr(287696), w: 'font-normal' },
        { k: 'Received', v: '− ' + inr(56210), w: 'font-normal' },
        { k: 'Outstanding', v: inr(due), w: 'font-semibold' }
      ],
      linkText: 'View 9 open invoices',
      action: () => onNavigateToReports('RECEIVABLES')
    }
  };

  const activeExplain = explainMetric ? explainDetails[explainMetric] : null;

  // Chart daily sales figures for 31 days of October
  const dailyVals = [
    24, 0, 31, 0, 28, 36, 22, 41, 27, 33, 0, 30, 25, 38, 44, 29, 35, 0, 26, 31, 47, 28, 34, 39,
    0, 22, 40, 76, 145, 53, 12
  ];

  // GST percentage calculations
  const cPct = (cur.c / gstTotal) * 100;
  const sPct = (cur.s / gstTotal) * 100;
  const iPct = (cur.i / gstTotal) * 100;

  // Receivables aging data
  const agingData = [
    { label: '0–30 days', value: 177276, color: '#1B5E3B' },
    { label: '31–60 days', value: 32940, color: '#C2701E' },
    { label: '61–90 days', value: 14120, color: '#A14A0B' },
    { label: '90+ days', value: 7150, color: '#7A2E05' }
  ];

  // Ask your books Q&A items
  const qaItems = [
    {
      label: "Who hasn't paid me?",
      text:
        "6 customers owe " +
        inr(due) +
        ". Largest is Patel Infotech Pvt Ltd at " +
        inr(139240) +
        ", due 28 Nov. Kulkarni Systems has " +
        inr(35756) +
        " left on a part-paid bill.",
      cites: ['VT/26-27/0146', 'VT/26-27/0145']
    },
    {
      label: 'Sales this month',
      text:
        'October sales are ' +
        inr(996240) +
        ' across 46 issued invoices (2 cancelled bills excluded). Best day was 29 Oct at ' +
        inr(145000) +
        '.',
      cites: ['Sales register · Oct']
    },
    {
      label: 'Top selling items',
      text:
        'By value in October: Hikvision 4MP Dome Camera (' +
        inr(186400) +
        '), Dell Latitude 3440 (' +
        inr(158000) +
        '), Cat6 Cable 305m (' +
        inr(92300) +
        ').',
      cites: ['Item report · Oct']
    },
    {
      label: 'GST liability',
      text:
        'Output GST for October is ' +
        inr(151969) +
        ': CGST ' +
        inr(46769) +
        ', SGST ' +
        inr(46769) +
        ', IGST ' +
        inr(58431) +
        '. GSTR-1 is due 11 Nov.',
      cites: ['HSN summary · Oct', 'GSTR-1 draft']
    }
  ];

  const currentQA = qaItems[activeQuestionIdx];

  // Status pill colors mapping from Main.dc.html
  const statusPills: Record<string, { bg: string; fg: string }> = {
    PAID: { bg: '#E7F0EA', fg: '#1B5E3B' },
    UNPAID: { bg: '#FBEEE3', fg: '#A14A0B' },
    PARTIAL: { bg: '#FDF4DC', fg: '#7A5300' },
    CANCELLED: { bg: '#EEEEEA', fg: '#4A4D53' }
  };

  // Low stock items
  const lowStockCatalog = items
    .filter(i => i.type === 'GOODS' && i.currentStock <= i.lowStockThreshold)
    .slice(0, 4);

  const exportCSV = () => {
    onNavigateToReports('SALES_REGISTER');
  };

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* 1. KPI Row (4 Cards) */}
      <section
        aria-label="Key figures"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {/* Sales KPI */}
        <div
          className={`bg-[#FFFFFF] border rounded-[10px] p-[16px_18px] flex flex-col gap-1.5 transition-all ${
            explainMetric === 'sales' ? 'border-[#17181A] shadow-xs' : 'border-[#E4E3DE]'
          }`}
        >
          <div className="flex justify-between items-center gap-2">
            <span className="text-[13px] text-[#5E6168]">Sales</span>
            <span className="text-[11px] text-[#5E6168]">{cur.scope}</span>
          </div>
          <div className="text-[26px] font-semibold tracking-[-0.02em] text-[#17181A]">
            {inr(cur.sales)}
          </div>
          <div className="text-[12px] text-[#5E6168] min-h-[18px]">
            {inr(cur.taxable)} taxable + {inr(gstTotal)} GST
          </div>
          <button
            type="button"
            onClick={() => setExplainMetric(explainMetric === 'sales' ? null : 'sales')}
            aria-expanded={explainMetric === 'sales'}
            className="self-start mt-1 min-h-[32px] p-0 border-0 bg-transparent text-[#1B5E3B] hover:text-[#123F28] text-[12px] font-medium cursor-pointer underline underline-offset-[3px]"
          >
            {explainMetric === 'sales' ? 'Hide calculation' : 'How is this calculated?'}
          </button>
        </div>

        {/* GST Collected KPI */}
        <div
          className={`bg-[#FFFFFF] border rounded-[10px] p-[16px_18px] flex flex-col gap-1.5 transition-all ${
            explainMetric === 'gst' ? 'border-[#17181A] shadow-xs' : 'border-[#E4E3DE]'
          }`}
        >
          <div className="flex justify-between items-center gap-2">
            <span className="text-[13px] text-[#5E6168]">GST collected</span>
            <span className="text-[11px] text-[#5E6168]">{cur.scope}</span>
          </div>
          <div className="text-[26px] font-semibold tracking-[-0.02em] text-[#17181A]">
            {inr(gstTotal)}
          </div>
          <div className="text-[12px] text-[#5E6168] min-h-[18px]">
            CGST {inr(cur.c)} · SGST {inr(cur.s)} · IGST {inr(cur.i)}
          </div>
          <button
            type="button"
            onClick={() => setExplainMetric(explainMetric === 'gst' ? null : 'gst')}
            aria-expanded={explainMetric === 'gst'}
            className="self-start mt-1 min-h-[32px] p-0 border-0 bg-transparent text-[#1B5E3B] hover:text-[#123F28] text-[12px] font-medium cursor-pointer underline underline-offset-[3px]"
          >
            {explainMetric === 'gst' ? 'Hide calculation' : 'How is this calculated?'}
          </button>
        </div>

        {/* Receivables Due KPI */}
        <div
          className={`bg-[#FFFFFF] border rounded-[10px] p-[16px_18px] flex flex-col gap-1.5 transition-all ${
            explainMetric === 'due' ? 'border-[#17181A] shadow-xs' : 'border-[#E4E3DE]'
          }`}
        >
          <div className="flex justify-between items-center gap-2">
            <span className="text-[13px] text-[#5E6168]">Receivables due</span>
            <span className="text-[11px] text-[#5E6168]">as of today</span>
          </div>
          <div className="text-[26px] font-semibold tracking-[-0.02em] text-[#A14A0B]">
            {inr(due)}
          </div>
          <div className="text-[12px] text-[#5E6168] min-h-[18px]">
            6 customers · {inr(54210)} over 30 days
          </div>
          <button
            type="button"
            onClick={() => setExplainMetric(explainMetric === 'due' ? null : 'due')}
            aria-expanded={explainMetric === 'due'}
            className="self-start mt-1 min-h-[32px] p-0 border-0 bg-transparent text-[#1B5E3B] hover:text-[#123F28] text-[12px] font-medium cursor-pointer underline underline-offset-[3px]"
          >
            {explainMetric === 'due' ? 'Hide calculation' : 'How is this calculated?'}
          </button>
        </div>

        {/* Invoices Issued KPI */}
        <div className="bg-[#FFFFFF] border border-[#E4E3DE] rounded-[10px] p-[16px_18px] flex flex-col gap-1.5">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[13px] text-[#5E6168]">Invoices issued</span>
            <span className="text-[11px] text-[#5E6168]">{cur.scope}</span>
          </div>
          <div className="text-[26px] font-semibold tracking-[-0.02em] text-[#17181A]">
            {cur.inv}
          </div>
          <div className="text-[12px] text-[#5E6168] min-h-[18px]">
            {cur.cancelled} cancelled · 1 credit note
          </div>
          <button
            type="button"
            onClick={onNavigateToInvoices}
            className="self-start mt-1 min-h-[32px] p-0 border-0 bg-transparent text-[#1B5E3B] hover:text-[#123F28] text-[12px] font-medium cursor-pointer underline underline-offset-[3px]"
          >
            View all invoices
          </button>
        </div>
      </section>

      {/* 2. Interactive Explain Panel (Appears on toggle) */}
      {activeExplain && (
        <section
          aria-label="Calculation basis"
          className="bg-[#FFFFFF] border border-[#17181A] rounded-[10px] p-[18px_20px] grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 animate-fade-in"
        >
          {/* Col 1 */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#5E6168]">
              How this is calculated
            </div>
            <div className="font-semibold text-[15px] text-[#17181A]">
              {activeExplain.title}
            </div>
            <div className="font-mono text-[12px] bg-[#F6F6F3] rounded-md p-[10px_12px] text-[#17181A]">
              {activeExplain.formula}
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#5E6168]">
              Filters applied
            </div>
            {activeExplain.filters.map(f => (
              <div
                key={f.k}
                className="flex justify-between gap-3 text-[13px] border-b border-dashed border-[#E4E3DE] pb-1.5"
              >
                <span className="text-[#5E6168]">{f.k}</span>
                <span className="text-[#17181A] font-medium">{f.v}</span>
              </div>
            ))}
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-1.5">
            <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#5E6168]">
              Breakdown
            </div>
            {activeExplain.rows.map(r => (
              <div key={r.k} className="flex justify-between gap-3 text-[13px]">
                <span className="text-[#5E6168]">{r.k}</span>
                <span className={`${r.w} text-[#17181A]`}>{r.v}</span>
              </div>
            ))}
            <button
              onClick={activeExplain.action}
              className="mt-1.5 text-[13px] font-medium text-[#1B5E3B] hover:text-[#123F28] underline underline-offset-[3px] text-left cursor-pointer"
            >
              {activeExplain.linkText}
            </button>
          </div>
        </section>
      )}

      {/* 3. Middle Row: Chart (Span 2) + GST Liability Card */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Chart Column (Span 2) */}
        <div className="lg:col-span-2 min-w-0 bg-[#FFFFFF] border border-[#E4E3DE] rounded-[10px] p-[18px_20px] flex flex-col gap-3.5">
          <div className="flex justify-between items-baseline flex-wrap gap-2">
            <h2 className="m-0 text-[15px] font-semibold text-[#17181A]">
              Daily sales · October 2026
            </h2>
            <span className="text-[12px] text-[#5E6168]">
              Invoice value incl. GST · cancelled bills excluded
            </span>
          </div>

          <div className="flex gap-2.5 h-[220px]">
            {/* Y-axis ticks */}
            <div
              aria-hidden="true"
              className="flex flex-col justify-between text-[11px] text-[#5E6168] text-right w-10 pb-[22px] font-mono select-none"
            >
              <span>₹1.5L</span>
              <span>₹1L</span>
              <span>₹50k</span>
              <span>0</span>
            </div>

            {/* Bars container */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div
                role="img"
                aria-label="Bar chart of daily sales in October 2026. Highest day 29 October at ₹1,45,000."
                className="flex-1 grid grid-cols-[repeat(31,minmax(0,1fr))] gap-1 items-end border-b border-[#DAD9D3]"
                style={{
                  backgroundImage: 'linear-gradient(#EFEEEA 1px, transparent 1px)',
                  backgroundSize: '100% 33.33%'
                }}
              >
                {dailyVals.map((v, idx) => {
                  const d = idx + 1;
                  const isToday = d === 31;
                  const heightPct = (v / 150) * 100;
                  const tooltip = `${d} Oct · ${v === 0 ? 'no sales' : inr(v * 1000)}`;

                  return (
                    <div
                      key={d}
                      title={tooltip}
                      className="rounded-t-xs hover:opacity-85 transition-opacity cursor-pointer"
                      style={{
                        height: `${heightPct.toFixed(1)}%`,
                        backgroundColor: isToday ? '#7FB396' : '#1B5E3B',
                        minHeight: v === 0 ? '0' : '2px'
                      }}
                    />
                  );
                })}
              </div>

              {/* X-axis ticks */}
              <div
                aria-hidden="true"
                className="grid grid-cols-[repeat(31,minmax(0,1fr))] gap-1 text-[10px] text-[#5E6168] text-center pt-1.5 h-4 font-mono select-none"
              >
                {dailyVals.map((_, idx) => {
                  const d = idx + 1;
                  const showTick = d === 1 || d % 5 === 0;
                  return <span key={d}>{showTick ? d : ''}</span>;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* GST Liability Card (1 Col) */}
        <div className="bg-[#FFFFFF] border border-[#E4E3DE] rounded-[10px] p-[18px_20px] flex flex-col gap-3.5">
          <div className="flex justify-between items-baseline">
            <h2 className="m-0 text-[15px] font-semibold text-[#17181A]">GST liability</h2>
            <span className="text-[12px] text-[#5E6168]">{cur.label}</span>
          </div>

          <div className="text-[26px] font-semibold tracking-[-0.02em] text-[#17181A]">
            {inr(gstTotal)}
          </div>

          {/* Tri-color progress bar */}
          <div
            aria-hidden="true"
            className="flex h-2.5 rounded-[5px] overflow-hidden gap-0.5 bg-[#EFEEEA]"
          >
            <div style={{ width: `${cPct}%` }} className="bg-[#1B5E3B]" title="CGST" />
            <div style={{ width: `${sPct}%` }} className="bg-[#7FB396]" title="SGST" />
            <div style={{ width: `${iPct}%` }} className="bg-[#2E5AAC]" title="IGST" />
          </div>

          {/* Legend Rows */}
          <div className="flex flex-col gap-2.5 text-[13px]">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 rounded-[2px] bg-[#1B5E3B]"
                />
                <span>CGST</span>
                <span className="text-[#5E6168] text-[12px]">intra-state</span>
              </span>
              <span className="font-mono">{inr(cur.c)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 rounded-[2px] bg-[#7FB396]"
                />
                <span>SGST</span>
                <span className="text-[#5E6168] text-[12px]">intra-state</span>
              </span>
              <span className="font-mono">{inr(cur.s)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="w-2.5 h-2.5 rounded-[2px] bg-[#2E5AAC]"
                />
                <span>IGST</span>
                <span className="text-[#5E6168] text-[12px]">inter-state</span>
              </span>
              <span className="font-mono">{inr(cur.i)}</span>
            </div>
          </div>

          {/* GSTR-1 Status Box */}
          <div className="mt-auto border-t border-[#E4E3DE] pt-3 flex flex-col gap-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#5E6168]">GSTR-1 · October</span>
              <span className="font-medium text-[#17181A]">Due 11 Nov</span>
            </div>
            <div className="text-[12px] text-[#5E6168]">
              B2B 21 invoices · B2C small 25 · HSN rows 14
            </div>
            <button
              type="button"
              onClick={() => onNavigateToReports('GSTR1')}
              className="min-h-[40px] border border-[#DAD9D3] bg-[#FFFFFF] hover:bg-[#F6F6F3] rounded-lg text-[13px] font-medium text-[#17181A] cursor-pointer transition-colors"
            >
              Export GSTR-1 JSON
            </button>
          </div>
        </div>
      </section>

      {/* 4. Bottom Row: Invoices Table (Span 2) + Side Column (Receivables aging, Ask your books, Low stock) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Left 2 Cols: Invoices Table */}
        <div className="lg:col-span-2 min-w-0 bg-[#FFFFFF] border border-[#E4E3DE] rounded-[10px] flex flex-col">
          <div className="flex justify-between items-center p-[16px_20px_12px] gap-2 flex-wrap">
            <h2 className="m-0 text-[15px] font-semibold text-[#17181A]">Recent invoices</h2>
            <div className="flex gap-4 text-[13px]">
              <button
                onClick={onNavigateToInvoices}
                className="text-[#1B5E3B] hover:text-[#123F28] underline underline-offset-[3px] cursor-pointer"
              >
                Sales register
              </button>
              <button
                onClick={exportCSV}
                className="text-[#1B5E3B] hover:text-[#123F28] underline underline-offset-[3px] cursor-pointer"
              >
                Export CSV
              </button>
            </div>
          </div>

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
                  <th className="font-medium p-[8px_20px_8px_12px] border-t border-b border-[#E4E3DE]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 7).map(inv => {
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
                      {/* Invoice No & Date */}
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

                      {/* Customer */}
                      <td className="p-[11px_12px]">
                        <div className="font-medium text-[#17181A]">{inv.customerName}</div>
                        <div className="font-mono text-[11px] text-[#5E6168]">
                          {inv.customerGstin || (inv.isB2B ? 'B2B' : 'B2C')}
                        </div>
                      </td>

                      {/* Supply */}
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

                      {/* Taxable */}
                      <td className="p-[11px_12px] text-right whitespace-nowrap font-mono">
                        {inr(inv.taxableAmount)}
                      </td>

                      {/* GST */}
                      <td className="p-[11px_12px] text-right whitespace-nowrap font-mono">
                        {inr(inv.totalTax)}
                      </td>

                      {/* Total */}
                      <td className="p-[11px_12px] text-right whitespace-nowrap font-mono font-medium text-[#17181A]">
                        {inr(inv.grandTotal)}
                      </td>

                      {/* Status */}
                      <td className="p-[11px_20px_11px_12px] whitespace-nowrap">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Side Cards */}
        <div className="flex flex-col gap-3 min-w-0">
          {/* Receivables Aging */}
          <div className="bg-[#FFFFFF] border border-[#E4E3DE] rounded-[10px] p-[18px_20px] flex flex-col gap-3">
            <div className="flex justify-between items-baseline">
              <h2 className="m-0 text-[15px] font-semibold text-[#17181A]">Receivables aging</h2>
              <button
                onClick={() => onNavigateToReports('RECEIVABLES')}
                className="text-[13px] text-[#1B5E3B] hover:text-[#123F28] underline underline-offset-[3px] cursor-pointer"
              >
                Details
              </button>
            </div>

            {agingData.map(a => {
              const pct = (a.value / due) * 100;
              return (
                <div key={a.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#5E6168]">{a.label}</span>
                    <span className="font-medium font-mono text-[#17181A]">{inr(a.value)}</span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-1.5 bg-[#EFEEEA] rounded-[3px] overflow-hidden"
                  >
                    <div
                      className="h-full rounded-[3px] transition-all"
                      style={{ width: `${pct}%`, backgroundColor: a.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ask Your Books Widget */}
          <div className="bg-[#FFFFFF] border border-[#E4E3DE] rounded-[10px] p-[18px_20px] flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h2 className="m-0 text-[15px] font-semibold text-[#17181A]">Ask your books</h2>
              <button
                type="button"
                onClick={() => onOpenAssistantWithQuery(currentQA.label)}
                aria-label="Push to talk"
                className="w-11 h-11 rounded-full border border-[#DAD9D3] bg-[#FFFFFF] hover:bg-[#F6F6F3] flex items-center justify-center cursor-pointer transition-colors"
                title="Push to talk"
              >
                <Mic className="w-4 h-4 text-[#17181A]" />
              </button>
            </div>

            {/* Questions Pills */}
            <div className="flex flex-wrap gap-1.5">
              {qaItems.map((q, idx) => {
                const on = activeQuestionIdx === idx;
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => setActiveQuestionIdx(idx)}
                    aria-pressed={on}
                    className={`min-h-[32px] px-2.5 rounded-2xl text-[12px] cursor-pointer transition-all border ${
                      on
                        ? 'bg-[#17181A] text-[#FFFFFF] border-[#17181A]'
                        : 'bg-[#FFFFFF] text-[#17181A] border-[#DAD9D3] hover:border-[#17181A]'
                    }`}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>

            {/* Answer Block */}
            <div className="bg-[#F6F6F3] rounded-lg p-3 flex flex-col gap-2">
              <div className="text-[13px] leading-relaxed text-[#17181A]">
                {currentQA.text}
              </div>

              {/* Citations */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {currentQA.cites.map(c => (
                  <span
                    key={c}
                    className="font-mono text-[11px] px-1.5 py-0.5 border border-[#C9D9CF] rounded bg-[#FFFFFF] text-[#1B5E3B] select-all"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="text-[11px] text-[#5E6168]">
                Calculated from issued invoices · no estimates
              </div>
            </div>
          </div>

          {/* Low Stock Widget */}
          <div className="bg-[#FFFFFF] border border-[#E4E3DE] rounded-[10px] p-[18px_20px] flex flex-col gap-1">
            <div className="flex justify-between items-baseline mb-1.5">
              <h2 className="m-0 text-[15px] font-semibold text-[#17181A]">Low stock</h2>
              <button
                onClick={onNavigateToItems}
                className="text-[13px] text-[#1B5E3B] hover:text-[#123F28] underline underline-offset-[3px] cursor-pointer"
              >
                All items
              </button>
            </div>

            {lowStockCatalog.map(item => (
              <div
                key={item.id}
                className="flex justify-between gap-3 py-2 border-b border-[#EFEEEA] last:border-b-0 text-[13px]"
              >
                <div className="min-w-0">
                  <div className="text-[#17181A] font-medium truncate">{item.name}</div>
                  <div className="font-mono text-[11px] text-[#5E6168]">HSN {item.hsnSac}</div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="font-semibold text-[#A14A0B] font-mono">
                    {item.currentStock} left
                  </div>
                  <div className="text-[11px] text-[#5E6168]">
                    reorder at {item.lowStockThreshold}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
