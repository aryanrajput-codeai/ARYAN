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
import { RefreshCw, CheckCircle2, Calendar, CreditCard } from 'lucide-react-native';
import { useData } from '../../src/contexts/DataContext';
import {
  formatCurrency,
  formatDateDisplay,
  calculateNextRenewalStartDate as calculateRenewalStartDate,
  calculateSubscriptionEndDate,
} from '../../src/lib/dateUtils';
import { PaymentMethod } from '../../src/types';

type PaymentMode = 'FULL' | 'PARTIAL' | 'LATER';

export default function RenewSubscriptionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSubscriptionById, plans, renewSubscription } = useData();

  const currentSub = getSubscriptionById(id);

  if (!currentSub) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Subscription not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate default renewal start date: day after current sub end_date
  const defaultStartDate = calculateRenewalStartDate(currentSub.end_date);

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [selectedPlanId, setSelectedPlanId] = useState(currentSub.plan_id || '');
  const [renewalAmount, setRenewalAmount] = useState(String(currentSub.amount));

  // Payment Options
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('FULL');
  const [paidAmount, setPaidAmount] = useState(String(currentSub.amount));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available plans for this product
  const productPlans = plans.filter((p) => p.product_id === currentSub.product_id && p.is_active);

  // When plan changes, adjust duration and price
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setRenewalAmount(String(plan.price));
      if (paymentMode === 'FULL') {
        setPaidAmount(String(plan.price));
      }
    }
  };

  const currentPlan = plans.find((p) => p.id === selectedPlanId);
  const durationMonths = currentPlan ? currentPlan.duration_months : 12;
  const calculatedEndDate = calculateSubscriptionEndDate(startDate, durationMonths);

  const handleModeChange = (mode: PaymentMode) => {
    setPaymentMode(mode);
    if (mode === 'FULL') {
      setPaidAmount(renewalAmount);
    } else if (mode === 'LATER') {
      setPaidAmount('0');
    }
  };

  const handleCompleteRenewal = async () => {
    const numRenewalAmount = parseFloat(renewalAmount);
    if (isNaN(numRenewalAmount) || numRenewalAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid renewal amount.');
      return;
    }

    let numPaid = 0;
    if (paymentMode === 'FULL') {
      numPaid = numRenewalAmount;
    } else if (paymentMode === 'PARTIAL') {
      numPaid = parseFloat(paidAmount) || 0;
      if (numPaid < 0 || numPaid > numRenewalAmount) {
        Alert.alert(
          'Validation Error',
          `Partial payment must be between ₹1 and ${formatCurrency(numRenewalAmount)}.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await renewSubscription(
        currentSub.id,
        selectedPlanId || '',
        numPaid > 0
          ? {
              amount: numPaid,
              payment_method: paymentMethod,
              transaction_reference: transactionRef || undefined,
              notes: notes || undefined,
            }
          : undefined
      );

      Alert.alert(
        'Renewal Complete ✓',
        `Renewed for ${currentSub.client?.business_name} through ${formatDateDisplay(
          calculatedEndDate
        )}.`,
        [
          {
            text: res.payment ? 'View Payment Receipt' : 'OK',
            onPress: () => {
              if (res.payment) {
                router.replace(`/payments/${res.payment.id}`);
              } else {
                router.replace('/(tabs)/renewals');
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Renewal Failed', err.message || 'Could not complete renewal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        {/* Step 1: Current Subscription Summary */}
        <Text style={styles.sectionHeader}>Current Subscription</Text>
        <View style={styles.subInfoBox}>
          <Text style={styles.clientName}>{currentSub.client?.business_name}</Text>
          <Text style={styles.productTitle}>
            {currentSub.product?.name} • {currentSub.plan?.name || 'Standard License'}
          </Text>
          <Text style={styles.subDates}>
            Current Term: {formatDateDisplay(currentSub.start_date)} →{' '}
            {formatDateDisplay(currentSub.end_date)}
          </Text>
        </View>

        {/* Step 2: Select Renewal Plan */}
        <Text style={[styles.sectionHeader, { marginTop: 18 }]}>Select Renewal Plan</Text>
        <View style={styles.plansList}>
          {productPlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planCard, isSelected && styles.planCardActive]}
                onPress={() => handleSelectPlan(plan.id)}
                activeOpacity={0.7}
              >
                <View style={styles.planLeft}>
                  <Text style={[styles.planName, isSelected && styles.planNameActive]}>
                    {plan.name}
                  </Text>
                  <Text style={styles.planDuration}>{plan.duration_months} Months Extension</Text>
                </View>
                <Text style={[styles.planPrice, isSelected && styles.planPriceActive]}>
                  {formatCurrency(plan.price)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Step 3: Dates & Amount */}
        <Text style={[styles.sectionHeader, { marginTop: 18 }]}>Renewal Term & Amount</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Renewal Start Date</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>New End Date</Text>
            <View style={styles.calcDateBox}>
              <Text style={styles.calcDateText}>{formatDateDisplay(calculatedEndDate)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Renewal Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={renewalAmount}
            onChangeText={(val) => {
              setRenewalAmount(val);
              if (paymentMode === 'FULL') setPaidAmount(val);
            }}
            keyboardType="numeric"
          />
        </View>

        {/* Step 4: Payment Options */}
        <Text style={[styles.sectionHeader, { marginTop: 18 }]}>Payment Options</Text>
        <View style={styles.modeRow}>
          {[
            { id: 'FULL', label: 'Paid Now (Full)' },
            { id: 'PARTIAL', label: 'Partial Payment' },
            { id: 'LATER', label: 'Pay Later' },
          ].map((mode) => {
            const isSelected = paymentMode === mode.id;
            return (
              <TouchableOpacity
                key={mode.id}
                style={[styles.modeBtn, isSelected && styles.modeBtnActive]}
                onPress={() => handleModeChange(mode.id as PaymentMode)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modeBtnText, isSelected && styles.modeBtnTextActive]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {paymentMode !== 'LATER' && (
          <View style={styles.paymentBox}>
            {paymentMode === 'PARTIAL' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Initial Amount Collected (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                  keyboardType="numeric"
                  placeholder="e.g., 5000"
                />
              </View>
            )}

            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.methodRow}>
              {(['UPI', 'CASH', 'BANK_TRANSFER', 'CARD'] as PaymentMethod[]).map((m) => {
                const isSelected = paymentMethod === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodChip, isSelected && styles.methodChipActive]}
                    onPress={() => setPaymentMethod(m)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.methodChipText, isSelected && styles.methodChipTextActive]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Transaction Reference / UTR</Text>
              <TextInput
                style={styles.input}
                value={transactionRef}
                onChangeText={setTransactionRef}
                placeholder="UPI Ref / Cheque # (Optional)"
              />
            </View>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitDisabled]}
          onPress={handleCompleteRenewal}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <RefreshCw size={18} color="#ffffff" />
              <Text style={styles.submitBtnText}>Complete Renewal & Extend Service</Text>
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
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  subInfoBox: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  productTitle: {
    fontSize: 13,
    color: '#4f46e5',
    fontWeight: '600',
    marginTop: 2,
  },
  subDates: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  plansList: {
    gap: 8,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    borderRadius: 12,
  },
  planCardActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  planLeft: {
    flex: 1,
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  planNameActive: {
    color: '#4f46e5',
  },
  planDuration: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  planPriceActive: {
    color: '#4f46e5',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  flex1: {
    flex: 1,
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
  calcDateBox: {
    height: 46,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  calcDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  inputGroup: {
    marginBottom: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#4f46e5',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  modeBtnTextActive: {
    color: '#ffffff',
  },
  paymentBox: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  methodChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  methodChipTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    height: 52,
    borderRadius: 14,
    marginTop: 10,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
