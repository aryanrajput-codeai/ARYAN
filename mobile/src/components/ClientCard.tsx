import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Phone, MessageSquare, Calendar, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Client } from '../types';
import { formatCurrency, formatDateDisplay, calculateDaysRemaining } from '../lib/dateUtils';
import { useData } from '../contexts/DataContext';

interface ClientCardProps {
  client: Client;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
  const { sendReminder } = useData();
  const activeSub = client.subscriptions?.find((s) => s.status === 'ACTIVE' || s.status === 'EXPIRING_SOON') || client.subscriptions?.[0];

  const handleCall = () => {
    if (!client.phone) {
      Alert.alert('No Phone Number', `No telephone number is saved for ${client.business_name}.`);
      return;
    }
    const cleanPhone = client.phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Call Error', 'Could not launch device dialer.');
    });
  };

  const handleWhatsApp = () => {
    const rawNum = client.whatsapp || client.phone;
    if (!rawNum) {
      Alert.alert('No WhatsApp Number', `No contact number is saved for ${client.business_name}.`);
      return;
    }

    let cleanPhone = rawNum.replace(/[^\d]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const expiryDateFormatted = activeSub ? formatDateDisplay(activeSub.end_date) : 'soon';
    const productName = activeSub?.product?.name || 'WebRajya SaaS';
    const clientName = client.owner_name || client.business_name;

    const message = `Hi ${clientName},\n\nYour ${productName} subscription for ${client.business_name} is due for renewal on ${expiryDateFormatted}.\n\nPlease let us know if you would like to continue.\n\nRegards,\nWebRajya`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    if (activeSub) {
      sendReminder(activeSub.id, 'WHATSAPP', 'OPENED').catch(() => {});
    }

    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  };

  const statusColor = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'EXPIRING_SOON':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'EXPIRED':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' };
    }
  };

  const colors = statusColor(activeSub?.status);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/clients/${client.id}`)}
    >
      <View style={styles.headerRow}>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName} numberOfLines={1}>
            {client.business_name}
          </Text>
          {client.owner_name ? (
            <Text style={styles.ownerName} numberOfLines={1}>
              {client.owner_name}
            </Text>
          ) : null}
        </View>

        {activeSub && (
          <View style={[styles.statusBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {activeSub.status.replace('_', ' ')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailCol}>
          <Text style={styles.detailLabel}>Product</Text>
          <Text style={styles.detailValue} numberOfLines={1}>
            {activeSub?.product?.name || 'No Active Sub'}
          </Text>
        </View>

        {activeSub && (
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Expires</Text>
            <Text style={styles.detailValue}>
              {formatDateDisplay(activeSub.end_date)}
            </Text>
          </View>
        )}

        <View style={styles.detailColRight}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.amountValue}>
            {formatCurrency(activeSub?.amount || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.contactRow}>
          {client.phone && (
            <TouchableOpacity style={styles.quickContactBtn} onPress={handleCall} activeOpacity={0.7}>
              <Phone size={14} color="#2563eb" />
              <Text style={styles.quickContactText}>{client.phone}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.quickWhatsAppBtn, !client.whatsapp && !client.phone && { opacity: 0.5 }]}
            onPress={handleWhatsApp}
            activeOpacity={0.7}
          >
            <MessageSquare size={14} color="#16a34a" />
            <Text style={styles.quickWhatsAppText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.viewRow}>
          <Text style={styles.viewText}>Details</Text>
          <ChevronRight size={16} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flex: 1,
    marginRight: 10,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  ownerName: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailCol: {
    flex: 1,
  },
  detailColRight: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  quickContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickContactText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  quickWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickWhatsAppText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});
