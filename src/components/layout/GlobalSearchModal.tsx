import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, CreditCard, Receipt, X, ArrowRight } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatCurrency, formatDateDisplay } from '../../lib/dateUtils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { clients, subscriptions, payments } = useData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open via custom event or parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return { clients: [], subscriptions: [], payments: [] };
    const q = query.toLowerCase().trim();

    const matchedClients = clients
      .filter(
        (c) =>
          c.business_name.toLowerCase().includes(q) ||
          (c.owner_name && c.owner_name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.gstin && c.gstin.toLowerCase().includes(q))
      )
      .slice(0, 5);

    const matchedSubscriptions = subscriptions
      .filter(
        (s) =>
          (s.client?.business_name && s.client.business_name.toLowerCase().includes(q)) ||
          (s.product?.name && s.product.name.toLowerCase().includes(q)) ||
          (s.plan?.name && s.plan.name.toLowerCase().includes(q))
      )
      .slice(0, 5);

    const matchedPayments = payments
      .filter(
        (p) =>
          p.receipt_number.toLowerCase().includes(q) ||
          (p.transaction_reference && p.transaction_reference.toLowerCase().includes(q)) ||
          (p.client?.business_name && p.client.business_name.toLowerCase().includes(q))
      )
      .slice(0, 5);

    return {
      clients: matchedClients,
      subscriptions: matchedSubscriptions,
      payments: matchedPayments,
    };
  }, [query, clients, subscriptions, payments]);

  const hasResults =
    filteredResults.clients.length > 0 ||
    filteredResults.subscriptions.length > 0 ||
    filteredResults.payments.length > 0;

  if (!isOpen) return null;

  return (
    <div
      id="global-search-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, phones, products, subscriptions, receipts..."
            className="w-full text-slate-800 text-sm focus:outline-none placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-300 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Type to search clients, subscriptions, receipts, or phone numbers...
            </div>
          ) : !hasResults ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No results found for &ldquo;<span className="font-semibold text-slate-700">{query}</span>&rdquo;
            </div>
          ) : (
            <>
              {/* Clients Group */}
              {filteredResults.clients.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Clients
                  </h4>
                  <div className="space-y-1">
                    {filteredResults.clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => {
                          onClose();
                          navigate(`/clients/${client.id}`);
                        }}
                        className="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600">
                            {client.business_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {client.owner_name} • {client.phone || client.email || 'No contact'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subscriptions Group */}
              {filteredResults.subscriptions.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Subscriptions
                  </h4>
                  <div className="space-y-1">
                    {filteredResults.subscriptions.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onClose();
                          navigate(`/clients/${sub.client_id}`);
                        }}
                        className="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600">
                            {sub.product?.name} ({sub.plan?.name || 'Custom Plan'})
                          </p>
                          <p className="text-xs text-slate-500">
                            {sub.client?.business_name} • {formatCurrency(sub.amount)} • Expires {formatDateDisplay(sub.end_date)}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {sub.status}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments Group */}
              {filteredResults.payments.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-2 mb-1.5 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" /> Payments
                  </h4>
                  <div className="space-y-1">
                    {filteredResults.payments.map((payment) => (
                      <button
                        key={payment.id}
                        onClick={() => {
                          onClose();
                          navigate(`/payments`);
                        }}
                        className="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors group"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 font-mono">
                            {payment.receipt_number}
                          </p>
                          <p className="text-xs text-slate-500">
                            {payment.client?.business_name} • {formatDateDisplay(payment.payment_date)} • {payment.payment_method}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-emerald-600">
                          {formatCurrency(payment.amount)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
