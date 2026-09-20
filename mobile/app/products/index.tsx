import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Package, Plus, Edit2, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useData } from '../../src/contexts/DataContext';
import { formatCurrency } from '../../src/lib/dateUtils';
import { Product, Plan } from '../../src/types';

export default function ProductsScreen() {
  const { isAdmin } = useAuth();
  const { products, plans } = useData();
  const updateProduct = async (_id: string, _data: any) => {};
  const updatePlan = async (_id: string, _data: any) => {};
  const createProduct = async (_data: any) => ({ id: 'new-id', name: _data.name });
  const createPlan = async (_data: any) => {};

  // Selected product to view/filter plans
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDuration, setPlanDuration] = useState('12');
  const [planPrice, setPlanPrice] = useState('');
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const activeProductPlans = plans.filter((p) => p.product_id === selectedProduct?.id);

  const handleToggleProduct = async (product: Product) => {
    if (!isAdmin) {
      Alert.alert('Restricted', 'Only administrators can toggle product availability.');
      return;
    }
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleTogglePlan = async (plan: Plan) => {
    if (!isAdmin) {
      Alert.alert('Restricted', 'Only administrators can toggle plan availability.');
      return;
    }
    try {
      await updatePlan(plan.id, { is_active: !plan.is_active });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleCreateProduct = async () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Product name is required.');
      return;
    }
    setIsSubmittingProduct(true);
    try {
      const prod = await createProduct({
        name: productName.trim(),
        description: productDesc.trim() || undefined,
      });
      setSelectedProductId(prod.id);
      setShowProductModal(false);
      setProductName('');
      setProductDesc('');
      Alert.alert('Product Added', `${prod.name} is now available in your catalog.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleCreatePlan = async () => {
    if (!planName.trim()) {
      Alert.alert('Error', 'Plan name is required.');
      return;
    }
    const numPrice = parseFloat(planPrice);
    if (isNaN(numPrice) || numPrice < 0) {
      Alert.alert('Error', 'Please enter a valid price.');
      return;
    }
    const numDuration = parseInt(planDuration, 10);
    if (isNaN(numDuration) || numDuration <= 0) {
      Alert.alert('Error', 'Duration months must be at least 1.');
      return;
    }

    setIsSubmittingPlan(true);
    try {
      await createPlan({
        product_id: selectedProduct.id,
        name: planName.trim(),
        duration_months: numDuration,
        price: numPrice,
      });
      setShowPlanModal(false);
      setPlanName('');
      setPlanPrice('');
      setPlanDuration('12');
      Alert.alert('Plan Added', `Plan added to ${selectedProduct.name}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Admin Notice */}
      {!isAdmin && (
        <View style={styles.restrictedBanner}>
          <ShieldAlert size={18} color="#d97706" />
          <Text style={styles.restrictedText}>
            Read-only mode. Administrator credentials required to create or modify pricing tiers.
          </Text>
        </View>
      )}

      {/* Products Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>SaaS Products Catalog</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addSmallBtn}
            onPress={() => setShowProductModal(true)}
            activeOpacity={0.7}
          >
            <Plus size={14} color="#ffffff" />
            <Text style={styles.addSmallBtnText}>Add Product</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
        {products.map((p) => {
          const isSelected = selectedProduct?.id === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.productPill, isSelected && styles.productPillActive]}
              onPress={() => setSelectedProductId(p.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.productPillText, isSelected && styles.productPillTextActive]}>
                {p.name}
              </Text>
              {!p.is_active && <Text style={styles.inactiveTag}>(Inactive)</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected Product Card */}
      {selectedProduct && (
        <View style={styles.productDetailCard}>
          <View style={styles.productDetailTop}>
            <View style={styles.productDetailLeft}>
              <Text style={styles.productDetailName}>{selectedProduct.name}</Text>
              {selectedProduct.description ? (
                <Text style={styles.productDetailDesc}>{selectedProduct.description}</Text>
              ) : null}
            </View>

            {isAdmin && (
              <View style={styles.toggleWrap}>
                <Text style={styles.toggleLabel}>
                  {selectedProduct.is_active ? 'Active' : 'Inactive'}
                </Text>
                <Switch
                  value={selectedProduct.is_active}
                  onValueChange={() => handleToggleProduct(selectedProduct)}
                  trackColor={{ false: '#d1d5db', true: '#4f46e5' }}
                />
              </View>
            )}
          </View>

          {/* Associated Plans */}
          <View style={styles.plansSection}>
            <View style={styles.plansSectionHeader}>
              <Text style={styles.plansTitle}>Subscription Plans & Pricing</Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.addPlanBtn}
                  onPress={() => setShowPlanModal(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={12} color="#4f46e5" />
                  <Text style={styles.addPlanBtnText}>New Plan</Text>
                </TouchableOpacity>
              )}
            </View>

            {activeProductPlans.length > 0 ? (
              activeProductPlans.map((plan) => (
                <View key={plan.id} style={styles.planCard}>
                  <View style={styles.planLeft}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDuration}>{plan.duration_months} Months License</Text>
                  </View>

                  <View style={styles.planRight}>
                    <Text style={styles.planPrice}>{formatCurrency(plan.price)}</Text>
                    {isAdmin && (
                      <Switch
                        value={plan.is_active}
                        onValueChange={() => handleTogglePlan(plan)}
                        trackColor={{ false: '#d1d5db', true: '#059669' }}
                      />
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyPlans}>
                <Text style={styles.emptyPlansText}>No plans configured for this product yet.</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Modal: Add Product */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add SaaS Product</Text>
            <Text style={styles.modalSubtitle}>Register a new product module into WebRajya</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., WebRajya Billing ERP"
                placeholderTextColor="#9ca3af"
                value={productName}
                onChangeText={setProductName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Key capabilities & customer segment"
                placeholderTextColor="#9ca3af"
                value={productDesc}
                onChangeText={setProductDesc}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowProductModal(false)}
                disabled={isSubmittingProduct}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleCreateProduct}
                disabled={isSubmittingProduct}
              >
                {isSubmittingProduct ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Save Product</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Add Plan */}
      <Modal visible={showPlanModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Plan for {selectedProduct?.name}</Text>
            <Text style={styles.modalSubtitle}>Configure term duration and license pricing</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Plan Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Annual Standard"
                placeholderTextColor="#9ca3af"
                value={planName}
                onChangeText={setPlanName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Duration (Months) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="12"
                placeholderTextColor="#9ca3af"
                value={planDuration}
                onChangeText={setPlanDuration}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price (₹) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="15000"
                placeholderTextColor="#9ca3af"
                value={planPrice}
                onChangeText={setPlanPrice}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowPlanModal(false)}
                disabled={isSubmittingPlan}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleCreatePlan}
                disabled={isSubmittingPlan}
              >
                {isSubmittingPlan ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveModalBtnText}>Save Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  restrictedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  restrictedText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  addSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addSmallBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  productsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  productPillActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  productPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  productPillTextActive: {
    color: '#ffffff',
  },
  inactiveTag: {
    fontSize: 11,
    color: '#dc2626',
  },
  productDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  productDetailTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  productDetailLeft: {
    flex: 1,
    marginRight: 10,
  },
  productDetailName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  productDetailDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  toggleWrap: {
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  plansSection: {
    marginTop: 16,
  },
  plansSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plansTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  addPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addPlanBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  planLeft: {
    flex: 1,
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  planDuration: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  planRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  emptyPlans: {
    padding: 16,
    alignItems: 'center',
  },
  emptyPlansText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 16,
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
  modalInput: {
    height: 44,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111827',
  },
  modalTextArea: {
    height: 60,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: '#6b7280',
    fontWeight: '700',
  },
  saveModalBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveModalBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
