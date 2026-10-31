import React from 'react';
import { BusinessProfile } from '../../types';

export type NavTab =
  | 'DASHBOARD'
  | 'INVOICES'
  | 'CREDIT_NOTES'
  | 'CUSTOMERS'
  | 'ITEMS'
  | 'GSTR1'
  | 'SALES_REGISTER'
  | 'RECEIVABLES_AGING';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  business: BusinessProfile;
  invoiceCount: number;
  lowStockCount: number;
  onNewInvoice: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  business,
  invoiceCount,
  lowStockCount,
  onNewInvoice,
  onOpenSettings
}) => {
  // Initials for avatar
  const initials = business.tradeName
    ? business.tradeName
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'VE';

  return (
    <nav
      aria-label="Main"
      className="w-[232px] max-w-full box-border bg-[#FFFFFF] border-r border-[#E4E3DE] p-5 flex flex-col gap-6 select-none flex-shrink-0 h-screen no-print font-sans"
    >
      {/* Brand Header */}
      <div className="flex flex-col gap-0.5 px-2 py-1">
        <div className="flex items-center gap-2.5">
          <div
            aria-hidden="true"
            className="w-7 h-7 rounded-md bg-[#17181A] text-[#FFFFFF] font-semibold text-[13px] flex items-center justify-center tracking-tight"
          >
            PM
          </div>
          <div>
            <div className="font-semibold text-[14px] leading-tight text-[#17181A]">
              PayzenMax.com
            </div>
            <div className="text-[11px] text-[#5E6168] leading-none mt-0.5">
              GST Billing Platform
            </div>
          </div>
        </div>
        <div className="font-mono text-[11px] text-[#5E6168] mt-2.5">
          GSTIN {business.gstin}
        </div>
        <div className="text-[12px] text-[#5E6168]">
          {business.stateName} ({business.stateCode}) · FY {business.financialYear}
        </div>
      </div>

      {/* Primary CTA: New bill */}
      <button
        onClick={onNewInvoice}
        className="flex items-center justify-between min-h-[44px] box-border px-3.5 rounded-lg bg-[#1B5E3B] hover:bg-[#123F28] text-[#FFFFFF] font-medium text-[14px] transition-colors shadow-xs active:scale-[0.99] cursor-pointer"
      >
        <span>New bill</span>
        <span className="font-mono text-[11px] px-1.5 py-0.5 border border-white/35 rounded tracking-wide">
          Alt+N
        </span>
      </button>

      {/* Main Navigation Links */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onSelectTab('DASHBOARD')}
          className={`flex items-center min-h-[40px] px-2.5 rounded-md text-[14px] transition-colors text-left ${
            currentTab === 'DASHBOARD'
              ? 'bg-[#EEEEEA] text-[#17181A] font-medium'
              : 'text-[#3B3E44] hover:bg-[#F6F6F3] hover:text-[#17181A]'
          }`}
        >
          Dashboard
        </button>

        <button
          onClick={() => onSelectTab('INVOICES')}
          className={`flex items-center justify-between min-h-[40px] px-2.5 rounded-md text-[14px] transition-colors text-left ${
            currentTab === 'INVOICES'
              ? 'bg-[#EEEEEA] text-[#17181A] font-medium'
              : 'text-[#3B3E44] hover:bg-[#F6F6F3] hover:text-[#17181A]'
          }`}
        >
          <span>Invoices</span>
          <span className="text-[12px] text-[#5E6168] font-mono">{invoiceCount}</span>
        </button>

        <button
          onClick={() => onSelectTab('CREDIT_NOTES')}
          className={`flex items-center min-h-[40px] px-2.5 rounded-md text-[14px] transition-colors text-left ${
            currentTab === 'CREDIT_NOTES'
              ? 'bg-[#EEEEEA] text-[#17181A] font-medium'
              : 'text-[#3B3E44] hover:bg-[#F6F6F3] hover:text-[#17181A]'
          }`}
        >
          Credit notes
        </button>

        <button
          onClick={() => onSelectTab('CUSTOMERS')}
          className={`flex items-center min-h-[40px] px-2.5 rounded-md text-[14px] transition-colors text-left ${
            currentTab === 'CUSTOMERS'
              ? 'bg-[#EEEEEA] text-[#17181A] font-medium'
              : 'text-[#3B3E44] hover:bg-[#F6F6F3] hover:text-[#17181A]'
          }`}
        >
          Customers
        </button>

        <button
          onClick={() => onSelectTab('ITEMS')}
          className={`flex items-center justify-between min-h-[40px] px-2.5 rounded-md text-[14px] transition-colors text-left ${
            currentTab === 'ITEMS'
              ? 'bg-[#EEEEEA] text-[#17181A] font-medium'
              : 'text-[#3B3E44] hover:bg-[#F6F6F3] hover:text-[#17181A]'
          }`}
        >
          <span>Items &amp; stock</span>
          {lowStockCount > 0 ? (
            <span className="text-[11px] font-medium text-[#A14A0B] bg-[#FBEEE3] px-1.5 py-0.5 rounded-full font-mono">
              {lowStockCount} low
            </span>
          ) : (
            <span className="text-[12px] text-[#5E6168]">ok</span>
          )}
        </button>
      </div>

      {/* Reports Navigation Section */}
      <div className="flex flex-col gap-0.5">
        <div className="text-[11px] font-semibold tracking-[0.06em] uppercase text-[#5E6168] px-2.5 pb-1.5">
          Reports
        </div>
        <button
          onClick={() => onSelectTab('GSTR1')}
          className={`flex items-center min-h-[40px] px-2.5 rounded-md text-[14px] transition-colors text-left ${
            currentTab === 'GSTR1'
              ? 'bg-[#EEEEEA] text-[#17181A] font-medium'
              : 'text-[#3B3E44] hover:bg-[#F6F6F3] hover:text-[#17181A]'
          }`}
        >
          GSTR-1
        </button>

        <button
          onClick={() => onSelectTab('SALES_REGISTER')}
          className={`flex items-center min-h-[40px] px-2.5 rounded-md text-[14px] transition-colors text-left ${
            currentTab === 'SALES_REGISTER'
              ? 'bg-[#EEEEEA] text-[#17181A] font-medium'
              : 'text-[#3B3E44] hover:bg-[#F6F6F3] hover:text-[#17181A]'
          }`}
        >
          Sales register
        </button>

        <button
          onClick={() => onSelectTab('RECEIVABLES_AGING')}
          className={`flex items-center min-h-[40px] px-2.5 rounded-md text-[14px] transition-colors text-left ${
            currentTab === 'RECEIVABLES_AGING'
              ? 'bg-[#EEEEEA] text-[#17181A] font-medium'
              : 'text-[#3B3E44] hover:bg-[#F6F6F3] hover:text-[#17181A]'
          }`}
        >
          Receivables aging
        </button>
      </div>

      {/* Footer: Settings & Backup */}
      <div className="mt-auto flex flex-col gap-0.5 border-t border-[#E4E3DE] pt-3">
        <button
          onClick={onOpenSettings}
          className="flex items-center min-h-[40px] px-2.5 rounded-md text-[14px] text-[#3B3E44] hover:text-[#17181A] hover:bg-[#F6F6F3] transition-colors text-left"
        >
          Settings &amp; backup
        </button>
        <div className="text-[12px] text-[#5E6168] px-2.5 py-1 leading-snug">
          Saved on this device · last backup 28 Oct
        </div>
      </div>
    </nav>
  );
};
