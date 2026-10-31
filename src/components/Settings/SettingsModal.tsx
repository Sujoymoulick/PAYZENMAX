import React, { useState } from 'react';
import {
  X,
  Building,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { BusinessProfile, INDIAN_STATES, TaxMode } from '../../types';
import { createDataExport, restoreDataBackup } from '../../core/storage';
import { isValidGSTIN, getStateCodeFromGSTIN } from '../../core/formatters';

interface SettingsModalProps {
  isOpen: boolean;
  business: BusinessProfile;
  onClose: () => void;
  onSaveBusiness: (profile: BusinessProfile) => void;
  onResetDemoData: () => void;
  onDataRestored: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  business,
  onClose,
  onSaveBusiness,
  onResetDemoData,
  onDataRestored
}) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'BACKUP'>('PROFILE');

  const [legalName, setLegalName] = useState(business.legalName);
  const [tradeName, setTradeName] = useState(business.tradeName);
  const [gstin, setGstin] = useState(business.gstin);
  const [stateCode, setStateCode] = useState(business.stateCode);
  const [address, setAddress] = useState(business.address);
  const [city, setCity] = useState(business.city);
  const [pincode, setPincode] = useState(business.pincode);
  const [phone, setPhone] = useState(business.phone);
  const [email, setEmail] = useState(business.email);
  const [bankName, setBankName] = useState(business.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(business.bankAccountNumber || '');
  const [bankIfsc, setBankIfsc] = useState(business.bankIfsc || '');
  const [upiId, setUpiId] = useState(business.upiId || '');
  const [invoicePrefix, setInvoicePrefix] = useState(business.invoicePrefix);
  const [financialYear, setFinancialYear] = useState(business.financialYear);
  const [defaultTaxMode, setDefaultTaxMode] = useState<TaxMode>(business.defaultTaxMode);
  const [terms, setTerms] = useState(business.termsAndConditions || '');

  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleGstinChange = (val: string) => {
    const cleaned = val.toUpperCase().trim();
    setGstin(cleaned);
    const code = getStateCodeFromGSTIN(cleaned);
    if (code) {
      const match = INDIAN_STATES.find(s => s.code === code);
      if (match) setStateCode(code);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const stateMatch = INDIAN_STATES.find(s => s.code === stateCode);

    const updated: BusinessProfile = {
      ...business,
      legalName: legalName.trim(),
      tradeName: tradeName.trim(),
      gstin: gstin.trim().toUpperCase(),
      stateCode,
      stateName: stateMatch ? stateMatch.name : business.stateName,
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      phone: phone.trim(),
      email: email.trim(),
      bankName: bankName.trim(),
      bankAccountNumber: bankAccountNumber.trim(),
      bankIfsc: bankIfsc.trim().toUpperCase(),
      upiId: upiId.trim(),
      invoicePrefix: invoicePrefix.trim(),
      financialYear: financialYear.trim(),
      defaultTaxMode,
      termsAndConditions: terms.trim()
    };

    onSaveBusiness(updated);
    onClose();
  };

  const handleExportBackup = () => {
    const json = createDataExport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PayzenMax_Backup_${business.tradeName.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content) {
        const result = restoreDataBackup(content);
        setRestoreStatus(result);
        if (result.success) {
          onDataRestored();
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in no-print font-sans">
      <div className="bg-[#FFFFFF] rounded-[10px] border border-[#DAD9D3] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#E4E3DE] flex items-center justify-between bg-[#F6F6F3]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#17181A] text-white flex items-center justify-center font-semibold text-[13px]">
              <Building className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#17181A] text-[15px]">
                Settings &amp; backup
              </h3>
              <div className="text-[12px] text-[#5E6168]">
                Business masters, tax registration, and offline JSON export
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#5E6168] hover:text-[#17181A]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E4E3DE] px-5 pt-2 bg-[#FFFFFF]">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`pb-2.5 px-3 text-[13px] font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'border-[#1B5E3B] text-[#1B5E3B] font-semibold'
                : 'border-transparent text-[#5E6168] hover:text-[#17181A]'
            }`}
          >
            Business &amp; GST setup
          </button>
          <button
            onClick={() => setActiveTab('BACKUP')}
            className={`pb-2.5 px-3 text-[13px] font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'BACKUP'
                ? 'border-[#1B5E3B] text-[#1B5E3B] font-semibold'
                : 'border-transparent text-[#5E6168] hover:text-[#17181A]'
            }`}
          >
            Backup &amp; data portability
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'PROFILE' && (
          <form onSubmit={handleSave} className="p-5 flex flex-col gap-3 text-[13px] overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Legal entity name *</label>
                <input
                  type="text"
                  required
                  value={legalName}
                  onChange={e => setLegalName(e.target.value)}
                  className="w-full p-2 border border-[#DAD9D3] rounded font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Trade name *</label>
                <input
                  type="text"
                  required
                  value={tradeName}
                  onChange={e => setTradeName(e.target.value)}
                  className="w-full p-2 border border-[#DAD9D3] rounded font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">15-Digit GSTIN *</label>
                <input
                  type="text"
                  maxLength={15}
                  required
                  value={gstin}
                  onChange={e => handleGstinChange(e.target.value)}
                  className="w-full font-mono font-medium p-2 border border-[#DAD9D3] rounded uppercase"
                />
                {gstin && !isValidGSTIN(gstin) && (
                  <span className="text-[10px] text-[#A14A0B] block mt-0.5">
                    Expected 15-character GSTIN
                  </span>
                )}
              </div>

              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">State (Place of Supply) *</label>
                <select
                  value={stateCode}
                  onChange={e => setStateCode(e.target.value)}
                  className="w-full p-2 border border-[#DAD9D3] rounded font-medium"
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#5E6168] block mb-0.5">Registered address</label>
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full p-2 border border-[#DAD9D3] rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full p-2 border border-[#DAD9D3] rounded"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Pincode</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="w-full font-mono p-2 border border-[#DAD9D3] rounded"
                />
              </div>
            </div>

            <div className="p-3 bg-[#F6F6F3] border border-[#E4E3DE] rounded-md flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#5E6168]">
                Bank &amp; UPI (For QR Code generation on bills)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#5E6168] block mb-0.5">Bank name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full p-1.5 border border-[#DAD9D3] rounded bg-white text-[12px]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#5E6168] block mb-0.5">Account number</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={e => setBankAccountNumber(e.target.value)}
                    className="w-full font-mono p-1.5 border border-[#DAD9D3] rounded bg-white text-[12px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#5E6168] block mb-0.5">IFSC code</label>
                  <input
                    type="text"
                    value={bankIfsc}
                    onChange={e => setBankIfsc(e.target.value.toUpperCase())}
                    className="w-full font-mono p-1.5 border border-[#DAD9D3] rounded bg-white text-[12px] uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#5E6168] block mb-0.5">UPI VPA</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    className="w-full font-mono p-1.5 border border-[#DAD9D3] rounded bg-white text-[12px]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Series prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={e => setInvoicePrefix(e.target.value)}
                  className="w-full font-mono p-1.5 border border-[#DAD9D3] rounded text-[12px]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Financial Year</label>
                <input
                  type="text"
                  value={financialYear}
                  onChange={e => setFinancialYear(e.target.value)}
                  className="w-full p-1.5 border border-[#DAD9D3] rounded text-[12px]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#5E6168] block mb-0.5">Default tax mode</label>
                <select
                  value={defaultTaxMode}
                  onChange={e => setDefaultTaxMode(e.target.value as TaxMode)}
                  className="w-full p-1.5 border border-[#DAD9D3] rounded text-[12px]"
                >
                  <option value="EXCLUSIVE">Tax Exclusive</option>
                  <option value="INCLUSIVE">Tax Inclusive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E3DE]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-[#DAD9D3] rounded text-[#5E6168]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#1B5E3B] text-white rounded font-medium"
              >
                Save settings
              </button>
            </div>
          </form>
        )}

        {/* Backup Tab */}
        {activeTab === 'BACKUP' && (
          <div className="p-5 flex flex-col gap-4 text-[13px] overflow-y-auto flex-1">
            {restoreStatus && (
              <div
                className={`p-3 rounded border flex items-center gap-2 ${
                  restoreStatus.success
                    ? 'bg-[#E7F0EA] border-[#1B5E3B]/20 text-[#1B5E3B]'
                    : 'bg-[#FBEEE3] border-[#A14A0B]/20 text-[#A14A0B]'
                }`}
              >
                {restoreStatus.success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>{restoreStatus.message}</span>
              </div>
            )}

            <div className="p-4 bg-[#F6F6F3] border border-[#E4E3DE] rounded-md flex flex-col gap-2">
              <h4 className="font-semibold text-[#17181A]">Export local backup</h4>
              <p className="text-[12px] text-[#5E6168]">
                Download a machine-readable JSON archive of all invoices, customers, stock, and settings.
              </p>
              <button
                onClick={handleExportBackup}
                className="self-start flex items-center gap-1.5 px-3.5 py-2 bg-[#1B5E3B] hover:bg-[#123F28] text-white rounded text-[13px] font-medium cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON backup</span>
              </button>
            </div>

            <div className="p-4 bg-[#F6F6F3] border border-[#E4E3DE] rounded-md flex flex-col gap-2">
              <h4 className="font-semibold text-[#17181A]">Restore from backup</h4>
              <p className="text-[12px] text-[#5E6168]">
                Restore accounting books from a previously saved JSON export.
              </p>
              <div>
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFFFFF] border border-[#DAD9D3] hover:bg-[#F6F6F3] rounded text-[13px] font-medium cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Select backup file</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 bg-[#FBEEE3]/50 border border-[#A14A0B]/20 rounded-md flex flex-col gap-2">
              <h4 className="font-semibold text-[#A14A0B]">Reset database to reference demo</h4>
              <p className="text-[12px] text-[#5E6168]">
                Re-seeds the exact October 2026 transactions, items, and figures from the design mockup.
              </p>
              <button
                onClick={() => {
                  if (confirm('Reset database to demo mockup state?')) {
                    onResetDemoData();
                    onClose();
                  }
                }}
                className="self-start flex items-center gap-1.5 px-3.5 py-2 bg-[#A14A0B] hover:bg-[#7A2E05] text-white rounded text-[13px] font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to demo mockup</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
