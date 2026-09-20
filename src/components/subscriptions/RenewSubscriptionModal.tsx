import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Subscription, PaymentMethod } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import {
  calculateSubscriptionEndDate,
  calculateNextRenewalStartDate,
  formatDateDisplay,
  formatCurrency,
  getTodayISO,
} from '../../lib/dateUtils';

interface RenewSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
}

export const RenewSubscriptionModal: React.FC<RenewSubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
}) => {
  const { plans, renewSubscription } = useData();
  const { addToast } = useToast();

  const [planId, setPlanId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Payment settlement
  const [paymentOption, setPaymentOption] = useState<'PAID' | 'PARTIAL' | 'PENDING'>('PAID');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available plans for this product
  const availablePlans = useMemo(() => {
    if (!subscription) return [];
    return plans.filter((p) => p.product_id === subscription.product_id && p.is_active);
  }, [plans, subscription]);

  // When opened, calculate non-overlapping next start date
  useEffect(() => {
    if (subscription && isOpen) {
      // If current subscription end date is in the future, start next day.
      // If already expired in the past, start today.
      const today = getTodayISO();
      const calculatedStart =
        subscription.end_date >= today
          ? calculateNextRenewalStartDate(subscription.end_date)
          : today;

      setStartDate(calculatedStart);

      // Default plan to existing plan or first available
      const defaultPlan =
        availablePlans.find((p) => p.id === subscription.plan_id) || availablePlans[0];

      if (defaultPlan) {
        setPlanId(defaultPlan.id);
        setAmount(defaultPlan.price);
        setPaidAmount(defaultPlan.price);
      } else {
        setPlanId('');
        setAmount(subscription.amount);
        setPaidAmount(subscription.amount);
      }

      setPaymentOption('PAID');
      setPaymentMethod('UPI');
      setTransactionRef('');
      setNotes(`Renewal for ${subscription.product?.name || 'product'} term`);
    }
  }, [subscription, isOpen, availablePlans]);

  const selectedPlan = availablePlans.find((p) => p.id === planId);
  const durationMonths = selectedPlan ? selectedPlan.duration_months : 12;

  const calculatedEndDate = useMemo(() => {
    if (!startDate) return '';
    return calculateSubscriptionEndDate(startDate, durationMonths);
  }, [startDate, durationMonths]);

  const handlePlanChange = (newPlanId: string) => {
    setPlanId(newPlanId);
    const plan = availablePlans.find((p) => p.id === newPlanId);
    if (plan) {
      setAmount(plan.price);
      if (paymentOption === 'PAID') {
        setPaidAmount(plan.price);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription) return;
    if (amount <= 0) {
      addToast('Please enter a valid renewal amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await renewSubscription({
        subscription_id: subscription.id,
        plan_id: planId || undefined,
        start_date: startDate,
        duration_months: durationMonths,
        amount,
        notes: notes.trim() || undefined,
        payment_option: paymentOption,
        paid_amount: paymentOption === 'PAID' ? amount : paymentOption === 'PARTIAL' ? paidAmount : 0,
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Renewal failed';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!subscription) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Renew Subscription"
      subtitle={`Extend license term for ${subscription.client?.business_name}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Existing Term Summary Box */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-slate-400 block font-medium">Client</span>
            <strong className="text-slate-900 font-semibold">{subscription.client?.business_name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Current Product</span>
            <strong className="text-slate-900 font-semibold">{subscription.product?.name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Current Expiry</span>
            <strong className="text-rose-700 font-semibold">{formatDateDisplay(subscription.end_date)}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Previous Fee</span>
            <strong className="text-slate-900 font-semibold">{formatCurrency(subscription.amount)}</strong>
          </div>
        </div>

        {/* Renewal Plan & Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Renewal Plan *
            </label>
            <select
              value={planId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {availablePlans.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name} ({pl.duration_months} mo) — ₹{pl.price.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Renewal Amount (₹) *
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={amount}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setAmount(val);
                if (paymentOption === 'PAID') setPaidAmount(val);
              }}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Non-overlapping Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Cycle Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="text-[11px] text-slate-500">Starts day after previous expiry</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Cycle End Date (Auto-calculated)
            </label>
            <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-semibold text-indigo-700">
              {formatDateDisplay(calculatedEndDate)}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{calculatedEndDate}</span>
          </div>
        </div>

        {/* Settlement options */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Renewal Payment Settlement
            </h4>
            <div className="flex gap-2">
              {(['PAID', 'PARTIAL', 'PENDING'] as const).map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => {
                    setPaymentOption(opt);
                    if (opt === 'PAID') setPaidAmount(amount);
                    if (opt === 'PENDING') setPaidAmount(0);
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                    paymentOption === opt
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {opt === 'PAID' ? 'Full Payment' : opt === 'PARTIAL' ? 'Partial' : 'Pending'}
                </button>
              ))}
            </div>
          </div>

          {paymentOption !== 'PENDING' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={amount}
                  value={paidAmount}
                  disabled={paymentOption === 'PAID'}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  UTR / Reference
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI/602910482"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Renewal Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
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
            {isSubmitting ? 'Processing Renewal...' : 'Renew Subscription'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
