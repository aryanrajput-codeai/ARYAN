import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Phone,
  MessageSquare,
  CreditCard,
  RefreshCw,
  Edit3,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  FileText,
} from 'lucide-react-native';
import { useData } from '../../src/contexts/DataContext';
import {
  formatCurrency,
  formatDateDisplay,
  formatDateTimeDisplay,
  calculateDaysRemaining,
} from '../../src/lib/dateUtils';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getClientById,
    events,
    sendReminder,
    addClientNote,
  } = useData();

  const client = getClientById(id);
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  if (!client) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Client record not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const activeSub =
    client.subscriptions?.find((s) => s.status === 'ACTIVE' || s.status === 'EXPIRING_SOON') ||
    client.subscriptions?.[0];

  const totalRevenue = (client.subscriptions || []).reduce(
    (sum, s) => sum + s.amount,
    0
  );
  const totalPaid = (client.subscriptions || []).reduce(
    (sum, s) => sum + (s.total_paid || 0),
    0
  );
  const totalOutstanding = Math.max(0, totalRevenue - totalPaid);

  // Filter chronological events for this client
  const clientEvents = events.filter((e) => e.client_id === client.id);

  const handleCall = () => {
    if (!client.phone) {
      Alert.alert('No Phone', 'No telephone number available for this client.');
      return;
    }
    const cleanPhone = client.phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Error', 'Could not open phone dialer.');
    });
  };

  const handleWhatsApp = () => {
    const rawNum = client.whatsapp || client.phone;
    if (!rawNum) {
      Alert.alert('No Contact Number', 'No WhatsApp or phone number available.');
      return;
    }

    let cleanPhone = rawNum.replace(/[^\d]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const expiryFormatted = activeSub ? formatDateDisplay(activeSub.end_date) : 'soon';
    const productName = activeSub?.product?.name || 'WebRajya SaaS';
    const clientName = client.owner_name || client.business_name;

    const message = `Hi ${clientName},\n\nYour ${productName} subscription for ${client.business_name} is due for renewal on ${expiryFormatted}.\n\nPlease let us know if you would like to continue.\n\nRegards,\nWebRajya`;

    if (activeSub) {
      sendReminder(activeSub.id, 'WHATSAPP', 'OPENED').catch(() => {});
    }

    Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`).catch(() => {
      Alert.alert('Error', 'Could not launch WhatsApp.');
    });
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      await addClientNote(client.id, noteText);
      setNoteText('');
      Alert.alert('Note Added', 'Internal client note recorded.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Profile Card */}
      <View style={styles.headerCard}>
        <Text style={styles.businessName}>{client.business_name}</Text>
        {client.owner_name ? (
          <Text style={styles.ownerName}>Owner: {client.owner_name}</Text>
        ) : null}

        {client.gstin ? (
          <Text style={styles.gstinText}>GSTIN: {client.gstin}</Text>
        ) : null}

        {/* Quick Contact Buttons */}
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
            <Phone size={16} color="#ffffff" />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp} activeOpacity={0.8}>
            <MessageSquare size={16} color="#ffffff" />
            <Text style={styles.whatsappButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Financial Summary */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Billed</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Paid</Text>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>
            {formatCurrency(totalPaid)}
          </Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Outstanding</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: totalOutstanding > 0 ? '#dc2626' : '#6b7280' },
            ]}
          >
            {formatCurrency(totalOutstanding)}
          </Text>
        </View>
      </View>

      {/* Active Subscriptions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Subscriptions</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/subscriptions/new', params: { client_id: client.id } })}>
            <Text style={styles.addLinkText}>+ Add Sub</Text>
          </TouchableOpacity>
        </View>

        {client.subscriptions && client.subscriptions.length > 0 ? (
          client.subscriptions.map((sub) => {
            const daysLeft = calculateDaysRemaining(sub.end_date);
            const isExp = daysLeft < 0;

            return (
              <View key={sub.id} style={styles.subCard}>
                <View style={styles.subTopRow}>
                  <View>
                    <Text style={styles.subProduct}>{sub.product?.name || 'SaaS Product'}</Text>
                    <Text style={styles.subPlan}>{sub.plan?.name || 'Plan'}</Text>
                  </View>

                  <View
                    style={[
                      styles.subBadge,
                      sub.status === 'ACTIVE'
                        ? styles.subBadgeActive
                        : sub.status === 'EXPIRING_SOON'
                        ? styles.subBadgeWarning
                        : styles.subBadgeDanger,
                    ]}
                  >
                    <Text
                      style={[
                        styles.subBadgeText,
                        sub.status === 'ACTIVE'
                          ? styles.subTextActive
                          : sub.status === 'EXPIRING_SOON'
                          ? styles.subTextWarning
                          : styles.subTextDanger,
                      ]}
                    >
                      {sub.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                <View style={styles.subDateRow}>
                  <View>
                    <Text style={styles.dateLabel}>Term Dates</Text>
                    <Text style={styles.dateVal}>
                      {formatDateDisplay(sub.start_date)} → {formatDateDisplay(sub.end_date)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.dateLabel}>Amount</Text>
                    <Text style={styles.subAmountVal}>{formatCurrency(sub.amount)}</Text>
                  </View>
                </View>

                <View style={styles.subActions}>
                  <TouchableOpacity
                    style={styles.subActionRenew}
                    onPress={() => router.push(`/renewals/${sub.id}`)}
                    activeOpacity={0.8}
                  >
                    <RefreshCw size={14} color="#4f46e5" />
                    <Text style={styles.subActionRenewText}>Renew</Text>
                  </TouchableOpacity>

                  {(sub.outstanding_balance || 0) > 0 && (
                    <TouchableOpacity
                      style={styles.subActionPay}
                      onPress={() =>
                        router.push({
                          pathname: '/payments/new',
                          params: { client_id: client.id, subscription_id: sub.id },
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <CreditCard size={14} color="#16a34a" />
                      <Text style={styles.subActionPayText}>
                        Collect {formatCurrency(sub.outstanding_balance)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No subscriptions for this client.</Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => router.push({ pathname: '/subscriptions/new', params: { client_id: client.id } })}
            >
              <Text style={styles.emptyActionBtnText}>Activate First Subscription</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Management</Text>
        <View style={styles.actionButtonsCol}>
          <TouchableOpacity
            style={styles.bigActionBtn}
            onPress={() =>
              router.push({
                pathname: '/payments/new',
                params: { client_id: client.id },
              })
            }
            activeOpacity={0.7}
          >
            <CreditCard size={18} color="#4f46e5" />
            <Text style={styles.bigActionText}>Record Payment</Text>
          </TouchableOpacity>

          {activeSub && (
            <TouchableOpacity
              style={styles.bigActionBtn}
              onPress={() => router.push(`/renewals/${activeSub.id}`)}
              activeOpacity={0.7}
            >
              <RefreshCw size={18} color="#059669" />
              <Text style={styles.bigActionText}>Renew Subscription</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Internal Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Internal Notes</Text>
        <View style={styles.noteInputCard}>
          <TextInput
            style={styles.noteInput}
            placeholder="Add internal notes about client preferences, commitments..."
            placeholderTextColor="#9ca3af"
            value={noteText}
            onChangeText={setNoteText}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.saveNoteBtn, (!noteText.trim() || isSubmittingNote) && { opacity: 0.5 }]}
            onPress={handleAddNote}
            disabled={!noteText.trim() || isSubmittingNote}
            activeOpacity={0.7}
          >
            {isSubmittingNote ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Send size={14} color="#ffffff" />
                <Text style={styles.saveNoteText}>Save Note</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Timeline Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Timeline</Text>
        {clientEvents.length > 0 ? (
          clientEvents.map((evt, idx) => (
            <View key={evt.id} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDesc}>{evt.description || evt.event_type}</Text>
                <Text style={styles.timelineDate}>{formatDateTimeDisplay(evt.created_at)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyTimelineText}>No audit timeline events logged yet.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  ownerName: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
    fontWeight: '600',
  },
  gstinText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
  },
  callButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsappButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  addLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  subCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  subTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subProduct: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  subPlan: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  subBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subBadgeActive: {
    backgroundColor: '#ecfdf5',
  },
  subBadgeWarning: {
    backgroundColor: '#fffbeb',
  },
  subBadgeDanger: {
    backgroundColor: '#fef2f2',
  },
  subBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  subTextActive: {
    color: '#059669',
  },
  subTextWarning: {
    color: '#d97706',
  },
  subTextDanger: {
    color: '#dc2626',
  },
  subDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  dateVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  subAmountVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },
  subActions: {
    flexDirection: 'row',
    gap: 8,
  },
  subActionRenew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subActionRenewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
  },
  subActionPay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subActionPayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyCardText: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 12,
  },
  emptyActionBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  actionButtonsCol: {
    gap: 8,
  },
  bigActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bigActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  noteInputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  noteInput: {
    minHeight: 70,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
  },
  saveNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4f46e5',
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 8,
  },
  saveNoteText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingLeft: 4,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4f46e5',
    marginTop: 5,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timelineDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  timelineDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  emptyTimeline: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyTimelineText: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
  },
});
