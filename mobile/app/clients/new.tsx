import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useData } from '../../src/contexts/DataContext';

export default function AddClientScreen() {
  const { createClient } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert('Validation Error', 'Business Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newClient = await createClient({
        business_name: businessName,
        owner_name: ownerName || undefined,
        phone: phone || undefined,
        whatsapp: whatsapp || phone || undefined,
        email: email || undefined,
        gstin: gstin || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
        notes: notes || undefined,
      });

      Alert.alert(
        'Client Created',
        `${businessName} has been registered successfully.`,
        [
          {
            text: 'Activate Subscription',
            onPress: () => {
              router.replace({
                pathname: '/subscriptions/new',
                params: { client_id: newClient.id },
              });
            },
          },
          {
            text: 'View Client',
            onPress: () => {
              router.replace(`/clients/${newClient.id}`);
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not create client.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formCard}>
          <Text style={styles.headerTitle}>Client Information</Text>
          <Text style={styles.headerSubtitle}>Enter official business and contact details</Text>

          {/* Business Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Business / Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ABC Restaurant & Cafe"
              placeholderTextColor="#9ca3af"
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>

          {/* Owner Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Owner / Primary Contact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Rahul Sharma"
              placeholderTextColor="#9ca3af"
              value={ownerName}
              onChangeText={setOwnerName}
            />
          </View>

          {/* Phone & WhatsApp */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="98XXXXXXXX"
                placeholderTextColor="#9ca3af"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>WhatsApp Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Same as phone or enter"
                placeholderTextColor="#9ca3af"
                value={whatsapp}
                onChangeText={setWhatsapp}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="client@business.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* GSTIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>GSTIN (GST Number)</Text>
            <TextInput
              style={styles.input}
              placeholder="27AAAAA0000A1Z5"
              placeholderTextColor="#9ca3af"
              value={gstin}
              onChangeText={(val) => setGstin(val.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Physical Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Shop #12, Market Complex..."
              placeholderTextColor="#9ca3af"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* City, State, Pincode */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Pune"
                placeholderTextColor="#9ca3af"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="Maharashtra"
                placeholderTextColor="#9ca3af"
                value={state}
                onChangeText={setState}
              />
            </View>

            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                placeholder="411001"
                placeholderTextColor="#9ca3af"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Internal Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Internal Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Client special requirements, referral source, etc."
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit Button */}
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
                <UserPlus size={18} color="#ffffff" />
                <Text style={styles.submitText}>Save Client</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
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
