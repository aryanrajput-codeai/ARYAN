import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { MessageCircle, Copy, Send, Sparkles, FileText, Check } from 'lucide-react';
import { Subscription } from '../../types';
import { formatDateDisplay, formatCurrency } from '../../lib/dateUtils';

interface NotificationTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
}

export const NotificationTemplatesModal: React.FC<NotificationTemplatesModalProps> = ({
  isOpen,
  onClose,
  subscription,
}) => {
  const { settings, sendReminder } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'RENEWAL_30' | 'URGENT_7' | 'PAYMENT_RECEIPT'>('RENEWAL_30');
  const [copied, setCopied] = useState(false);

  if (!subscription) return null;

  const client = subscription.client;
  const product = subscription.product;
  const plan = subscription.plan;

  const clientName = client?.business_name || 'Valued Client';
  const ownerName = client?.owner_name || '';
  const phone = client?.phone || '';
  const productName = product?.name || 'Software Subscription';
  const planName = plan?.name || 'Annual Plan';
  const endDate = formatDateDisplay(subscription.end_date);
  const amount = formatCurrency(subscription.amount);
  const portalUrl = `${window.location.origin}/portal/${subscription.client_id}`;

  const defaultTemplates = {
    RENEWAL_30: `Hello ${clientName}${ownerName ? ` (${ownerName})` : ''},\n\nThis is a friendly reminder from *${settings.business_name}* that your subscription for *${productName}* (${planName}) is due for renewal on *${endDate}*.\n\n💰 Contract Value: ${amount}\n🔗 Access your invoice & portal: ${portalUrl}\n\nPlease let us know if you'd like to renew or have any questions!\n\nBest regards,\n*${settings.business_name}*`,
    URGENT_7: `⚠️ *URGENT RENEWAL NOTICE*\n\nDear ${clientName},\nYour license for *${productName}* will expire in 7 days on *${endDate}*.\n\nTo prevent any interruption in your software services, please complete the renewal payment of *${amount}*.\n\n🔗 View Bill & Pay: ${portalUrl}\n\nThank you,\n*${settings.business_name}*`,
    PAYMENT_RECEIPT: `✅ *PAYMENT CONFIRMED*\n\nDear ${clientName},\nWe have received your payment of *${amount}* for *${productName}*.\n\nYour software license has been renewed through *${endDate}*.\n\n📄 Download Official Tax Invoice: ${portalUrl}\n\nThank you for choosing *${settings.business_name}*!`,
  };

  const [customText, setCustomText] = useState(defaultTemplates[activeTab]);

  const handleTabChange = (tab: 'RENEWAL_30' | 'URGENT_7' | 'PAYMENT_RECEIPT') => {
    setActiveTab(tab);
    setCustomText(defaultTemplates[tab]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    addToast('Message template copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = async () => {
    if (!phone) {
      addToast('Client does not have a registered phone number', 'error');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(customText)}`, '_blank');
    await sendReminder(subscription.id, 'WHATSAPP');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification & WhatsApp Template Dispatcher"
      subtitle={`Target Client: ${clientName}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Template Selector Tabs */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('RENEWAL_30')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'RENEWAL_30'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            30-Day Expiry Notice
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('URGENT_7')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'URGENT_7'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            7-Day Urgent Warning
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('PAYMENT_RECEIPT')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'PAYMENT_RECEIPT'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Payment Confirmation
          </button>
        </div>

        {/* Dynamic Variable Chips */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
          <span className="font-bold text-slate-700 block">Available Dynamic Variables:</span>
          <div className="flex flex-wrap gap-1.5 font-mono">
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-indigo-700">{clientName}</span>
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-indigo-700">{productName}</span>
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-indigo-700">{endDate}</span>
            <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-indigo-700">{amount}</span>
          </div>
        </div>

        {/* Editable Message Box */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Message Preview & Customization
          </label>
          <textarea
            rows={7}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-xl text-xs font-sans text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 leading-relaxed"
          />
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#18A86B] hover:bg-[#148F5B] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
