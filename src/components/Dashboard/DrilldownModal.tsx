import React from 'react';
import { X, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../core/formatters';

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  metricValue: string;
  period: string;
  basis: string;
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
}

export const DrilldownModal: React.FC<DrilldownModalProps> = ({
  isOpen,
  onClose,
  title,
  metricValue,
  period,
  basis,
  invoices,
  onSelectInvoice
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 font-display">Calculation Drilldown: {title}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold font-mono">
                {metricValue}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Period: <span className="font-semibold text-slate-700">{period}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit & Explainability Banner */}
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 text-xs text-emerald-950 flex items-start space-x-3">
          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-emerald-900">Deterministic Calculation Basis: </span>
            <span className="text-emerald-800">{basis}</span>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Source of truth: Immutable local issued invoices in integer paise. Zero approximations.
            </p>
          </div>
        </div>

        {/* Source Records List */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Underlying Transactions ({invoices.length} records)
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching transactions found for this metric in this period.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {invoices.map(inv => (
                <div
                  key={inv.id}
                  onClick={() => {
                    onClose();
                    onSelectInvoice(inv);
                  }}
                  className="p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                        <span className="text-xs text-slate-600 font-medium truncate max-w-[200px]">
                          {inv.customerName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span>Date: {formatDate(inv.date)}</span>
                        <span>•</span>
                        <span>Taxable: {formatCurrency(inv.taxableAmount)}</span>
                        <span>•</span>
                        <span>GST: {formatCurrency(inv.totalTax)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-slate-900">
                        {formatCurrency(inv.grandTotal)}
                      </div>
                      <div className="text-[10px] uppercase font-semibold">
                        {inv.status === 'CANCELLED' ? (
                          <span className="text-rose-600">Cancelled</span>
                        ) : inv.paymentStatus === 'PAID' ? (
                          <span className="text-emerald-600">Paid</span>
                        ) : (
                          <span className="text-amber-600">Due: {formatCurrency(inv.amountDue)}</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">Click any transaction row to open its full tax invoice view</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
