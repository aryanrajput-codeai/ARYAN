import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function LoginScreen() {
  const { signIn, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your work email.');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    const res = await signIn(email, password);
    if (res.success) {
      router.replace('/(tabs)');
    } else {
      setLocalError(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Shield size={32} color="#4f46e5" />
          </View>
          <Text style={styles.brandTitle}>WEBRAJYA</Text>
          <Text style={styles.brandSubtitle}>Owner Subscription & Client Console</Text>
          <Text style={styles.platformBadge}>Private Owner Mobile App</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.formTitle}>Owner Account Login</Text>
          <Text style={styles.formDesc}>Enter authorized WebRajya owner credentials</Text>

          {displayError && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#dc2626" />
              <Text style={styles.errorText}>{displayError}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="admin@webrajya.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Sign In as Owner</Text>
            )}
          </TouchableOpacity>

          <View style={styles.securityNotice}>
            <Text style={styles.securityText}>
              🔒 Protected by Supabase Row-Level Security & Encrypted Session Storage
            </Text>
          </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#4f46e5',
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  platformBadge: {
    marginTop: 8,
    backgroundColor: '#ecfdf5',
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  formDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  securityNotice: {
    marginTop: 20,
    alignItems: 'center',
  },
  securityText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
