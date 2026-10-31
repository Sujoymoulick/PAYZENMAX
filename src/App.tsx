import React, { useState, useEffect } from 'react';
import {
  BusinessProfile,
  Customer,
  Invoice,
  Item,
  PaymentMode
} from './types';
import {
  getBusinessProfile,
  getCustomers,
  getInvoices,
  getItems,
  saveBusinessProfile,
  saveCustomer,
  saveDraftInvoice,
  issueInvoice,
  recordInvoicePayment,
  cancelInvoice,
  issueCreditNote,
  saveItem,
  adjustItemStock,
  resetToDemoData
} from './core/storage';
import { Sidebar, NavTab } from './components/Layout/Sidebar';
import { Header, DashboardPeriod } from './components/Layout/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { InvoiceList } from './components/Sales/InvoiceList';
import { InvoiceComposer } from './components/Sales/InvoiceComposer';
import { InvoiceViewModal } from './components/Sales/InvoiceViewModal';
import { ItemList } from './components/Items/ItemList';
import { CustomerList } from './components/Customers/CustomerList';
import { ReportsView } from './components/Reports/ReportsView';
import { AIAssistantDrawer } from './components/AIAssistant/AIAssistantDrawer';
import { SettingsModal } from './components/Settings/SettingsModal';

export const App: React.FC = () => {
  const [business, setBusiness] = useState<BusinessProfile>(getBusinessProfile());
  const [customers, setCustomers] = useState<Customer[]>(getCustomers());
  const [items, setItems] = useState<Item[]>(getItems());
  const [invoices, setInvoices] = useState<Invoice[]>(getInvoices());

  const [currentTab, setCurrentTab] = useState<NavTab>('DASHBOARD');
  const [dashboardPeriod, setDashboardPeriod] = useState<DashboardPeriod>('month');

  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const reloadData = () => {
    setBusiness(getBusinessProfile());
    setCustomers(getCustomers());
    setItems(getItems());
    setInvoices(getInvoices());
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setSelectedInvoice(null);
        setComposerOpen(true);
      }
      if (e.key === 'Escape') {
        if (selectedInvoice) setSelectedInvoice(null);
        else if (composerOpen) setComposerOpen(false);
        else if (settingsOpen) setSettingsOpen(false);
        else if (assistantOpen) setAssistantOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedInvoice, composerOpen, settingsOpen, assistantOpen]);

  const handleSaveDraft = (inv: Invoice) => {
    saveDraftInvoice(inv);
    reloadData();
    setComposerOpen(false);
  };

  const handleIssueInvoice = (inv: Invoice) => {
    const issued = issueInvoice(inv);
    reloadData();
    setComposerOpen(false);
    setSelectedInvoice(issued);
  };

  const handleRecordPayment = (
    invoiceId: string,
    amount: number,
    mode: PaymentMode,
    reference?: string
  ) => {
    const updated = recordInvoicePayment(invoiceId, {
      date: new Date().toISOString().split('T')[0],
      amount,
      mode,
      referenceNo: reference
    });
    reloadData();
    setSelectedInvoice(updated);
  };

  const handleCancelInvoice = (invoiceId: string, reason: string) => {
    const cancelled = cancelInvoice(invoiceId, reason);
    reloadData();
    setSelectedInvoice(cancelled);
  };

  const handleIssueCreditNote = (invoiceId: string, amount: number, reason: string) => {
    issueCreditNote(invoiceId, amount, reason);
    reloadData();
    const updated = getInvoices().find(i => i.id === invoiceId) || null;
    setSelectedInvoice(updated);
  };

  const handleSaveItem = (item: Item) => {
    saveItem(item);
    reloadData();
  };

  const handleAdjustStock = (itemId: string, delta: number, reason: string) => {
    adjustItemStock(itemId, delta, reason);
    reloadData();
  };

  const handleSaveCustomer = (customer: Customer) => {
    saveCustomer(customer);
    reloadData();
  };

  const handleSaveBusiness = (profile: BusinessProfile) => {
    saveBusinessProfile(profile);
    reloadData();
  };

  const handleResetDemoData = () => {
    resetToDemoData();
    reloadData();
    setSelectedInvoice(null);
    setComposerOpen(false);
  };

  const lowStockCount = items.filter(
    i => i.type === 'GOODS' && i.currentStock <= i.lowStockThreshold
  ).length;

  return (
    <div className="flex h-screen w-full bg-[#F6F6F3] overflow-hidden text-[#17181A] font-sans antialiased">
      {/* Sidebar matching exact design mockup */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          setComposerOpen(false);
        }}
        business={business}
        invoiceCount={invoices.length}
        lowStockCount={lowStockCount}
        onNewInvoice={() => {
          setSelectedInvoice(null);
          setComposerOpen(true);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:pb-12 flex flex-col gap-5">
          {/* Header */}
          <Header
            title={
              composerOpen
                ? 'New tax invoice'
                : currentTab === 'DASHBOARD'
                ? 'Overview'
                : currentTab === 'INVOICES'
                ? 'Invoices'
                : currentTab === 'CREDIT_NOTES'
                ? 'Credit notes'
                : currentTab === 'ITEMS'
                ? 'Items & stock'
                : currentTab === 'CUSTOMERS'
                ? 'Customers'
                : currentTab === 'GSTR1'
                ? 'GSTR-1 Report'
                : currentTab === 'SALES_REGISTER'
                ? 'Sales register'
                : 'Receivables aging'
            }
            subtitle="Saturday, 31 October 2026"
            showPeriodSelector={!composerOpen && currentTab === 'DASHBOARD'}
            activePeriod={dashboardPeriod}
            onPeriodChange={setDashboardPeriod}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onResetDemoData={handleResetDemoData}
          />

          {/* Views */}
          {composerOpen ? (
            <InvoiceComposer
              business={business}
              customers={customers}
              items={items}
              onSaveDraft={handleSaveDraft}
              onIssueInvoice={handleIssueInvoice}
              onCancel={() => setComposerOpen(false)}
              onQuickAddCustomer={handleSaveCustomer}
            />
          ) : currentTab === 'DASHBOARD' ? (
            <DashboardView
              invoices={invoices}
              items={items}
              activePeriod={dashboardPeriod}
              onSelectInvoice={inv => setSelectedInvoice(inv)}
              onNavigateToInvoices={() => setCurrentTab('INVOICES')}
              onNavigateToItems={() => setCurrentTab('ITEMS')}
              onNavigateToReports={rep => {
                if (rep === 'GSTR1') setCurrentTab('GSTR1');
                else if (rep === 'RECEIVABLES') setCurrentTab('RECEIVABLES_AGING');
                else setCurrentTab('SALES_REGISTER');
              }}
              onOpenAssistantWithQuery={q => {
                setAssistantInitialQuery(q);
                setAssistantOpen(true);
              }}
            />
          ) : currentTab === 'INVOICES' || currentTab === 'CREDIT_NOTES' ? (
            <InvoiceList
              invoices={
                currentTab === 'CREDIT_NOTES'
                  ? invoices.filter(i => (i.creditNotes && i.creditNotes.length > 0) || i.status === 'CANCELLED')
                  : invoices
              }
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectInvoice={inv => setSelectedInvoice(inv)}
              onNewInvoice={() => {
                setSelectedInvoice(null);
                setComposerOpen(true);
              }}
            />
          ) : currentTab === 'ITEMS' ? (
            <ItemList
              items={items}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSaveItem={handleSaveItem}
              onAdjustStock={handleAdjustStock}
            />
          ) : currentTab === 'CUSTOMERS' ? (
            <CustomerList
              customers={customers}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSaveCustomer={handleSaveCustomer}
            />
          ) : (
            <ReportsView
              invoices={invoices}
              business={business}
              onSelectInvoice={inv => setSelectedInvoice(inv)}
            />
          )}
        </main>
      </div>

      {/* Invoice View & Print Modal */}
      {selectedInvoice && (
        <InvoiceViewModal
          invoice={selectedInvoice}
          business={business}
          onClose={() => setSelectedInvoice(null)}
          onRecordPayment={handleRecordPayment}
          onCancelInvoice={handleCancelInvoice}
          onIssueCreditNote={handleIssueCreditNote}
        />
      )}

      {/* Settings & Backup Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        business={business}
        onClose={() => setSettingsOpen(false)}
        onSaveBusiness={handleSaveBusiness}
        onResetDemoData={handleResetDemoData}
        onDataRestored={reloadData}
      />

      {/* Grounded AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onSelectInvoice={invoiceId => {
          const inv = invoices.find(i => i.id === invoiceId);
          if (inv) setSelectedInvoice(inv);
        }}
      />
    </div>
  );
};
