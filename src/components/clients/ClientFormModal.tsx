import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Client } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
}) => {
  const { clients, addClient, updateClient } = useData();
  const { addToast } = useToast();

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Pune');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setBusinessName(clientToEdit.business_name || '');
      setOwnerName(clientToEdit.owner_name || '');
      setPhone(clientToEdit.phone || '');
      setWhatsapp(clientToEdit.whatsapp || '');
      setEmail(clientToEdit.email || '');
      setGstin(clientToEdit.gstin || '');
      setAddress(clientToEdit.address || '');
      setCity(clientToEdit.city || 'Pune');
      setState(clientToEdit.state || 'Maharashtra');
      setPincode(clientToEdit.pincode || '');
      setNotes(clientToEdit.notes || '');
    } else {
      setBusinessName('');
      setOwnerName('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setGstin('');
      setAddress('');
      setCity('Pune');
      setState('Maharashtra');
      setPincode('');
      setNotes('');
    }
  }, [clientToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      addToast('Business Name is required', 'error');
      return;
    }

    // Email validation if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      addToast('Please enter a valid email address', 'error');
      return;
    }

    // Duplicate check on create
    if (!clientToEdit) {
      const duplicate = clients.find(
        (c) =>
          c.business_name.toLowerCase() === businessName.trim().toLowerCase() ||
          (phone.trim() && c.phone && c.phone.replace(/\D/g, '') === phone.trim().replace(/\D/g, ''))
      );
      if (duplicate) {
        const proceed = window.confirm(
          `A client with similar name or phone number ("${duplicate.business_name}") already exists. Continue anyway?`
        );
        if (!proceed) return;
      }
    }

    setIsSubmitting(true);
    try {
      if (clientToEdit) {
        await updateClient(clientToEdit.id, {
          business_name: businessName.trim(),
          owner_name: ownerName.trim() || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || phone.trim() || null,
          email: email.trim() || null,
          gstin: gstin.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          pincode: pincode.trim() || null,
          notes: notes.trim() || null,
        });
      } else {
        await addClient({
          business_name: businessName.trim(),
          owner_name: ownerName.trim() || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || phone.trim() || null,
          email: email.trim() || null,
          gstin: gstin.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          pincode: pincode.trim() || null,
          notes: notes.trim() || null,
          status: 'ACTIVE',
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save client';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? 'Edit Client Details' : 'Add New Client'}
      subtitle="Register an internal client profile with GSTIN and contact details"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. THE XINGS KITCHEN"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Owner / Contact Person
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              GSTIN
            </label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="e.g. 27AABCU9603R1ZM"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98220 11223"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              WhatsApp Number
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. +91 98220 11223"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul@xingskitchen.in"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Shop 14, High Street, Baner"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Pincode
            </label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="e.g. 411045"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Internal Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Setup notes or details..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
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
            {isSubmitting ? 'Saving...' : clientToEdit ? 'Update Client' : 'Add Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
