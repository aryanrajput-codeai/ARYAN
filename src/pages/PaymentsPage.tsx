import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Printer,
  CreditCard,
  Building,
  Smartphone,
  Wallet,
  Ban,
  AlertTriangle,
  FileText,
  Trash2,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Payment, PaymentMethod } from '../types';
import { formatCurrency, formatDateDisplay } from '../lib/dateUtils';
import { StatusBadge } from '../components/common/StatusBadge';
import { PaymentFormModal } from '../components/payments/PaymentFormModal';
import { ReceiptModal } from '../components/payments/ReceiptModal';
import { InvoiceModal } from '../components/payments/InvoiceModal';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

export const PaymentsPage: React.FC = () => {
  const { payments, voidPayment, deletePayment } = useData();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'VOIDED'>('ALL');

  // Modals state
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);
  const [paymentToVoid, setPaymentToVoid] = useState<Payment | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  // Revenue analytics (Excluding VOIDED payments for financial accuracy)
  const completedPayments = useMemo(
    () => payments.filter((p) => p.status !== 'VOIDED'),
    [payments]
  );

  const totalCollections = useMemo(
    () => completedPayments.reduce((sum, p) => sum + p.amount, 0),
    [completedPayments]
  );
  const upiCollections = useMemo(
    () =>
      completedPayments
        .filter((p) => p.payment_method === 'UPI')
        .reduce((sum, p) => sum + p.amount, 0),
    [completedPayments]
  );
  const bankCollections = useMemo(
    () =>
      completedPayments
        .filter((p) => p.payment_method === 'BANK_TRANSFER')
        .reduce((sum, p) => sum + p.amount, 0),
    [completedPayments]
  );
  const cashCollections = useMemo(
    () =>
      completedPayments
        .filter((p) => p.payment_method === 'CASH')
        .reduce((sum, p) => sum + p.amount, 0),
    [completedPayments]
  );

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p: Payment) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.receipt_number.toLowerCase().includes(q) ||
        (p.client?.business_name && p.client.business_name.toLowerCase().includes(q)) ||
        (p.transaction_reference && p.transaction_reference.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q));

      const matchesMethod = methodFilter === 'ALL' || p.payment_method === methodFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' && p.status !== 'VOIDED') ||
        (statusFilter === 'VOIDED' && p.status === 'VOIDED');

      return matchesQuery && matchesMethod && matchesStatus;
    });
  }, [payments, searchQuery, methodFilter, statusFilter]);

  // Handle Void
  const handleConfirmVoid = async () => {
    if (!paymentToVoid) return;
    if (!voidReason.trim()) {
      setVoidError('Please provide a reason for voiding this payment.');
      return;
    }

    try {
      setIsVoiding(true);
      setVoidError(null);
      await voidPayment(paymentToVoid.id, voidReason.trim());
      setPaymentToVoid(null);
      setVoidReason('');
    } catch (err: any) {
      setVoidError(err.message || 'Failed to void payment');
    } finally {
      setIsVoiding(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Receipt Number',
      'Status',
      'Payment Date',
      'Client',
      'Amount (INR)',
      'Method',
      'Transaction Reference',
      'Void Reason',
      'Notes',
    ];
    const rows = filteredPayments.map((p: Payment) => [
      p.receipt_number,
      p.status || 'COMPLETED',
      p.payment_date,
      `"${p.client?.business_name || ''}"`,
      p.amount,
      p.payment_method,
      `"${p.transaction_reference || ''}"`,
      `"${p.void_reason || ''}"`,
      `"${p.notes || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WebRajya_Payments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171A21]">
            Payment Records & Receipts
          </h1>
          <p className="text-xs text-[#687080] mt-0.5">
            Audit trail of client settlements, receipts, and payment channels
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="btn-secondary px-3.5 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-[#687080]" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-record-payment"
            onClick={() => setIsRecordPaymentOpen(true)}
            className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-[#687080] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Received</span>
            <Wallet className="w-4 h-4 text-[#18A86B]" />
          </div>
          <span className="text-2xl font-bold text-[#171A21] font-mono mt-1 block">
            {formatCurrency(totalCollections)}
          </span>
          <span className="text-[11px] text-[#687080] block mt-0.5">
            {completedPayments.length} verified receipts
          </span>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-[#687080] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">UPI Collections</span>
            <Smartphone className="w-4 h-4 text-[#5B5CE2]" />
          </div>
          <span className="text-2xl font-bold text-[#171A21] font-mono mt-1 block">
            {formatCurrency(upiCollections)}
          </span>
          <span className="text-[11px] text-[#687080] block mt-0.5">Instant QR & VPA</span>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-[#687080] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Bank Transfers</span>
            <Building className="w-4 h-4 text-[#5B5CE2]" />
          </div>
          <span className="text-2xl font-bold text-[#171A21] font-mono mt-1 block">
            {formatCurrency(bankCollections)}
          </span>
          <span className="text-[11px] text-[#687080] block mt-0.5">NEFT / RTGS / IMPS</span>
        </div>

        <div className="surface-card p-4">
          <div className="flex items-center justify-between text-[#687080] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Cash Collections</span>
            <CreditCard className="w-4 h-4 text-[#D99000]" />
          </div>
          <span className="text-2xl font-bold text-[#171A21] font-mono mt-1 block">
            {formatCurrency(cashCollections)}
          </span>
          <span className="text-[11px] text-[#687080] block mt-0.5">Direct office cash</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#9299A7] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by receipt number, client, or UTR..."
            className="w-full pl-10 pr-4 py-2 text-xs input-search"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#687080]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs input-search bg-white px-2.5 py-2 font-medium"
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Active (Completed)</option>
              <option value="VOIDED">Voided</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#687080]">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="text-xs input-search bg-white px-2.5 py-2 font-medium"
            >
              <option value="ALL">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No payments found"
          description="No payment records match your search or filter."
          actionLabel="Record New Payment"
          onAction={() => setIsRecordPaymentOpen(true)}
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#E7E9EE] text-[#687080] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Receipt Number</th>
                  <th className="p-3.5">Payment Date</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Product / License</th>
                  <th className="p-3.5">Method & Reference</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9EE]">
                {filteredPayments.map((p: Payment) => {
                  const isVoided = p.status === 'VOIDED';
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[#F7F8FA] transition-colors ${
                        isVoided ? 'bg-[#FFF0F3]/30' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-[#171A21]">{p.receipt_number}</td>

                      <td className="p-3.5 text-[#687080] font-medium">
                        {formatDateDisplay(p.payment_date)}
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => navigate(`/clients/${p.client_id}`)}
                          className="font-semibold text-[#171A21] hover:text-[#5B5CE2] text-left block truncate max-w-xs transition-colors"
                        >
                          {p.client?.business_name}
                        </button>
                        <span className="text-[11px] text-[#9AA2B1]">{p.client?.owner_name}</span>
                      </td>

                      <td className="p-3.5 text-[#687080]">
                        <p className="font-semibold text-[#171A21]">
                          {p.subscription?.product?.name || 'Direct Credit'}
                        </p>
                        <p className="text-[11px] text-[#687080]">
                          {p.subscription?.plan?.name || 'Subscription settlement'}
                        </p>
                      </td>

                      <td className="p-3.5">
                        <span className="inline-block font-semibold text-[#171A21]">
                          {p.payment_method}
                        </span>
                        {p.transaction_reference && (
                          <span className="block font-mono text-[11px] text-[#687080] mt-0.5">
                            Ref: {p.transaction_reference}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-sm">
                        {isVoided ? (
                          <span className="line-through text-[#9AA2B1] font-semibold">
                            {formatCurrency(p.amount)}
                          </span>
                        ) : (
                          <span className="font-semibold text-[#18A86B]">
                            {formatCurrency(p.amount)}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {isVoided ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF0F3] text-[#D94B63] border border-[#D94B63]/20"
                            title={`Voided: ${p.void_reason || 'Administrative correction'}`}
                          >
                            VOIDED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF8F2] text-[#18A86B] border border-[#18A86B]/20">
                            COMPLETED
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setSelectedInvoice(p)}
                          className="btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                          title="Generate & Download Tax Invoice PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Tax Invoice</span>
                        </button>

                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#687080]" />
                          <span>Receipt</span>
                        </button>

                        {isAdmin && !isVoided && (
                          <button
                            onClick={() => {
                              setPaymentToVoid(p);
                              setVoidReason('');
                              setVoidError(null);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-[#D94B63] bg-[#FFF0F3] hover:bg-[#FFE1E6] rounded-xl border border-[#D94B63]/20 transition-colors inline-flex items-center gap-1"
                            title="Void payment"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Void</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently delete receipt #${p.receipt_number}?`)) {
                              deletePayment(p.id);
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors inline-flex items-center gap-1"
                          title="Permanently delete payment record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Void Payment Confirmation Modal */}
      <Modal
        isOpen={Boolean(paymentToVoid)}
        onClose={() => {
          if (!isVoiding) {
            setPaymentToVoid(null);
            setVoidReason('');
            setVoidError(null);
          }
        }}
        title="Void Payment Record"
        subtitle={`Receipt #${paymentToVoid?.receipt_number}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="bg-[#FFF0F3] border border-[#D94B63]/20 rounded-xl p-4 text-xs text-[#D94B63] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#D94B63] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Financial Reversal Warning</p>
              <p className="mt-1 leading-relaxed">
                Voiding a payment will nullify this receipt, deduct ₹
                {paymentToVoid?.amount.toLocaleString('en-IN')} from the subscription&apos;s paid
                balance, and mark it on the client ledger.
              </p>
            </div>
          </div>

          {voidError && (
            <div className="p-3 bg-[#FFF0F3] border border-[#D94B63]/30 text-[#D94B63] text-xs rounded-xl font-medium">
              {voidError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#171A21] mb-1.5">
              Reason for Voiding <span className="text-[#D94B63]">*</span>
            </label>
            <textarea
              rows={3}
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="e.g., Duplicate entry, bounced check/reversal, or incorrect amount recorded..."
              className="w-full text-xs p-3 input-search"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setPaymentToVoid(null)}
              disabled={isVoiding}
              className="btn-secondary px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmVoid}
              disabled={isVoiding}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#D94B63] hover:bg-[#C23C53] rounded-xl shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors"
            >
              {isVoiding ? 'Voiding...' : 'Confirm Void Payment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modals */}
      <PaymentFormModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
      />
      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
      />
      <InvoiceModal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        payment={selectedInvoice}
      />
    </div>
  );
};
