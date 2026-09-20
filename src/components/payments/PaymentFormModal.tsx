import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { getTodayISO } from '../../lib/dateUtils';
import { PaymentMethod } from '../../types';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedClientId?: string;
  preselectedSubscriptionId?: string;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen,
  onClose,
  preselectedClientId,
  preselectedSubscriptionId,
}) => {
  const { clients, subscriptions, recordPayment } = useData();
  const { addToast } = useToast();

  const [clientId, setClientId] = useState('');
  const [subscriptionId, setSubscriptionId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(getTodayISO());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClientId(preselectedClientId || clients[0]?.id || '');
      setSubscriptionId(preselectedSubscriptionId || '');
      setPaymentDate(getTodayISO());
      setPaymentMethod('UPI');
      setTransactionRef('');
      setNotes('');

      if (preselectedSubscriptionId) {
        const sub = subscriptions.find((s) => s.id === preselectedSubscriptionId);
        if (sub) {
          setAmount(sub.outstanding_balance || sub.amount);
        }
      } else {
        setAmount(5000);
      }
    }
  }, [isOpen, preselectedClientId, preselectedSubscriptionId, clients, subscriptions]);

  const clientSubscriptions = subscriptions.filter((s) => s.client_id === clientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      addToast('Please select a client', 'error');
      return;
    }
    if (amount <= 0) {
      addToast('Please enter a valid payment amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPayment({
        client_id: clientId,
        subscription_id: subscriptionId || undefined,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Subscription Payment"
      subtitle="Issue a receipt and record payment settlement"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Client *
          </label>
          <select
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setSubscriptionId('');
            }}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.business_name} {c.owner_name ? `(${c.owner_name})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Linked Subscription (Optional)
          </label>
          <select
            value={subscriptionId}
            onChange={(e) => {
              const sId = e.target.value;
              setSubscriptionId(sId);
              const sub = subscriptions.find((s) => s.id === sId);
              if (sub && sub.outstanding_balance) {
                setAmount(sub.outstanding_balance);
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">No linked subscription (Direct credit)</option>
            {clientSubscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.product?.name} ({s.plan?.name || `${s.amount}`}) — Due: ₹{(s.outstanding_balance || 0).toLocaleString('en-IN')}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              min="1"
              step="100"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Transaction Ref / UTR
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UPI/329201948201"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment details, check number, or remarks..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
