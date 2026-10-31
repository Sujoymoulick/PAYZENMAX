import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { BusinessProfile } from '../../types';

export type DashboardPeriod = 'today' | 'week' | 'month' | 'fy';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showPeriodSelector?: boolean;
  activePeriod?: DashboardPeriod;
  onPeriodChange?: (period: DashboardPeriod) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetDemoData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showPeriodSelector = false,
  activePeriod = 'month',
  onPeriodChange,
  searchQuery,
  onSearchChange,
  onResetDemoData
}) => {
  const periodOptions: { id: DashboardPeriod; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' },
    { id: 'month', label: 'This month' },
    { id: 'fy', label: 'FY 2026-27' }
  ];

  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-1 no-print font-sans">
      {/* Title & Date */}
      <div className="flex flex-col gap-0.5">
        <div className="text-[13px] text-[#5E6168]">
          {subtitle || 'Saturday, 31 October 2026'}
        </div>
        <h1 className="m-0 text-[24px] font-semibold tracking-[-0.01em] text-[#17181A]">
          {title}
        </h1>
      </div>

      {/* Right Controls: Period Selector & Search */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period Segmented Toggle */}
        {showPeriodSelector && onPeriodChange && (
          <div
            role="group"
            aria-label="Period"
            className="flex bg-[#EAEAE5] rounded-lg p-[3px] gap-0.5"
          >
            {periodOptions.map(p => {
              const active = activePeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPeriodChange(p.id)}
                  aria-pressed={active}
                  className={`min-h-[36px] px-3.5 border-0 rounded-md text-[13px] font-medium cursor-pointer transition-all ${
                    active
                      ? 'bg-[#FFFFFF] text-[#17181A] shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                      : 'bg-transparent text-[#4A4D53] hover:text-[#17181A]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Global Search Input */}
        <label className="flex items-center gap-2 min-h-[42px] box-border px-3 bg-[#FFFFFF] border border-[#DAD9D3] rounded-lg w-[260px] max-w-full focus-within:border-[#17181A] transition-colors">
          <Search className="w-4 h-4 text-[#5E6168] flex-shrink-0" />
          <span className="sr-only">Search invoices, customers, items</span>
          <input
            type="search"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Invoice no., customer, item"
            className="border-0 outline-none flex-1 min-w-0 font-inherit text-[13px] bg-transparent text-[#17181A] placeholder:text-[#8E9096]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="text-[#5E6168] hover:text-[#17181A] text-xs"
            >
              ×
            </button>
          )}
        </label>

        {/* Reset Demo Data link/button */}
        <button
          onClick={onResetDemoData}
          title="Reset database to demo mockup state"
          className="min-h-[42px] px-2.5 rounded-lg border border-[#DAD9D3] bg-[#FFFFFF] hover:bg-[#F6F6F3] text-[#5E6168] hover:text-[#17181A] text-[12px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Reset demo</span>
        </button>
      </div>
    </header>
  );
};
