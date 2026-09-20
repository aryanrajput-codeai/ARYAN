import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users,
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Filter,
  MessageCircle,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Client, ClientStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency } from '../lib/dateUtils';
import { ClientFormModal } from '../components/clients/ClientFormModal';
import { EmptyState } from '../components/common/EmptyState';

export const ClientsPage: React.FC = () => {
  const { clients } = useData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ClientStatus>('ALL');
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client: Client) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        client.business_name.toLowerCase().includes(q) ||
        (client.owner_name && client.owner_name.toLowerCase().includes(q)) ||
        (client.phone && client.phone.toLowerCase().includes(q)) ||
        (client.email && client.email.toLowerCase().includes(q)) ||
        (client.city && client.city.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || client.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const handleWhatsApp = (e: React.MouseEvent, phone: string | null, name: string) => {
    e.stopPropagation();
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${name}, greetings from WebRajya!`)}`, '_blank');
  };

  const handleCall = (e: React.MouseEvent, phone: string | null) => {
    e.stopPropagation();
    if (!phone) return;
    window.open(`tel:${phone}`, '_self');
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#171A21]">
            Clients & Accounts
          </h1>
          <p className="text-xs text-[#687080] mt-0.5">
            Manage client profiles, contacts, and active subscriptions
          </p>
        </div>

        <button
          id="btn-add-client"
          onClick={() => setIsNewClientOpen(true)}
          className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[#9299A7] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by business name, owner name, phone, or city..."
            className="w-full pl-10 pr-4 py-2 text-xs input-search"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#8D95A5]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ClientStatus)}
            className="text-xs input-search px-3 py-2 bg-white w-full sm:w-auto font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Clients</option>
            <option value="INACTIVE">Inactive Clients</option>
          </select>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients found"
          description={
            searchQuery
              ? `No clients matched "${searchQuery}". Try a different search term.`
              : 'You have not added any clients yet. Click below to add your first client.'
          }
          actionLabel="Add Client"
          onAction={() => setIsNewClientOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client: Client) => (
            <div
              key={client.id}
              onClick={() => navigate(`/clients/${client.id}`)}
              className="surface-card p-5 cursor-pointer flex flex-col justify-between group transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF0FF] text-[#5B5CE2] flex items-center justify-center font-bold text-sm shrink-0">
                      <Building className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-[#171A21] group-hover:text-[#5B5CE2] transition-colors truncate">
                        {client.business_name}
                      </h2>
                      <p className="text-xs text-[#687080] truncate">{client.owner_name || 'No contact specified'}</p>
                    </div>
                  </div>
                  <StatusBadge status={client.status} size="sm" />
                </div>

                <div className="space-y-2 py-3 border-y border-[#E7E9EE] text-xs text-[#687080]">
                  {client.phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="w-3.5 h-3.5 text-[#8D95A5] shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleCall(e, client.phone)}
                          className="p-1 text-[#687080] hover:text-[#18A86B] rounded transition-colors"
                          title="Call Client"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleWhatsApp(e, client.phone, client.business_name)}
                          className="p-1 text-[#687080] hover:text-[#18A86B] rounded transition-colors"
                          title="WhatsApp Client"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#8D95A5] shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#8D95A5] shrink-0" />
                    <span className="truncate">
                      {client.city ? `${client.city}, ${client.state || ''}` : 'Location unlisted'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between mt-2">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-[#9AA2B1] block text-[10px]">Subscriptions</span>
                    <span className="font-semibold text-[#171A21]">
                      {client.subscriptions?.filter((s) => s.status === 'ACTIVE').length || 0} active
                    </span>
                  </div>
                  {(client.total_outstanding || 0) > 0 && (
                    <div>
                      <span className="text-[#D94B63] block text-[10px]">Due Balance</span>
                      <span className="font-semibold text-[#D94B63] font-mono">
                        {formatCurrency(client.total_outstanding!)}
                      </span>
                    </div>
                  )}
                </div>

                <span className="text-xs font-semibold text-[#5B5CE2] group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  Details <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ClientFormModal isOpen={isNewClientOpen} onClose={() => setIsNewClientOpen(false)} />
    </div>
  );
};
