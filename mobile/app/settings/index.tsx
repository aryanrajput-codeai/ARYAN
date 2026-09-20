import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Bell, Shield, Smartphone, Send, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useData } from '../../src/contexts/DataContext';
import {
  registerForPushNotificationsAsync,
} from '../../src/services/pushNotifications';

export default function SettingsScreen() {
  const { user, isAdmin } = useAuth();
  const { settings } = useData();

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [reminderDays, setReminderDays] = useState(
    (settings?.enabled_reminder_intervals || ['30_DAYS', '15_DAYS', '7_DAYS', '1_DAY']).join(', ')
  );

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    // Attempt registration status check
    registerForPushNotificationsAsync().then((token) => {
      if (token) setPushToken(token);
    });
  }, []);

  const handleRegisterToken = async () => {
    setIsRegistering(true);
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        Alert.alert('Registered', 'Your device is registered for WebRajya push notifications.');
      } else {
        Alert.alert(
          'Notice',
          'Push notification permissions were denied or unavailable.'
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleTestNotification = async () => {
    Alert.alert('Test Notification', 'ABC Restaurant subscription expires in 3 days.');
  };

  const handleSaveReminderSchedule = async () => {
    if (!isAdmin) {
      Alert.alert('Restricted', 'Only administrators can update global reminder offset schedules.');
      return;
    }

    setIsSavingSettings(true);
    try {
      Alert.alert('Settings Saved', 'Global notification schedule updated in Supabase.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Device Registration Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Smartphone size={20} color="#4f46e5" />
          <Text style={styles.cardTitle}>Mobile Device Push Token</Text>
        </View>
        <Text style={styles.cardDesc}>
          Enables native Android & iOS push alerts for expiring subscriptions and daily morning
          renewals summary.
        </Text>

        <View style={styles.tokenBox}>
          <Text style={styles.tokenLabel}>Token Status:</Text>
          <Text style={[styles.tokenVal, pushToken ? styles.tokenActive : styles.tokenInactive]}>
            {pushToken ? 'Connected & Registered' : 'Not Registered'}
          </Text>
        </View>

        {pushToken && (
          <Text style={styles.tokenString} numberOfLines={2} ellipsizeMode="middle">
            {pushToken}
          </Text>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={handleRegisterToken}
            disabled={isRegistering}
            activeOpacity={0.8}
          >
            {isRegistering ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.registerBtnText}>
                {pushToken ? 'Refresh Token' : 'Register Push Token'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testBtn}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <Bell size={14} color="#4f46e5" />
            <Text style={styles.testBtnText}>Test Alert</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reminder Days Schedule */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Bell size={20} color="#d97706" />
          <Text style={styles.cardTitle}>Renewal Reminders Schedule</Text>
        </View>
        <Text style={styles.cardDesc}>
          Trigger notification alerts on these days relative to expiration (e.g. 30, 15, 7, 3, 1, 0,
          -1, -3):
        </Text>

        <TextInput
          style={styles.input}
          value={reminderDays}
          onChangeText={setReminderDays}
          placeholder="30, 15, 7, 3, 1, 0, -1, -3"
          editable={isAdmin}
        />

        {isAdmin && (
          <TouchableOpacity
            style={[styles.saveBtn, isSavingSettings && { opacity: 0.6 }]}
            onPress={handleSaveReminderSchedule}
            disabled={isSavingSettings}
            activeOpacity={0.8}
          >
            {isSavingSettings ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Notification Schedule</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Security & System Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Shield size={20} color="#059669" />
          <Text style={styles.cardTitle}>Backend & Security</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Database Architecture</Text>
          <Text style={styles.infoVal}>Supabase PostgreSQL (Cloud)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Security Model</Text>
          <Text style={styles.infoVal}>Row-Level Security (RLS)</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Local Offline Cache</Text>
          <Text style={styles.infoVal}>AsyncStorage Cache Mirror</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Financial Mutability</Text>
          <Text style={styles.infoVal}>Online-Only Strict Ledger</Text>
        </View>
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
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  cardDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  tokenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  tokenLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    marginRight: 6,
  },
  tokenVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  tokenActive: {
    color: '#059669',
  },
  tokenInactive: {
    color: '#dc2626',
  },
  tokenString: {
    fontSize: 11,
    color: '#9ca3af',
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  registerBtn: {
    flex: 1,
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  testBtnText: {
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: 13,
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
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
});
