import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CreditCard, CheckCircle2 } from 'lucide-react-native';
import { useData } from '../../src/contexts/DataContext';
import { PaymentMethod } from '../../src/types';
import { formatCurrency, getTodayISO } from '../../src/lib/dateUtils';

export default function RecordPaymentScreen() {
  const params = useLocalSearchParams<{
    client_id?: string;
    subscription_id?: string;
    amount?: string;
  }>();

  const { clients, subscriptions, recordPayment } = useData();

  const [selectedClientId, setSelectedClientId] = useState(params.client_id || '');
  const [selectedSubId, setSelectedSubId] = useState(params.subscription_id || '');
  const [amount, setAmount] = useState(params.amount || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayISO());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter subscriptions for selected client
  const clientSubs = useMemo(() => {
    if (!selectedClientId) return [];
    return subscriptions.filter(
      (s) => s.client_id === selectedClientId && s.status !== 'CANCELLED'
    );
  }, [subscriptions, selectedClientId]);

  // When a subscription is selected, set suggested amount if not set
  const handleSelectSub = (subId: string) => {
    setSelectedSubId(subId);
    const sub = subscriptions.find((s) => s.id === subId);
    if (sub && !amount) {
      const suggested = (sub.outstanding_balance || 0) > 0 ? sub.outstanding_balance : sub.amount;
      setAmount(String(suggested));
    }
  };

  const handleRecord = async () => {
    if (!selectedClientId) {
      Alert.alert('Validation Error', 'Please select a client.');
      return;
    }
    if (!selectedSubId) {
      Alert.alert('Validation Error', 'Please select a subscription to apply payment to.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payment = await recordPayment({
        subscription_id: selectedSubId,
        client_id: selectedClientId,
        amount: numAmount,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        transaction_reference: transactionRef || undefined,
        notes: notes || undefined,
      });

      Alert.alert(
        'Payment Recorded ✓',
        `Receipt ${payment.receipt_number} generated successfully.`,
        [
          {
            text: 'View Official Receipt',
            onPress: () => router.replace(`/payments/${payment.id}`),
          },
          {
            text: 'Done',
            onPress: () => router.replace('/(tabs)/payments'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Could not record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {/* Step 1: Select Client */}
        <Text style={styles.sectionHeader}>1. Select Client</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {clients.map((client) => {
            const isSelected = selectedClientId === client.id;
            return (
              <TouchableOpacity
                key={client.id}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => {
                  setSelectedClientId(client.id);
                  setSelectedSubId('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {client.business_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Step 2: Select Subscription */}
        {selectedClientId ? (
          <>
            <Text style={[styles.sectionHeader, { marginTop: 18 }]}>2. Select Subscription</Text>
            {clientSubs.length > 0 ? (
              <View style={styles.subList}>
                {clientSubs.map((sub) => {
                  const isSelected = selectedSubId === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      style={[styles.subOption, isSelected && styles.subOptionActive]}
                      onPress={() => handleSelectSub(sub.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.subOptionLeft}>
                        <Text style={[styles.subName, isSelected && styles.subNameActive]}>
                          {sub.product?.name} ({sub.plan?.name || 'Plan'})
                        </Text>
                        <Text style={styles.subOutstanding}>
                          Outstanding: {formatCurrency(sub.outstanding_balance || 0)}
                        </Text>
                      </View>
                      <Text style={styles.subTotal}>Total: {formatCurrency(sub.amount)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyNotice}>No active subscriptions found for this client.</Text>
            )}
          </>
        ) : null}

        {/* Step 3: Amount & Date */}
        <Text style={[styles.sectionHeader, { marginTop: 18 }]}>3. Payment Details</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount Paid (₹) *</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="e.g., 15000"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={paymentDate}
            onChangeText={setPaymentDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* Payment Method */}
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.methodRow}>
          {(['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD'] as PaymentMethod[]).map((m) => {
            const isSelected = paymentMethod === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, isSelected && styles.methodBtnActive]}
                onPress={() => setPaymentMethod(m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.methodBtnText, isSelected && styles.methodBtnTextActive]}>
                  {m.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reference / UTR */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Transaction Reference / UTR / Cheque #</Text>
          <TextInput
            style={styles.input}
            value={transactionRef}
            onChangeText={setTransactionRef}
            placeholder="e.g., UPI / Bank Ref (Optional)"
          />
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Receipt Remarks / Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional receipt notes"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitDisabled]}
          onPress={handleRecord}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <CreditCard size={18} color="#ffffff" />
              <Text style={styles.submitBtnText}>Record Payment & Generate Receipt</Text>
            </>
          )}
        </TouchableOpacity>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#4f46e5',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  subList: {
    gap: 8,
  },
  subOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    borderRadius: 12,
  },
  subOptionActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  subOptionLeft: {
    flex: 1,
  },
  subName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  subNameActive: {
    color: '#4f46e5',
  },
  subOutstanding: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
    marginTop: 2,
  },
  subTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
  },
  emptyNotice: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    height: 46,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  methodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  methodBtnActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  methodBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  methodBtnTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    height: 50,
    borderRadius: 14,
    marginTop: 10,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
