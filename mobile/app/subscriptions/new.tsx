import React, { useState, useEffect } from 'react';
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
import { PlusCircle, Calendar, Check } from 'lucide-react-native';
import { useData } from '../../src/contexts/DataContext';
import {
  calculateSubscriptionEndDate,
  formatCurrency,
  formatDateDisplay,
  getTodayISO,
} from '../../src/lib/dateUtils';
import { PaymentMethod } from '../../src/types';

export default function AddSubscriptionScreen() {
  const params = useLocalSearchParams<{ client_id?: string }>();
  const { clients, products, plans, createSubscription } = useData();

  const [selectedClientId, setSelectedClientId] = useState(params.client_id || '');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(getTodayISO());
  const [notes, setNotes] = useState('');

  // Optional initial payment
  const [recordInitialPayment, setRecordInitialPayment] = useState(true);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [transactionRef, setTransactionRef] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter plans for selected product
  const availablePlans = plans.filter((p) => p.product_id === selectedProductId && p.is_active);

  // Automatically update selected plan & price when plan changes
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setAmount(String(plan.price));
      setInitialPaymentAmount(String(plan.price));
    }
  };

  // Selected plan object
  const currentPlan = plans.find((p) => p.id === selectedPlanId);
  const durationMonths = currentPlan ? currentPlan.duration_months : 12;
  const calculatedEndDate = calculateSubscriptionEndDate(startDate, durationMonths);

  const handleSave = async () => {
    if (!selectedClientId) {
      Alert.alert('Validation Error', 'Please select a client.');
      return;
    }
    if (!selectedProductId) {
      Alert.alert('Validation Error', 'Please select a product.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid subscription price.');
      return;
    }

    setIsSubmitting(true);
    try {
      const numPayment = recordInitialPayment ? parseFloat(initialPaymentAmount) || 0 : 0;

      const res = await createSubscription({
        client_id: selectedClientId,
        product_id: selectedProductId,
        plan_id: selectedPlanId || null,
        amount: numAmount,
        start_date: startDate,
        duration_months: durationMonths,
        notes: notes || undefined,
        initial_payment_amount: numPayment > 0 ? numPayment : undefined,
        payment_method: numPayment > 0 ? paymentMethod : undefined,
        transaction_reference: transactionRef || undefined,
      });

      Alert.alert(
        'Subscription Activated ✓',
        `Active through ${formatDateDisplay(calculatedEndDate)}.`,
        [
          {
            text: res.payment ? 'View Receipt' : 'OK',
            onPress: () => {
              if (res.payment) {
                router.replace(`/payments/${res.payment.id}`);
              } else {
                router.replace(`/clients/${selectedClientId}`);
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Activation Failed', err.message || 'Could not create subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>1. Select Client</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {clients.map((client) => {
            const isSelected = selectedClientId === client.id;
            return (
              <TouchableOpacity
                key={client.id}
                style={[styles.chip, isSelected && styles.chipActive]}
                onPress={() => setSelectedClientId(client.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                  {client.business_name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionHeader, { marginTop: 18 }]}>2. Select Product</Text>
        <View style={styles.productGrid}>
          {products.filter((p) => p.is_active).map((product) => {
            const isSelected = selectedProductId === product.id;
            return (
              <TouchableOpacity
                key={product.id}
                style={[styles.productBtn, isSelected && styles.productBtnActive]}
                onPress={() => {
                  setSelectedProductId(product.id);
                  setSelectedPlanId('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.productBtnTitle, isSelected && styles.productBtnTitleActive]}>
                  {product.name}
                </Text>
                {product.description ? (
                  <Text style={styles.productBtnDesc} numberOfLines={1}>
                    {product.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedProductId ? (
          <>
            <Text style={[styles.sectionHeader, { marginTop: 18 }]}>3. Select License Plan</Text>
            {availablePlans.length > 0 ? (
              <View style={styles.plansList}>
                {availablePlans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[styles.planCard, isSelected && styles.planCardActive]}
                      onPress={() => handleSelectPlan(plan.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.planInfo}>
                        <Text style={[styles.planName, isSelected && styles.planNameActive]}>
                          {plan.name}
                        </Text>
                        <Text style={styles.planDuration}>{plan.duration_months} Months Term</Text>
                      </View>
                      <Text style={[styles.planPrice, isSelected && styles.planPriceActive]}>
                        {formatCurrency(plan.price)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noPlansText}>No plans found for this product.</Text>
            )}
          </>
        ) : null}

        <Text style={[styles.sectionHeader, { marginTop: 18 }]}>4. Term Dates & Price</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.fieldLabel}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.flex1}>
            <Text style={styles.fieldLabel}>Calculated End Date</Text>
            <View style={styles.calculatedDateBox}>
              <Text style={styles.calculatedDateText}>
                {formatDateDisplay(calculatedEndDate)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>Total Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="5000"
          />
        </View>

        <Text style={[styles.sectionHeader, { marginTop: 18 }]}>5. Initial Payment Settlement</Text>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setRecordInitialPayment(!recordInitialPayment)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, recordInitialPayment && styles.checkboxChecked]}>
            {recordInitialPayment && <Check size={14} color="#ffffff" />}
          </View>
          <Text style={styles.checkboxLabel}>Record initial payment immediately</Text>
        </TouchableOpacity>

        {recordInitialPayment && (
          <View style={styles.paymentFields}>
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Collected Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={initialPaymentAmount}
                onChangeText={setInitialPaymentAmount}
                keyboardType="numeric"
                placeholder="Amount paid"
              />
            </View>

            <Text style={styles.fieldLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              {(['UPI', 'CASH', 'BANK_TRANSFER', 'CARD'] as PaymentMethod[]).map((m) => {
                const isSelected = paymentMethod === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodBtn, isSelected && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.methodBtnText, isSelected && styles.methodBtnTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Transaction Reference / UTR</Text>
              <TextInput
                style={styles.input}
                value={transactionRef}
                onChangeText={setTransactionRef}
                placeholder="UPI Ref / Cheque # (Optional)"
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <PlusCircle size={18} color="#ffffff" />
              <Text style={styles.submitText}>Activate Subscription</Text>
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
    marginBottom: 8,
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
  productGrid: {
    gap: 8,
  },
  productBtn: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    borderRadius: 12,
  },
  productBtnActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  productBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  productBtnTitleActive: {
    color: '#4f46e5',
  },
  productBtnDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
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
  noPlansText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  flex1: {
    flex: 1,
  },
  fieldLabel: {
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
  calculatedDateBox: {
    height: 46,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  calculatedDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f46e5',
  },
  inputGroup: {
    marginBottom: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  paymentFields: {
    backgroundColor: '#f9fafb',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 14,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  methodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    height: 50,
    borderRadius: 14,
    marginTop: 8,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
