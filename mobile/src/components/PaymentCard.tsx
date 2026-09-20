import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CreditCard, FileText, ChevronRight, Ban } from 'lucide-react-native';
import { router } from 'expo-router';
import { Payment } from '../types';
import { formatCurrency, formatDateDisplay } from '../lib/dateUtils';

interface PaymentCardProps {
  payment: Payment;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ payment }) => {
  const isVoided = payment.status === 'VOIDED';

  return (
    <TouchableOpacity
      style={[styles.card, isVoided && styles.voidedCard]}
      activeOpacity={0.7}
      onPress={() => router.push(`/payments/${payment.id}`)}
    >
      <View style={styles.topRow}>
        <View style={styles.receiptBadgeRow}>
          <FileText size={14} color={isVoided ? '#991b1b' : '#4f46e5'} />
          <Text style={[styles.receiptNumber, isVoided && styles.voidedReceipt]}>
            {payment.receipt_number}
          </Text>
        </View>

        {isVoided ? (
          <View style={styles.voidBadge}>
            <Ban size={12} color="#dc2626" />
            <Text style={styles.voidBadgeText}>VOIDED</Text>
          </View>
        ) : (
          <View style={styles.methodBadge}>
            <Text style={styles.methodText}>{payment.payment_method}</Text>
          </View>
        )}
      </View>

      <View style={styles.middleRow}>
        <View style={styles.clientInfo}>
          <Text style={styles.businessName} numberOfLines={1}>
            {payment.client?.business_name || 'Client'}
          </Text>
          <Text style={styles.productName} numberOfLines={1}>
            {payment.subscription?.product?.name || 'Subscription'}
          </Text>
        </View>

        <View style={styles.amountWrap}>
          <Text style={[styles.amountText, isVoided && styles.voidedAmount]}>
            {formatCurrency(payment.amount)}
          </Text>
          <Text style={styles.dateText}>{formatDateDisplay(payment.payment_date)}</Text>
        </View>
      </View>

      {payment.transaction_reference && (
        <View style={styles.footerRow}>
          <Text style={styles.refLabel}>Ref: {payment.transaction_reference}</Text>
          <View style={styles.receiptAction}>
            <Text style={styles.viewReceiptText}>Receipt</Text>
            <ChevronRight size={14} color="#6b7280" />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  voidedCard: {
    backgroundColor: '#fffaf0',
    borderColor: '#fed7aa',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  receiptBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  voidedReceipt: {
    color: '#dc2626',
    textDecorationLine: 'line-through',
  },
  methodBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
  },
  voidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  voidBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientInfo: {
    flex: 1,
    marginRight: 12,
  },
  businessName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  productName: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  amountWrap: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  voidedAmount: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  refLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  receiptAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewReceiptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
});
