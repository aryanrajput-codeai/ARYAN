import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  MessageCircle,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Proposal, ProposalStatus } from '../types';
import { formatCurrency, formatDateDisplay } from '../lib/dateUtils';
import { ProposalModal } from '../components/proposals/ProposalModal';
import { EmptyState } from '../components/common/EmptyState';

export const ProposalsPage: React.FC = () => {
  const { proposals, deleteProposal, convertProposalToSubscription, updateProposal } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProposalStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proposalToEdit, setProposalToEdit] = useState<Proposal | null>(null);

  const filteredProposals = useMemo(() => {
    return proposals.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.proposal_number.toLowerCase().includes(q) ||
        p.client_name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [proposals, searchQuery, statusFilter]);

  const totalPipeline = proposals
    .filter((p) => p.status === 'DRAFT' || p.status === 'SENT')
    .reduce((sum, p) => sum + p.total_amount, 0);

  const acceptedCount = proposals.filter((p) => p.status === 'ACCEPTED').length;
  const conversionRate = proposals.length > 0 ? Math.round((acceptedCount / proposals.length) * 100) : 0;

  const handleShareWhatsApp = (p: Proposal) => {
    if (!p.client_phone) {
      alert(`Client ${p.client_name} does not have a phone number on record.`);
      return;
    }
    const cleanPhone = p.client_phone.replace(/\D/g, '');
    const text = `Hello ${p.client_name},\n\nHere is your official Software & Services Quotation from WebRajya Solutions:\n\n*Proposal No:* ${p.proposal_number}\n*Total Value:* ₹${p.total_amount.toLocaleString('en-IN')}\n*Valid Until:* ${p.valid_until}\n\nPlease let us know if you have any questions!\nWebRajya Solutions`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleConvert = async (proposalId: string) => {
    const startDate = new Date().toISOString().slice(0, 10);
    if (window.confirm('Convert this proposal into an active client and subscription?')) {
      await convertProposalToSubscription(proposalId, startDate);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171A21]">
            Software Proposals & Quotations
          </h1>
          <p className="text-xs text-[#687080] mt-0.5">
            Create, estimate, track, and convert client proposals into active subscriptions
          </p>
        </div>

        <button
          onClick={() => {
            setProposalToEdit(null);
            setIsModalOpen(true);
          }}
          className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Proposal / Quotation</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-card p-4">
          <span className="text-xs font-semibold text-[#687080] block uppercase tracking-wider">Active Proposal Pipeline</span>
          <span className="text-2xl font-bold text-[#171A21] font-mono mt-1 block">{formatCurrency(totalPipeline)}</span>
          <span className="text-[11px] text-[#687080] block mt-0.5">{proposals.filter(p => p.status === 'SENT' || p.status === 'DRAFT').length} pending deals</span>
        </div>

        <div className="surface-card p-4">
          <span className="text-xs font-semibold text-[#687080] block uppercase tracking-wider">Accepted Deals</span>
          <span className="text-2xl font-bold text-[#18A86B] font-mono mt-1 block">{acceptedCount} Converted</span>
          <span className="text-[11px] text-[#687080] block mt-0.5">Provisioned into software licenses</span>
        </div>

        <div className="surface-card p-4">
          <span className="text-xs font-semibold text-[#687080] block uppercase tracking-wider">Proposal Win Rate</span>
          <span className="text-2xl font-bold text-[#5B5CE2] font-mono mt-1 block">{conversionRate}%</span>
          <span className="text-[11px] text-[#687080] block mt-0.5">Overall conversion efficiency</span>
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
            placeholder="Search proposals by number, client name, or title..."
            className="w-full pl-10 pr-4 py-2 text-xs input-search"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs input-search bg-white px-3 py-2 font-medium"
          >
            <option value="ALL">All Proposal Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent to Client</option>
            <option value="ACCEPTED">Accepted / Converted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Proposals Table */}
      {filteredProposals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No software proposals found"
          description="Build professional proposals for your potential clients and convert them with 1 click."
          actionLabel="Create Quotation"
          onAction={() => {
            setProposalToEdit(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#E7E9EE] text-[#687080] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Proposal #</th>
                  <th className="p-3.5">Client / Lead</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Valid Until</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E9EE]">
                {filteredProposals.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-[#F7F8FA] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#171A21]">{p.proposal_number}</td>

                      <td className="p-3.5">
                        <p className="font-semibold text-[#171A21]">{p.client_name}</p>
                        <p className="text-[11px] text-[#687080]">{p.client_phone || p.client_email || 'No contact'}</p>
                      </td>

                      <td className="p-3.5 text-[#171A21] max-w-xs truncate">{p.title}</td>

                      <td className="p-3.5 font-medium text-[#687080]">{formatDateDisplay(p.valid_until)}</td>

                      <td className="p-3.5 font-mono font-bold text-[#171A21]">{formatCurrency(p.total_amount)}</td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'SENT'
                              ? 'bg-indigo-100 text-indigo-800'
                              : p.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status !== 'ACCEPTED' && (
                            <button
                              onClick={() => handleConvert(p.id)}
                              title="Convert Proposal to Active License & Client"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
                            >
                              <span>Convert</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleShareWhatsApp(p)}
                            title="Share Proposal via WhatsApp"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setProposalToEdit(p);
                              setIsModalOpen(true);
                            }}
                            title="Edit Proposal"
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this proposal permanently?')) {
                                deleteProposal(p.id);
                              }
                            }}
                            title="Delete Proposal"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal */}
      <ProposalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProposalToEdit(null);
        }}
        proposalToEdit={proposalToEdit}
      />
    </div>
  );
};
