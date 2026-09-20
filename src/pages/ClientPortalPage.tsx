import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Building2, CheckCircle2, FileText, Calendar, Phone, Mail, Clock, CreditCard } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { formatCurrency, formatDateDisplay, getDaysRemaining } from '../lib/dateUtils';
import { InvoiceModal } from '../components/payments/InvoiceModal';
import { Subscription, Payment } from '../types';

export const ClientPortalPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { clients, subscriptions, payments, settings } = useData();

  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);
  const [selectedSubInvoice, setSelectedSubInvoice] = useState<Subscription | null>(null);

  // Find target client
  const client = useMemo(() => {
    return clients.find((c) => c.id === clientId);
  }, [clients, clientId]);

  const clientSubs = useMemo(() => {
    return subscriptions.filter((s) => s.client_id === clientId);
  }, [subscriptions, clientId]);

  const clientPayments = useMemo(() => {
    return payments.filter((p) => p.client_id === clientId && p.status !== 'VOIDED');
  }, [payments, clientId]);

  if (!client) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center items-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-500 mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Client Portal Not Found</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          The requested portal URL is invalid or client record has been updated. Please contact WebRajya support.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 font-sans pb-12 select-none">
      {/* Top Banner */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-xs">
              W
            </div>
            <div>
              <span className="text-sm font-black tracking-widest uppercase text-slate-900">
                {settings.business_name}
              </span>
              <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                Client Self-Service Portal
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>Verified Customer Account</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 mt-4">
        {/* Client Business Profile Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Account Overview
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">
              {client.business_name}
            </h1>
            {client.owner_name && (
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Contact: {client.owner_name}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 font-mono">
              {client.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {client.email}
                </span>
              )}
              {client.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {client.phone}
                </span>
              )}
              {client.gstin && <span>GSTIN: {client.gstin}</span>}
            </div>
          </div>

          <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-right shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Active Products
            </span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">
              {clientSubs.filter((s) => s.status === 'ACTIVE' || s.status === 'EXPIRING_SOON').length}
            </span>
          </div>
        </div>

        {/* Active Licenses & Subscriptions Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" /> Active Software Licenses
            </h2>
          </div>

          {clientSubs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No active software licenses found for this account.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientSubs.map((sub: Subscription) => {
                const days = getDaysRemaining(sub.end_date);
                return (
                  <div
                    key={sub.id}
                    className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 hover:border-indigo-200 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-slate-900 text-base">
                          {sub.product?.name || 'Software License'}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : sub.status === 'EXPIRING_SOON'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {sub.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        Plan: <strong className="text-slate-900">{sub.plan?.name || 'Standard'}</strong>
                      </p>

                      <div className="mt-3 space-y-1 text-xs text-slate-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Valid: {formatDateDisplay(sub.start_date)} to {formatDateDisplay(sub.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{days === 0 ? 'Expires today' : `${days} days remaining`}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {formatCurrency(sub.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSubInvoice(sub)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Invoice PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Settled Receipts & Financial Ledger */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Payment Receipts & Invoices
            </h2>
          </div>

          {clientPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No settled payment receipts on file.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {clientPayments.map((pay: Payment) => (
                <div key={pay.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">{pay.receipt_number}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                        PAID ({pay.payment_method})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      Date: {formatDateDisplay(pay.payment_date)} {pay.transaction_reference && `• Ref: ${pay.transaction_reference}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-black text-emerald-600 font-mono">
                      {formatCurrency(pay.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(pay)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Download Bill</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center text-xs text-slate-400 font-mono pt-4">
          {settings.business_name} • VERIFIED CLIENT SELF-SERVICE PORTAL
        </div>
      </main>

      {/* Invoice Modals */}
      <InvoiceModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        payment={selectedInvoice}
      />
      <InvoiceModal
        isOpen={Boolean(selectedSubInvoice)}
        onClose={() => setSelectedSubInvoice(null)}
        subscription={selectedSubInvoice}
      />
    </div>
  );
};
