import React, { useState, useMemo } from 'react';
import {
  Headphones,
  Plus,
  Search,
  Filter,
  MessageCircle,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Edit2,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { SupportTicket, TicketStatus } from '../types';
import { formatDateDisplay } from '../lib/dateUtils';
import { TicketModal } from '../components/tickets/TicketModal';
import { EmptyState } from '../components/common/EmptyState';

export const TicketsPage: React.FC = () => {
  const { tickets, updateTicketStatus, deleteSupportTicket } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('OPEN');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketToEdit, setTicketToEdit] = useState<SupportTicket | null>(null);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        t.ticket_number.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.client?.business_name && t.client.business_name.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;

  const handleWhatsAppReply = (t: SupportTicket) => {
    if (!t.client?.phone) {
      alert(`Client ${t.client?.business_name} does not have a phone number.`);
      return;
    }
    const cleanPhone = t.client.phone.replace(/\D/g, '');
    const message = `Hello ${t.client.business_name}, regarding your WebRajya Support Ticket #${t.ticket_number} (${t.subject}):\n\n${t.admin_reply || 'Our technical team is working on your request.'}\n\nWebRajya Support`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171A21]">
            Client Support & Maintenance Desk
          </h1>
          <p className="text-xs text-[#687080] mt-0.5">
            Track software bug reports, feature requests, and maintenance tickets
          </p>
        </div>

        <button
          onClick={() => {
            setTicketToEdit(null);
            setIsModalOpen(true);
          }}
          className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-card p-4">
          <span className="text-xs font-semibold text-[#687080] block uppercase tracking-wider">Open Tickets</span>
          <span className="text-2xl font-bold text-[#D94B63] font-mono mt-1 block">{openCount}</span>
          <span className="text-[11px] text-[#687080] block mt-0.5">Requires technical response</span>
        </div>

        <div className="surface-card p-4">
          <span className="text-xs font-semibold text-[#687080] block uppercase tracking-wider">In Progress</span>
          <span className="text-2xl font-bold text-[#D99000] font-mono mt-1 block">{inProgressCount}</span>
          <span className="text-[11px] text-[#687080] block mt-0.5">Currently being resolved</span>
        </div>

        <div className="surface-card p-4">
          <span className="text-xs font-semibold text-[#687080] block uppercase tracking-wider">Resolved Tickets</span>
          <span className="text-2xl font-bold text-[#18A86B] font-mono mt-1 block">{resolvedCount}</span>
          <span className="text-[11px] text-[#687080] block mt-0.5">Completed maintenance items</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#9299A7] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets by number, subject, or client name..."
            className="w-full pl-10 pr-4 py-2 text-xs input-search"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs input-search bg-white px-3 py-2 font-medium"
          >
            <option value="ALL">All Ticket Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <EmptyState
          icon={Headphones}
          title="No support tickets found"
          description="Client support requests and maintenance tickets will appear here."
          actionLabel="Log New Ticket"
          onAction={() => {
            setTicketToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#E7E9EE] text-[#687080] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Ticket #</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Subject & Description</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9EE]">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F7F8FA] transition-colors">
                    <td className="p-3.5 font-mono font-bold text-[#171A21]">{t.ticket_number}</td>

                    <td className="p-3.5">
                      <p className="font-semibold text-[#171A21]">{t.client?.business_name || 'Client'}</p>
                      <p className="text-[11px] text-[#687080]">{t.client?.owner_name}</p>
                    </td>

                    <td className="p-3.5 max-w-sm">
                      <p className="font-bold text-[#171A21]">{t.subject}</p>
                      <p className="text-[11px] text-[#687080] line-clamp-1">{t.description}</p>
                      {t.admin_reply && (
                        <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                          Reply: {t.admin_reply}
                        </p>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.priority === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-indigo-100 text-indigo-800'
                            : t.status === 'OPEN'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="p-3.5 font-medium text-[#687080]">{formatDateDisplay(t.created_at)}</td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {t.status !== 'RESOLVED' && (
                          <button
                            onClick={() => updateTicketStatus(t.id, 'RESOLVED')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => handleWhatsAppReply(t)}
                          title="Reply to client on WhatsApp"
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setTicketToEdit(t);
                            setIsModalOpen(true);
                          }}
                          title="Edit Ticket / Add Response"
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete ticket permanently?')) {
                              deleteSupportTicket(t.id);
                            }
                          }}
                          title="Delete Ticket"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <TicketModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTicketToEdit(null);
        }}
        ticketToEdit={ticketToEdit}
      />
    </div>
  );
};
