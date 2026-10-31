import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import { Customer, INDIAN_STATES } from '../../types';
import { getCurrentDateISO, getStateCodeFromGSTIN, isValidGSTIN } from '../../core/formatters';

interface CustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [stateCode, setStateCode] = useState('27');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setGstin(customer.gstin || '');
      setStateCode(customer.stateCode);
      setPhone(customer.phone);
      setEmail(customer.email || '');
      setAddress(customer.address);
      setCity(customer.city);
      setPincode(customer.pincode);
      setOpeningBalance(customer.openingBalance);
    } else {
      setName('');
      setGstin('');
      setStateCode('27');
      setPhone('');
      setEmail('');
      setAddress('');
      setCity('Mumbai');
      setPincode('400001');
      setOpeningBalance(0);
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleGstinChange = (val: string) => {
    const cleaned = val.toUpperCase().trim();
    setGstin(cleaned);
    const code = getStateCodeFromGSTIN(cleaned);
    if (code) {
      const matched = INDIAN_STATES.find(s => s.code === code);
      if (matched) {
        setStateCode(code);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const matchedState = INDIAN_STATES.find(s => s.code === stateCode);
    const stateName = matchedState ? matchedState.name : 'Maharashtra';

    const newCust: Customer = {
      id: customer?.id || `cust_${Date.now()}`,
      name: name.trim(),
      gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
      isB2B: Boolean(gstin.trim()),
      stateCode,
      stateName,
      address: address.trim() || 'Local Customer Address',
      city: city.trim() || 'City',
      pincode: pincode.trim() || '400001',
      phone: phone.trim() || '+91 98000 00000',
      email: email.trim() || undefined,
      openingBalance: Number(openingBalance) || 0,
      currentBalance: customer ? customer.currentBalance : (Number(openingBalance) || 0),
      createdAt: customer?.createdAt || getCurrentDateISO(),
      updatedAt: getCurrentDateISO()
    };

    onSave(newCust);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 font-display text-base">
              {customer ? 'Edit Customer' : 'Add New Customer (B2B / B2C)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Customer Name */}
          <div>
            <label className="font-bold text-slate-700">Customer / Business Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg mt-1 font-medium text-slate-900"
              placeholder="e.g. Apex Infotech Solutions or Rahul Sharma"
            />
          </div>

          {/* GSTIN and State */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">GSTIN (Optional for B2C)</label>
              <input
                type="text"
                maxLength={15}
                value={gstin}
                onChange={e => handleGstinChange(e.target.value)}
                className="w-full font-mono p-2 border border-slate-300 rounded-lg mt-1 uppercase"
                placeholder="15-digit GSTIN"
              />
              {gstin && !isValidGSTIN(gstin) && (
                <span className="text-[10px] text-amber-600 block mt-0.5">
                  Format: 2 state + 10 PAN + 1 entity + 1 Z + 1 checksum
                </span>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700">Place of Supply (State) *</label>
              <select
                value={stateCode}
                onChange={e => setStateCode(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg mt-1 font-semibold"
              >
                {INDIAN_STATES.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">Phone / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg mt-1"
                placeholder="+91 98201 00000"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg mt-1"
                placeholder="billing@customer.com"
              />
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <label className="font-bold text-slate-700">Billing Address</label>
            <textarea
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg mt-1"
              placeholder="Premises #, Street, Industrial Area"
            />
          </div>

          {/* City & Pincode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700">City / District</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg mt-1"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg mt-1 font-mono"
              />
            </div>
          </div>

          {/* Opening Balance */}
          {!customer && (
            <div>
              <label className="font-bold text-slate-700">Opening Balance (₹)</label>
              <input
                type="number"
                step="any"
                value={openingBalance}
                onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg mt-1 font-mono"
                placeholder="0.00"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
            >
              {customer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
