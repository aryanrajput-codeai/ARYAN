import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  RefreshCw,
  Phone,
  MessageSquare,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Clock,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { PressableSpring } from '../../src/components/PressableSpring';
import { useData } from '../../src/contexts/DataContext';
import { Subscription } from '../../src/types';
import {
  formatCurrency,
  formatDateDisplay,
  calculateDaysRemaining,
} from '../../src/lib/dateUtils';
import { EmptyState } from '../../src/components/EmptyState';

type RenewalFilter = 'ALL' | 'DAYS_7' | 'DAYS_30' | 'EXPIRED';

export default function RenewalsTab() {
  const { subscriptions, isRefreshing, refreshData, sendReminder } = useData();
  const [activeFilter, setActiveFilter] = useState<RenewalFilter>('DAYS_30');

  const filteredSubs = useMemo(() => {
    return subscriptions.filter((sub) => {
      if (sub.status === 'CANCELLED') return false;
      const days = calculateDaysRemaining(sub.end_date);

      switch (activeFilter) {
        case 'EXPIRED':
          return days < 0;
        case 'DAYS_7':
          return days >= 0 && days <= 7;
        case 'DAYS_30':
          return days >= 0 && days <= 30;
        case 'ALL':
        default:
          return true;
      }
    });
  }, [subscriptions, activeFilter]);

  const handleWhatsApp = (sub: Subscription) => {
    const rawNum = sub.client?.whatsapp || sub.client?.phone;
    if (!rawNum) {
      Alert.alert('No Contact Number', `No contact number is saved for ${sub.client?.business_name}.`);
      return;
    }

    let cleanPhone = rawNum.replace(/[^\d]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const expiryFormatted = formatDateDisplay(sub.end_date);
    const clientName = sub.client?.owner_name || sub.client?.business_name || 'Client';
    const productName = sub.product?.name || 'WebRajya SaaS';

    const message = `Hi ${clientName},\n\nYour ${productName} subscription for ${sub.client?.business_name} is due for renewal on ${expiryFormatted}.\n\nPlease let us know if you would like to continue.\n\nRegards,\nWebRajya`;

    sendReminder(sub.id, 'WHATSAPP', 'OPENED').catch(() => {});
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not open WhatsApp on this device.');
    });
  };

  const handleCall = (sub: Subscription) => {
    if (!sub.client?.phone) {
      Alert.alert('No Phone Number', `No telephone number saved for ${sub.client?.business_name}.`);
      return;
    }
    const cleanPhone = sub.client.phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Call Error', 'Could not launch device dialer.');
    });
  };

  const renderRenewalCard = ({ item }: { item: Subscription }) => {
    const days = calculateDaysRemaining(item.end_date);
    const isExpired = days < 0;

    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.clientInfo}>
            <Text style={styles.businessName} numberOfLines={1}>
              {item.client?.business_name || 'Client'}
            </Text>
            <Text style={styles.productName} numberOfLines={1}>
              {item.product?.name || 'SaaS Product'} • {item.plan?.name || 'Plan'}
            </Text>
          </View>

          <View
            style={[
              styles.badge,
              isExpired ? styles.badgeExpired : styles.badgeWarning,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                isExpired ? styles.badgeTextExpired : styles.badgeTextWarning,
              ]}
            >
              {isExpired ? 'EXPIRED' : `${days} days left`}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View>
            <Text style={styles.detailLabel}>Expiry Date</Text>
            <Text style={styles.detailValue}>{formatDateDisplay(item.end_date)}</Text>
          </View>

          <View style={styles.amountWrap}>
            <Text style={styles.detailLabel}>Renewal Price</Text>
            <Text style={styles.amountValue}>{formatCurrency(item.amount)}</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <View style={styles.contactButtons}>
            <PressableSpring
              style={styles.contactBtn}
              onPress={() => handleWhatsApp(item)}
            >
              <MessageSquare size={14} color="#18A86B" />
              <Text style={styles.contactBtnText}>Remind</Text>
            </PressableSpring>

            {item.client?.phone && (
              <PressableSpring
                style={styles.callBtn}
                onPress={() => handleCall(item)}
              >
                <Phone size={14} color="#5B5CE2" />
              </PressableSpring>
            )}
          </View>

          <PressableSpring
            style={styles.renewBtn}
            onPress={() => router.push(`/renewals/${item.id}`)}
          >
            <RefreshCw size={13} color="#FFFFFF" />
            <Text style={styles.renewBtnText}>Renew</Text>
          </PressableSpring>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Renewals</Text>
        <Text style={styles.subtitle}>
          Manage upcoming license expirations & client renewals
        </Text>

        {/* Tab Filter Chips */}
        <View style={styles.pillsRow}>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'DAYS_7', label: '7 Days' },
            { id: 'DAYS_30', label: '30 Days' },
            { id: 'EXPIRED', label: 'Expired' },
          ].map((pill) => {
            const isSelected = activeFilter === pill.id;
            return (
              <PressableSpring
                key={pill.id}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => setActiveFilter(pill.id as RenewalFilter)}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {pill.label}
                </Text>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* Renewals List */}
      <FlatList
        data={filteredSubs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={['#5B5CE2']}
            tintColor="#5B5CE2"
          />
        }
        renderItem={renderRenewalCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<RefreshCw size={32} color="#9AA2B1" />}
              title="You're all clear for now"
              description="No renewals due in this filter category."
              actionText="View 30 Days"
              onAction={() => setActiveFilter('DAYS_30')}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7E9EE',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#171A21',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#687080',
    marginTop: 2,
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E7E9EE',
  },
  pillActive: {
    backgroundColor: '#5B5CE2',
    borderColor: '#5B5CE2',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#687080',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7E9EE',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
    marginRight: 10,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171A21',
  },
  productName: {
    fontSize: 12,
    color: '#687080',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeWarning: {
    backgroundColor: '#FFF6DF',
  },
  badgeExpired: {
    backgroundColor: '#FFF0F3',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextWarning: {
    color: '#D99000',
  },
  badgeTextExpired: {
    color: '#D94B63',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F7F8FA',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 11,
    color: '#9AA2B1',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171A21',
  },
  amountWrap: {
    alignItems: 'flex-end',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171A21',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF8F2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18A86B',
  },
  callBtn: {
    backgroundColor: '#EEF0FF',
    padding: 7,
    borderRadius: 10,
  },
  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#5B5CE2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  renewBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingTop: 40,
  },
});
