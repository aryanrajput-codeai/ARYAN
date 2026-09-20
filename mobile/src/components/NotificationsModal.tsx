import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, AlertTriangle, Clock, CreditCard, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { formatCurrency, formatDateDisplay } from '../lib/dateUtils';
import { Subscription } from '../types';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  expiringSubs: Subscription[];
  expiredSubs: Subscription[];
  outstandingSubs: Subscription[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
  expiringSubs,
  expiredSubs,
  outstandingSubs,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications & Action Alerts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Expired Alerts */}
            {expiredSubs.length > 0 && (
              <TouchableOpacity
                style={[styles.alertCard, styles.dangerCard]}
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/renewals');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.alertIconWrap}>
                  <AlertTriangle size={20} color="#dc2626" />
                </View>
                <View style={styles.alertTextWrap}>
                  <Text style={[styles.alertTitle, { color: '#991b1b' }]}>
                    {expiredSubs.length} Expired Subscription{expiredSubs.length > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.alertDesc}>
                    Service lapsed. Immediate renewal or client outreach required.
                  </Text>
                </View>
                <ChevronRight size={18} color="#dc2626" />
              </TouchableOpacity>
            )}

            {/* Expiring Soon */}
            {expiringSubs.length > 0 && (
              <TouchableOpacity
                style={[styles.alertCard, styles.warningCard]}
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/renewals');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.alertIconWrap}>
                  <Clock size={20} color="#d97706" />
                </View>
                <View style={styles.alertTextWrap}>
                  <Text style={[styles.alertTitle, { color: '#92400e' }]}>
                    {expiringSubs.length} Renewal{expiringSubs.length > 1 ? 's' : ''} Due Soon
                  </Text>
                  <Text style={styles.alertDesc}>
                    Expiring within 30 days. Send WhatsApp renewal reminders.
                  </Text>
                </View>
                <ChevronRight size={18} color="#d97706" />
              </TouchableOpacity>
            )}

            {/* Outstanding Balance */}
            {outstandingSubs.length > 0 && (
              <TouchableOpacity
                style={[styles.alertCard, styles.infoCard]}
                onPress={() => {
                  onClose();
                  router.push('/(tabs)/payments');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.alertIconWrap}>
                  <CreditCard size={20} color="#4f46e5" />
                </View>
                <View style={styles.alertTextWrap}>
                  <Text style={[styles.alertTitle, { color: '#3730a3' }]}>
                    {outstandingSubs.length} Outstanding Payment{outstandingSubs.length > 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.alertDesc}>
                    Pending balance collection on active client subscriptions.
                  </Text>
                </View>
                <ChevronRight size={18} color="#4f46e5" />
              </TouchableOpacity>
            )}

            {expiredSubs.length === 0 && expiringSubs.length === 0 && outstandingSubs.length === 0 && (
              <View style={styles.allClear}>
                <Text style={styles.allClearTitle}>All Caught Up! 🎉</Text>
                <Text style={styles.allClearDesc}>
                  No expired services or urgent renewal alerts right now.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  dangerCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
  },
  warningCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  infoCard: {
    backgroundColor: '#eef2ff',
    borderColor: '#e0e7ff',
  },
  alertIconWrap: {
    marginRight: 12,
  },
  alertTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  allClear: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  allClearTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  allClearDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
