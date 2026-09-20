import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Calendar,
  CreditCard,
  RefreshCw,
  Clock,
  Ban,
  Shield,
  FileText,
} from 'lucide-react-native';
import { useData } from '../../src/contexts/DataContext';
import {
  formatCurrency,
  formatDateDisplay,
  calculateDaysRemaining,
} from '../../src/lib/dateUtils';
import { PaymentCard } from '../../src/components/PaymentCard';

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSubscriptionById, payments } = useData();

  const sub = getSubscriptionById(id);

  if (!sub) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Subscription not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const daysLeft = calculateDaysRemaining(sub.end_date);
  const isExpired = daysLeft < 0;

  // Filter payments for this subscription
  const subPayments = payments.filter((p) => p.subscription_id === sub.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Info */}
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <Text style={styles.clientName}>{sub.client?.business_name}</Text>
          <View
            style={[
              styles.statusBadge,
              sub.status === 'ACTIVE'
                ? styles.badgeActive
                : sub.status === 'EXPIRING_SOON'
                ? styles.badgeWarning
                : styles.badgeDanger,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                sub.status === 'ACTIVE'
                  ? styles.textActive
                  : sub.status === 'EXPIRING_SOON'
                  ? styles.textWarning
                  : styles.textDanger,
              ]}
            >
              {sub.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.productTitle}>
          {sub.product?.name} • {sub.plan?.name || 'Standard License'}
        </Text>

        <View style={styles.datesContainer}>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <Text style={styles.dateValue}>{formatDateDisplay(sub.start_date)}</Text>
          </View>
          <View style={styles.dateCol}>
            <Text style={styles.dateLabel}>End Date</Text>
            <Text style={styles.dateValue}>{formatDateDisplay(sub.end_date)}</Text>
          </View>
          <View style={styles.dateColRight}>
            <Text style={styles.dateLabel}>Status Term</Text>
            <Text
              style={[
                styles.daysValue,
                isExpired ? { color: '#dc2626' } : { color: '#d97706' },
              ]}
            >
              {isExpired ? 'Lapsed' : `${daysLeft} days remaining`}
            </Text>
          </View>
        </View>
      </View>

      {/* Financial Ledger Breakdown */}
      <View style={styles.ledgerCard}>
        <Text style={styles.sectionHeader}>Financial Balance</Text>
        <View style={styles.ledgerRow}>
          <Text style={styles.ledgerLabel}>Contract Amount</Text>
          <Text style={styles.ledgerValue}>{formatCurrency(sub.amount)}</Text>
        </View>
        <View style={styles.ledgerRow}>
          <Text style={styles.ledgerLabel}>Total Paid to Date</Text>
          <Text style={[styles.ledgerValue, { color: '#059669' }]}>
            {formatCurrency(sub.total_paid || 0)}
          </Text>
        </View>
        <View style={[styles.ledgerRow, styles.ledgerRowTotal]}>
          <Text style={styles.ledgerTotalLabel}>Outstanding Balance</Text>
          <Text
            style={[
              styles.ledgerTotalValue,
              { color: (sub.outstanding_balance || 0) > 0 ? '#dc2626' : '#059669' },
            ]}
          >
            {formatCurrency(sub.outstanding_balance || 0)}
          </Text>
        </View>
      </View>

      {/* Primary Actions */}
      <View style={styles.actionsCard}>
        <TouchableOpacity
          style={styles.renewButton}
          onPress={() => router.push(`/renewals/${sub.id}`)}
          activeOpacity={0.8}
        >
          <RefreshCw size={18} color="#ffffff" />
          <Text style={styles.renewButtonText}>Renew Subscription</Text>
        </TouchableOpacity>

        {(sub.outstanding_balance || 0) > 0 && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() =>
              router.push({
                pathname: '/payments/new',
                params: {
                  client_id: sub.client_id,
                  subscription_id: sub.id,
                  amount: String(sub.outstanding_balance),
                },
              })
            }
            activeOpacity={0.8}
          >
            <CreditCard size={18} color="#ffffff" />
            <Text style={styles.payButtonText}>
              Collect Balance ({formatCurrency(sub.outstanding_balance)})
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Payments History for this Sub */}
      <View style={styles.paymentsSection}>
        <Text style={styles.sectionHeader}>Payment Receipts ({subPayments.length})</Text>
        {subPayments.length > 0 ? (
          subPayments.map((payment) => <PaymentCard key={payment.id} payment={payment} />)
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No payments recorded for this subscription term yet.</Text>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clientName: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: '#ecfdf5',
  },
  badgeWarning: {
    backgroundColor: '#fffbeb',
  },
  badgeDanger: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  textActive: {
    color: '#059669',
  },
  textWarning: {
    color: '#d97706',
  },
  textDanger: {
    color: '#dc2626',
  },
  productTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  datesContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateColRight: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 2,
  },
  daysValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  ledgerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ledgerRowTotal: {
    borderBottomWidth: 0,
    paddingTop: 12,
  },
  ledgerLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  ledgerValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  ledgerTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  ledgerTotalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  actionsCard: {
    gap: 10,
    marginBottom: 20,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 14,
  },
  renewButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  paymentsSection: {
    marginBottom: 20,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
