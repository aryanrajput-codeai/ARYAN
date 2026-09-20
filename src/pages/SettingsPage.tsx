import React, { useState } from 'react';
import {
  Building,
  Database,
  ShieldCheck,
  History,
  Save,
  Trash2,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatDateTimeDisplay } from '../lib/dateUtils';
import { ActivityEvent } from '../types';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, events, isSupabaseLive, resetAllProductionData } = useData();
  const { user, role, isAdmin, switchRole } = useAuth();
  const { addToast } = useToast();

  // Company settings form
  const [businessName, setBusinessName] = useState(settings.business_name);
  const [gstin, setGstin] = useState(settings.gstin);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [receiptPrefix, setReceiptPrefix] = useState(settings.receipt_prefix || 'WR-PAY-');
  const [currency] = useState(settings.currency);
  const [isSaving, setIsSaving] = useState(false);

  // Supabase connection keys for live mode configuration
  const [supabaseUrl] = useState(
    (import.meta as any).env.VITE_SUPABASE_URL || ''
  );
  const [supabaseAnonKey] = useState(
    (import.meta as any).env.VITE_SUPABASE_ANON_KEY || ''
  );

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      updateSettings({
        business_name: businessName.trim(),
        gstin: gstin.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        receipt_prefix: receiptPrefix.trim(),
        currency,
      });
      addToast('Company and receipt settings saved successfully', 'success');
    } catch {
      addToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          System Settings & Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure business identity, receipt numbering format, Supabase database synchronization, and role permissions
        </p>
      </div>

      {/* 1. Company Profile & Receipt Template */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Building className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Company & Receipt Template
          </h2>
        </div>

        <form onSubmit={handleSaveCompanySettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Legal Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company GSTIN
              </label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Office Registered Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Support Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Billing Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Receipt Number Prefix
              </label>
              <input
                type="text"
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-400">Generated e.g. WR-PAY-00001</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currency}
                disabled
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-semibold text-slate-700"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Company Details'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Personal Owner Access & Security */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            Owner Profile & Security
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Registered Owner:</span>
              <span className="font-semibold text-indigo-700">Aryan Rajput</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                OWNER
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Private personal WebRajya control center. Single owner access enabled.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Supabase Infrastructure Engine */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Supabase PostgreSQL Connection
            </h2>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isSupabaseLive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseLive ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'
              }`}
            />
            {isSupabaseLive ? 'Live Supabase Connected' : 'High-Fidelity Storage Active'}
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          The application is fully wired with PostgreSQL schemas in{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px]">
            supabase/schema.sql
          </code>{' '}
          including automated receipt sequences and Row-Level Security policies.
        </p>

        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="font-semibold text-slate-700 block mb-1">
              Supabase Project URL:
            </span>
            <input
              type="text"
              readOnly
              value={supabaseUrl || 'https://your-project.supabase.co (Using local high-fidelity layer)'}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-600 font-mono"
            />
          </div>
          <div>
            <span className="font-semibold text-slate-700 block mb-1">
              Supabase Anon Key:
            </span>
            <input
              type="password"
              readOnly
              value={supabaseAnonKey || '••••••••••••••••••••••••••••••••••••••••'}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-600 font-mono"
            />
          </div>
        </div>
      </div>

      {/* 4. Production Reset */}
      <div className="bg-white rounded-xl border border-red-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 border-b border-red-100 pb-3">
          <Trash2 className="w-4 h-4 text-red-600" />
          <h2 className="text-sm font-bold text-red-900 uppercase tracking-wide">
            Production Data Management
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-50/60 border border-red-100">
          <div>
            <h3 className="text-sm font-bold text-red-900">Purge Demo / Sample Data</h3>
            <p className="text-xs text-red-700 mt-0.5">
              Clear all clients, subscriptions, payments, and activity logs to get a 100% clean production starting state.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete all sample clients, subscriptions, and payments? This action cannot be undone.')) {
                resetAllProductionData();
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
          >
            Clear All Demo Data
          </button>
        </div>
      </div>

      {/* 5. Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <History className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
            System Activity & Audit Trail
          </h2>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No audit logs recorded yet.
            </div>
          ) : (
            events.map((ev: ActivityEvent) => (
              <div key={ev.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                <div>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded mr-2">
                    {ev.event_type}
                  </span>
                  <span className="text-slate-800 font-medium">{ev.description}</span>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {formatDateTimeDisplay(ev.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
