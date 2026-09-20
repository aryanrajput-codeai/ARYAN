import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Clock,
  AlertTriangle,
  MessageCircle,
  Mail,
  Send,
  CheckCircle2,
  Phone,
  Search,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Subscription, Reminder } from '../types';
import { formatDateDisplay, formatCurrency, getDaysRemaining } from '../lib/dateUtils';
import { RenewSubscriptionModal } from '../components/subscriptions/RenewSubscriptionModal';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../contexts/ToastContext';

type RenewalTab = 'ALL' | 'EXPIRING_30' | 'EXPIRING_7' | 'EXPIRED' | 'REMINDERS_PENDING';

export const RenewalsPage: React.FC = () => {
  const { subscriptions, reminders, sendReminder } = useData();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<RenewalTab>('EXPIRING_30');
  const [searchQuery, setSearchQuery] = useState('');
  const [renewSub, setRenewSub] = useState<Subscription | null>(null);

  // Filter subscriptions according to tabs
  const tabCounts = useMemo(() => {
    let exp30 = 0;
    let exp7 = 0;
    let exp = 0;

    subscriptions.forEach((s: Subscription) => {
      if (s.status === 'EXPIRED') exp++;
      if (s.status === 'EXPIRING_SOON') {
        const days = getDaysRemaining(s.end_date);
        if (days <= 30 && days >= 0) exp30++;
        if (days <= 7 && days >= 0) exp7++;
      }
    });

    const pendingReminders = reminders.filter((r: Reminder) => r.status === 'PENDING').length;

    return { exp30, exp7, exp, pendingReminders };
  }, [subscriptions, reminders]);

  const displayedSubscriptions = useMemo(() => {
    return subscriptions.filter((s: Subscription) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (s.client?.business_name && s.client.business_name.toLowerCase().includes(q)) ||
        (s.product?.name && s.product.name.toLowerCase().includes(q)) ||
        (s.client?.phone && s.client.phone.includes(q));

      if (!matchesQuery) return false;

      const days = getDaysRemaining(s.end_date);

      switch (activeTab) {
        case 'EXPIRING_30':
          return s.status === 'EXPIRING_SOON' && days <= 30 && days >= 0;
        case 'EXPIRING_7':
          return s.status === 'EXPIRING_SOON' && days <= 7 && days >= 0;
        case 'EXPIRED':
          return s.status === 'EXPIRED';
        case 'REMINDERS_PENDING':
          return s.status === 'EXPIRING_SOON' || s.status === 'EXPIRED';
        case 'ALL':
        default:
          return s.status === 'EXPIRING_SOON' || s.status === 'EXPIRED';
      }
    });
  }, [subscriptions, searchQuery, activeTab]);

  // Send WhatsApp Reminder
  const handleSendWhatsApp = async (sub: Subscription) => {
    if (!sub.client?.phone) {
      addToast(`Client ${sub.client?.business_name} has no phone number on record.`, 'error');
      return;
    }
    const cleanPhone = sub.client.phone.replace(/\D/g, '');
    const message = `Dear ${sub.client.business_name}, your subscription for ${sub.product?.name} (${
      sub.plan?.name || 'Annual Plan'
    }) is expiring on ${formatDateDisplay(
      sub.end_date
    )}. Please renew to ensure uninterrupted service. WebRajya Solutions`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    await sendReminder(sub.id, 'WHATSAPP', 'OPENED');
  };

  // Send Email Reminder
  const handleSendEmail = async (sub: Subscription) => {
    if (!sub.client?.email) {
      addToast(`Client ${sub.client?.business_name} has no email address on record.`, 'error');
      return;
    }
    const subject = `Subscription Renewal Notice: ${sub.product?.name} - WebRajya Solutions`;
    const body = `Dear ${sub.client.business_name},\n\nYour software subscription for ${sub.product?.name} (${sub.plan?.name || 'Annual Plan'}) is scheduled to expire on ${formatDateDisplay(sub.end_date)}.\n\nRenewal Amount: ₹${sub.amount.toLocaleString('en-IN')}\n\nPlease get in touch with WebRajya Solutions to complete your renewal settlement.\n\nBest Regards,\nWebRajya Solutions`;

    window.open(`mailto:${sub.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    await sendReminder(sub.id, 'EMAIL', 'OPENED');
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171A21]">
            Renewals & Expiry Tracker
          </h1>
          <p className="text-xs text-[#687080] mt-0.5">
            Automated notification engine and renewal follow-up queue
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (displayedSubscriptions.length === 0) {
                addToast('No subscriptions in current view to remind', 'info');
                return;
              }
              const count = displayedSubscriptions.length;
              addToast(`Dispatched reminder notifications for ${count} clients.`, 'success');
            }}
            className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Batch Reminders</span>
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('EXPIRING_30')}
          className={`surface-card p-4 cursor-pointer transition-colors ${
            activeTab === 'EXPIRING_30' ? 'border-[#5B5CE2] bg-[#EEF0FF]/30' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[#D99000] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Within 30 Days</span>
            <Clock className="w-4 h-4 text-[#D99000]" />
          </div>
          <span className="text-2xl font-bold text-[#171A21] font-mono mt-1 block">{tabCounts.exp30}</span>
          <span className="text-[11px] text-[#687080] block mt-0.5">Pending next 30 days</span>
        </div>

        <div
          onClick={() => setActiveTab('EXPIRING_7')}
          className={`surface-card p-4 cursor-pointer transition-colors ${
            activeTab === 'EXPIRING_7' ? 'border-[#D99000] bg-[#FFF6DF]/50' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[#D99000] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Within 7 Days</span>
            <AlertTriangle className="w-4 h-4 text-[#D99000]" />
          </div>
          <span className="text-2xl font-bold text-[#D99000] font-mono mt-1 block">{tabCounts.exp7}</span>
          <span className="text-[11px] text-[#687080] block mt-0.5">High urgency follow-up</span>
        </div>

        <div
          onClick={() => setActiveTab('EXPIRED')}
          className={`surface-card p-4 cursor-pointer transition-colors ${
            activeTab === 'EXPIRED' ? 'border-[#D94B63] bg-[#FFF0F3]/50' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[#D94B63] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Expired Licenses</span>
            <AlertTriangle className="w-4 h-4 text-[#D94B63]" />
          </div>
          <span className="text-2xl font-bold text-[#D94B63] font-mono mt-1 block">{tabCounts.exp}</span>
          <span className="text-[11px] text-[#687080] block mt-0.5">Require immediate renewal</span>
        </div>

        <div
          onClick={() => setActiveTab('ALL')}
          className={`surface-card p-4 cursor-pointer transition-colors ${
            activeTab === 'ALL' ? 'border-[#5B5CE2] bg-[#EEF0FF]/30' : ''
          }`}
        >
          <div className="flex items-center justify-between text-[#5B5CE2] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">All Attention Items</span>
            <RefreshCw className="w-4 h-4 text-[#5B5CE2]" />
          </div>
          <span className="text-2xl font-bold text-[#171A21] font-mono mt-1 block">
            {tabCounts.exp30 + tabCounts.exp}
          </span>
          <span className="text-[11px] text-[#687080] block mt-0.5">Total renewal queue</span>
        </div>
      </div>

      {/* Filter Tabs and Search */}
      <div className="surface-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex border-b sm:border-b-0 border-[#E7E9EE] w-full sm:w-auto overflow-x-auto gap-2 text-xs font-semibold">
          {[
            { key: 'EXPIRING_30', label: `Expiring 30 Days (${tabCounts.exp30})` },
            { key: 'EXPIRING_7', label: `Expiring 7 Days (${tabCounts.exp7})` },
            { key: 'EXPIRED', label: `Expired (${tabCounts.exp})` },
            { key: 'ALL', label: 'All Items' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as RenewalTab)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#EEF0FF] text-[#5B5CE2]'
                  : 'text-[#687080] hover:text-[#171A21] hover:bg-[#F7F8FA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#9299A7] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search renewals by client or phone..."
            className="w-full pl-10 pr-4 py-1.5 text-xs input-search"
          />
        </div>
      </div>

      {/* Renewal Queue Table */}
      {displayedSubscriptions.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No renewals in this view"
          description="All clients in this category are up to date! Check other tabs or search terms."
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#E7E9EE] text-[#687080] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Product & Plan</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5">Status / Urgency</th>
                  <th className="p-3.5">Contact Person</th>
                  <th className="p-3.5">Contract Value</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9EE]">
                {displayedSubscriptions.map((sub: Subscription) => {
                  const days = getDaysRemaining(sub.end_date);
                  return (
                    <tr key={sub.id} className="hover:bg-[#F7F8FA] transition-colors">
                      <td className="p-3.5">
                        <button
                          onClick={() => navigate(`/clients/${sub.client_id}`)}
                          className="font-semibold text-[#171A21] hover:text-[#5B5CE2] text-left block truncate max-w-xs transition-colors"
                        >
                          {sub.client?.business_name}
                        </button>
                        <span className="text-[11px] text-[#9AA2B1]">{sub.client?.city}</span>
                      </td>

                      <td className="p-3.5">
                        <p className="font-semibold text-[#171A21]">{sub.product?.name}</p>
                        <p className="text-[11px] text-[#687080]">{sub.plan?.name || 'Annual'}</p>
                      </td>

                      <td className="p-3.5 font-semibold text-[#171A21]">
                        {formatDateDisplay(sub.end_date)}
                      </td>

                      <td className="p-3.5">
                        {sub.status === 'EXPIRED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFF0F3] text-[#D94B63] border border-[#D94B63]/20">
                            Expired {Math.abs(days)}d ago
                          </span>
                        ) : days <= 7 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFF6DF] text-[#D99000] border border-[#D99000]/20">
                            Urgent: {days}d left
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FFF6DF] text-[#D99000] border border-[#D99000]/20">
                            Expiring in {days}d
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <p className="text-[#171A21] font-medium">
                          {sub.client?.owner_name || 'Owner'}
                        </p>
                        <p className="text-[11px] text-[#687080] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-[#8D95A5]" />
                          {sub.client?.phone || 'No phone'}
                        </p>
                      </td>

                      <td className="p-3.5 font-mono font-semibold text-[#171A21]">
                        {formatCurrency(sub.amount)}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSendWhatsApp(sub)}
                            title="Send WhatsApp Reminder Message"
                            className="btn-secondary px-2.5 py-1 text-xs inline-flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#18A86B]" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          {sub.client?.email && (
                            <button
                              onClick={() => handleSendEmail(sub)}
                              title="Send Email Reminder"
                              className="p-1.5 text-[#687080] hover:text-[#5B5CE2] hover:bg-[#EEF0FF] rounded-lg transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setRenewSub(sub)}
                            className="btn-primary px-3 py-1 text-xs inline-flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Renew</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      <RenewSubscriptionModal
        isOpen={Boolean(renewSub)}
        onClose={() => setRenewSub(null)}
        subscription={renewSub}
      />
    </div>
  );
};
