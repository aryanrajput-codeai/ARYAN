import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { calculateSubscriptionEndDate, getTodayISO, formatDateDisplay } from '../../lib/dateUtils';
import { PaymentMethod } from '../../types';

interface SubscriptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedClientId?: string;
}

export const SubscriptionFormModal: React.FC<SubscriptionFormModalProps> = ({
  isOpen,
  onClose,
  preselectedClientId,
}) => {
  const { clients, products, plans, addSubscription } = useData();
  const { addToast } = useToast();

  const [clientId, setClientId] = useState('');
  const [productId, setProductId] = useState('');
  const [planId, setPlanId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [startDate, setStartDate] = useState(getTodayISO());
  const [autoRenew, setAutoRenew] = useState(false);
  const [notes, setNotes] = useState('');

  // Payment creation fields
  const [paymentOption, setPaymentOption] = useState<'PAID' | 'PARTIAL' | 'PENDING'>('PAID');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      setClientId(preselectedClientId || (clients[0]?.id ?? ''));
      const activeProducts = products.filter((p) => p.is_active);
      const defaultProduct = activeProducts[0];
      if (defaultProduct) {
        setProductId(defaultProduct.id);
        const productPlans = plans.filter((pl) => pl.product_id === defaultProduct.id && pl.is_active);
        if (productPlans[0]) {
          setPlanId(productPlans[0].id);
          setAmount(productPlans[0].price);
          setPaidAmount(productPlans[0].price);
        } else {
          setPlanId('');
          setAmount(0);
          setPaidAmount(0);
        }
      }
      setStartDate(getTodayISO());
      setPaymentOption('PAID');
      setPaymentMethod('UPI');
      setTransactionRef('');
      setAutoRenew(false);
      setNotes('');
    }
  }, [isOpen, preselectedClientId, clients, products, plans]);

  // Available plans for currently selected product
  const availablePlans = useMemo(() => {
    return plans.filter((pl) => pl.product_id === productId && pl.is_active);
  }, [plans, productId]);

  // When product changes, update plan and amount
  const handleProductChange = (newProdId: string) => {
    setProductId(newProdId);
    const prodPlans = plans.filter((pl) => pl.product_id === newProdId && pl.is_active);
    if (prodPlans[0]) {
      setPlanId(prodPlans[0].id);
      setAmount(prodPlans[0].price);
      if (paymentOption === 'PAID') {
        setPaidAmount(prodPlans[0].price);
      }
    } else {
      setPlanId('');
      setAmount(0);
      setPaidAmount(0);
    }
  };

  // When plan changes, update default price
  const handlePlanChange = (newPlanId: string) => {
    setPlanId(newPlanId);
    const plan = availablePlans.find((pl) => pl.id === newPlanId);
    if (plan) {
      setAmount(plan.price);
      if (paymentOption === 'PAID') {
        setPaidAmount(plan.price);
      }
    }
  };

  // Calculate duration in months
  const selectedPlan = availablePlans.find((pl) => pl.id === planId);
  const durationMonths = selectedPlan ? selectedPlan.duration_months : 12;

  // Auto-calculated end date
  const calculatedEndDate = useMemo(() => {
    if (!startDate) return '';
    return calculateSubscriptionEndDate(startDate, durationMonths);
  }, [startDate, durationMonths]);

  // Outstanding amount calculation
  const amountDue = useMemo(() => {
    if (paymentOption === 'PAID') return 0;
    if (paymentOption === 'PENDING') return amount;
    return Math.max(0, amount - (paidAmount || 0));
  }, [paymentOption, amount, paidAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      addToast('Please select a client', 'error');
      return;
    }
    if (!productId) {
      addToast('Please select a product', 'error');
      return;
    }
    if (amount <= 0) {
      addToast('Please enter a valid subscription amount', 'error');
      return;
    }
    if (paymentOption === 'PARTIAL' && (paidAmount <= 0 || paidAmount >= amount)) {
      addToast('Partial payment amount must be greater than 0 and less than total amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addSubscription({
        client_id: clientId,
        product_id: productId,
        plan_id: planId || undefined,
        amount,
        start_date: startDate,
        auto_renew: autoRenew,
        notes: notes.trim() || undefined,
        payment_option: paymentOption,
        paid_amount: paymentOption === 'PAID' ? amount : paymentOption === 'PARTIAL' ? paidAmount : 0,
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create subscription';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Subscription"
      subtitle="Establish subscription term, auto-calculate expiry date, and track payment"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Client *
          </label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">Select a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.business_name} {c.owner_name ? `(${c.owner_name})` : ''} - {c.city || 'No City'}
              </option>
            ))}
          </select>
        </div>

        {/* Product & Plan Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Product *
            </label>
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              {products
                .filter((p) => p.is_active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Plan Term *
            </label>
            <select
              value={planId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              {availablePlans.length > 0 ? (
                availablePlans.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name} ({pl.duration_months} mo) — ₹{pl.price.toLocaleString('en-IN')}
                  </option>
                ))
              ) : (
                <option value="">Custom Plan</option>
              )}
            </select>
          </div>
        </div>

        {/* Amount & Date Calculation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subscription Amount (₹) *
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
            <span className="text-[11px] text-slate-400">Allows custom discount/pricing</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              End Date (Auto-calculated)
            </label>
            <div className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-semibold text-indigo-700">
              {formatDateDisplay(calculatedEndDate)}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{calculatedEndDate}</span>
          </div>
        </div>

        {/* Payment Creation Section */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Payment Settlement
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
                  {opt === 'PAID' ? 'Full Payment' : opt === 'PARTIAL' ? 'Partial' : 'Payment Pending'}
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
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Transaction Ref / UTR
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI/581902849"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Financial summary bar */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
            <span className="text-slate-500">
              Auto Receipt Number: <strong className="font-mono text-slate-700">WR-PAY-AUTO</strong>
            </span>
            <span className="text-slate-700 font-medium">
              Outstanding Amount:{' '}
              <strong className={amountDue > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600'}>
                ₹{amountDue.toLocaleString('en-IN')}
              </strong>
            </span>
          </div>
        </div>

        {/* Notes & Auto-renew */}
        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>Enable Auto-Renew Flag</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional subscription notes..."
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
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
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Subscription'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
