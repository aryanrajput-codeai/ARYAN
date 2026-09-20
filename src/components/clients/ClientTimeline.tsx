import React from 'react';
import {
  CreditCard,
  Receipt,
  Bell,
  RefreshCw,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { SubscriptionEvent } from '../../types';
import { formatDateTimeDisplay } from '../../lib/dateUtils';

interface ClientTimelineProps {
  events: SubscriptionEvent[];
}

export const ClientTimeline: React.FC<ClientTimelineProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        No recorded timeline events for this client yet.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION_CREATED':
        return <CreditCard className="w-4 h-4 text-indigo-600" />;
      case 'PAYMENT_RECEIVED':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case 'REMINDER_SENT':
      case 'REMINDER_CREATED':
        return <Bell className="w-4 h-4 text-amber-600" />;
      case 'SUBSCRIPTION_RENEWED':
        return <RefreshCw className="w-4 h-4 text-sky-600" />;
      case 'SUBSCRIPTION_EXPIRED':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION_CREATED':
        return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'PAYMENT_RECEIVED':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'REMINDER_SENT':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'SUBSCRIPTION_RENEWED':
        return 'bg-sky-50 border-sky-200 text-sky-700';
      case 'SUBSCRIPTION_EXPIRED':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((event) => (
        <div key={event.id} className="relative group">
          {/* Dot */}
          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-indigo-500 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-indigo-600" />
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${getEventBadge(
                    event.event_type
                  )}`}
                >
                  {getEventIcon(event.event_type)}
                  {event.event_type.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                <Clock className="w-3 h-3" />
                {formatDateTimeDisplay(event.created_at)}
              </span>
            </div>
            <p className="text-sm text-slate-800 font-medium">{event.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
