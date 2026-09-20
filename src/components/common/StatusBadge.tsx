import React from 'react';
import { SubscriptionStatus, ClientStatus, ReminderStatus } from '../../types';

interface StatusBadgeProps {
  status: SubscriptionStatus | ClientStatus | ReminderStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toUpperCase();

  let colorClasses = 'bg-[#F7F8FA] text-[#687080] border-[#E7E9EE]';
  let dotClasses = 'bg-[#8D95A5]';
  let label = normalized;

  switch (normalized) {
    case 'ACTIVE':
      colorClasses = 'bg-[#EAF8F2] text-[#18A86B] border-[#18A86B]/20';
      dotClasses = 'bg-[#18A86B]';
      label = 'Active';
      break;
    case 'EXPIRING_SOON':
      colorClasses = 'bg-[#FFF6DF] text-[#D99000] border-[#D99000]/20';
      dotClasses = 'bg-[#D99000]';
      label = 'Expiring Soon';
      break;
    case 'EXPIRED':
      colorClasses = 'bg-[#FFF0F3] text-[#D94B63] border-[#D94B63]/20';
      dotClasses = 'bg-[#D94B63]';
      label = 'Expired';
      break;
    case 'CANCELLED':
    case 'INACTIVE':
      colorClasses = 'bg-[#F7F8FA] text-[#687080] border-[#E7E9EE]';
      dotClasses = 'bg-[#8D95A5]';
      label = normalized === 'CANCELLED' ? 'Cancelled' : 'Inactive';
      break;
    case 'PENDING':
      colorClasses = 'bg-[#EEF0FF] text-[#5B5CE2] border-[#5B5CE2]/20';
      dotClasses = 'bg-[#5B5CE2]';
      label = 'Pending';
      break;
    case 'SENT':
    case 'COMPLETED':
      colorClasses = 'bg-[#EAF8F2] text-[#18A86B] border-[#18A86B]/20';
      dotClasses = 'bg-[#18A86B]';
      label = normalized === 'SENT' ? 'Sent' : 'Completed';
      break;
    case 'VOIDED':
      colorClasses = 'bg-[#FFF0F3] text-[#D94B63] border-[#D94B63]/20';
      dotClasses = 'bg-[#D94B63]';
      label = 'Voided';
      break;
    case 'DISMISSED':
      colorClasses = 'bg-[#F7F8FA] text-[#9AA2B1] border-[#E7E9EE]';
      dotClasses = 'bg-[#9AA2B1]';
      label = 'Dismissed';
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border whitespace-nowrap tracking-tight transition-colors ${sizeClasses} ${colorClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${dotClasses}`} />
      {label}
    </span>
  );
};
