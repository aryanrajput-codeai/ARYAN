import React, { useState } from 'react';
import { X, Headphones, Send } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { SupportTicket, TicketPriority } from '../../types';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketToEdit?: SupportTicket | null;
  defaultClientId?: string;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  ticketToEdit,
  defaultClientId,
}) => {
  const { clients, addSupportTicket, updateTicketStatus } = useData();

  const [clientId, setClientId] = useState(ticketToEdit?.client_id || defaultClientId || '');
  const [subject, setSubject] = useState(ticketToEdit?.subject || '');
  const [description, setDescription] = useState(ticketToEdit?.description || '');
  const [priority, setPriority] = useState<TicketPriority>(ticketToEdit?.priority || 'MEDIUM');
  const [adminReply, setAdminReply] = useState(ticketToEdit?.admin_reply || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Please select a Client.');
      return;
    }

    if (ticketToEdit) {
      await updateTicketStatus(ticketToEdit.id, ticketToEdit.status, adminReply);
    } else {
      await addSupportTicket({
        client_id: clientId,
        subject,
        description,
        priority,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              {ticketToEdit ? `Ticket #${ticketToEdit.ticket_number}` : 'Create Support / Maintenance Ticket'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Client Account *
            </label>
            <select
              required
              disabled={Boolean(ticketToEdit)}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white"
            >
              <option value="">-- Select Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.business_name} ({c.owner_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Urgent / Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Issue Summary / Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. POS Printer connectivity issue"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Issue Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the bug or maintenance request..."
              className="w-full p-3 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {ticketToEdit && (
            <div>
              <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                Admin Response / Resolution Note
              </label>
              <textarea
                rows={3}
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                placeholder="Type your response to the client..."
                className="w-full p-3 border border-indigo-200 rounded-lg text-xs bg-indigo-50/50 font-medium"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{ticketToEdit ? 'Save Ticket Update' : 'Submit Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
