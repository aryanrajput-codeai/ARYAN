import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package,
  BarChart3,
  Bell,
  Lock,
  KeyRound,
  Fingerprint,
  ScanFace,
  Clock,
  ShieldCheck,
  LogOut,
  ChevronRight,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { PressableSpring } from '../../src/components/PressableSpring';
import { useAuth } from '../../src/contexts/AuthContext';
import { useData } from '../../src/contexts/DataContext';
import { usePinLock } from '../../src/contexts/PinLockContext';
import { AUTO_LOCK_OPTIONS } from '../../src/services/pinService';

export default function MoreTab() {
  const { user, profile, signOut } = useAuth();
  const { isOnline } = useData();
  const {
    lockApp,
    autoLockSeconds,
    updateAutoLockSeconds,
    biometricStatus,
    biometricsEnabled,
    toggleBiometrics,
    resetPinSession,
  } = usePinLock();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of WebRajya Mobile?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleSelectAutoLock = () => {
    Alert.alert(
      'Auto-Lock Timeout',
      'Choose when WebRajya requires your owner PIN after moving to the background:',
      AUTO_LOCK_OPTIONS.map((opt) => ({
        text: `${opt.label} ${opt.seconds === autoLockSeconds ? '✓' : ''}`,
        onPress: () => updateAutoLockSeconds(opt.seconds),
      })).concat([{ text: 'Cancel', style: 'cancel' } as any])
    );
  };

  const handleChangePin = () => {
    Alert.alert(
      'Change Owner PIN',
      'Would you like to reset your current PIN and establish a new 4-digit security PIN?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set New PIN',
          onPress: async () => {
            await resetPinSession();
          },
        },
      ]
    );
  };

  const getAutoLockLabel = () => {
    const match = AUTO_LOCK_OPTIONS.find((o) => o.seconds === autoLockSeconds);
    return match ? match.label : 'After 5 minutes';
  };

  const biometryName = biometricStatus.biometryType || 'Biometrics';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>WebRajya Control Center</Text>
        <Text style={styles.subtitle}>Personal settings & security control</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Owner Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <User size={22} color="#5B5CE2" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Aryan Rajput</Text>
            <Text style={styles.profileEmail}>{user?.email || 'aryan@webrajya.com'}</Text>
          </View>
          <View style={styles.ownerBadge}>
            <ShieldCheck size={12} color="#5B5CE2" />
            <Text style={styles.ownerRoleText}>OWNER</Text>
          </View>
        </View>

        {/* Connection Status */}
        <View style={[styles.syncBanner, isOnline ? styles.syncOnline : styles.syncOffline]}>
          {isOnline ? <Wifi size={15} color="#18A86B" /> : <WifiOff size={15} color="#D94B63" />}
          <Text style={[styles.syncText, isOnline ? styles.syncTextOnline : styles.syncTextOffline]}>
            {isOnline
              ? 'Connected to Supabase Cloud Engine (Single Source of Truth)'
              : 'Offline Mode — Local Cache Active. Sync resumes when reconnected.'}
          </Text>
        </View>

        {/* Security & App Lock */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Security & App Lock</Text>

          {/* Lock App Now */}
          <PressableSpring
            style={styles.menuItem}
            onPress={lockApp}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#EEF0FF' }]}>
              <Lock size={18} color="#5B5CE2" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Lock Control Center Now</Text>
              <Text style={styles.menuDesc}>Immediately lock screen with your owner PIN</Text>
            </View>
            <ChevronRight size={18} color="#9AA2B1" />
          </PressableSpring>

          {/* Biometric Toggle */}
          {biometricStatus.hasHardware && (
            <View style={styles.menuItem}>
              <View style={[styles.iconWrap, { backgroundColor: '#EEF0FF' }]}>
                {biometricStatus.biometryType === 'Face ID' ? (
                  <ScanFace size={18} color="#5B5CE2" />
                ) : (
                  <Fingerprint size={18} color="#5B5CE2" />
                )}
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>{biometryName} Unlock</Text>
                <Text style={styles.menuDesc}>
                  {biometricStatus.isEnrolled
                    ? `Quick authentication via ${biometryName}`
                    : `Biometrics not enrolled in device settings`}
                </Text>
              </View>
              <Switch
                value={biometricsEnabled && biometricStatus.isEnrolled}
                onValueChange={toggleBiometrics}
                disabled={!biometricStatus.isEnrolled}
                trackColor={{ false: '#E7E9EE', true: '#EEF0FF' }}
                thumbColor={biometricsEnabled ? '#5B5CE2' : '#9AA2B1'}
              />
            </View>
          )}

          {/* Auto-Lock Timeout */}
          <PressableSpring
            style={styles.menuItem}
            onPress={handleSelectAutoLock}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#EAF8F2' }]}>
              <Clock size={18} color="#18A86B" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Auto-Lock Timeout</Text>
              <Text style={styles.menuDesc}>{getAutoLockLabel()}</Text>
            </View>
            <ChevronRight size={18} color="#9AA2B1" />
          </PressableSpring>

          {/* Change PIN */}
          <PressableSpring
            style={styles.menuItem}
            onPress={handleChangePin}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#FFF6DF' }]}>
              <KeyRound size={18} color="#D99000" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Change Owner PIN</Text>
              <Text style={styles.menuDesc}>Update your 4-digit security PIN</Text>
            </View>
            <ChevronRight size={18} color="#9AA2B1" />
          </PressableSpring>
        </View>

        {/* Business Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Business Modules</Text>

          {/* Products & Plans */}
          <PressableSpring
            style={styles.menuItem}
            onPress={() => router.push('/products')}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#EEF0FF' }]}>
              <Package size={18} color="#5B5CE2" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Products & Plans</Text>
              <Text style={styles.menuDesc}>Manage SaaS licenses, durations & plans</Text>
            </View>
            <ChevronRight size={18} color="#9AA2B1" />
          </PressableSpring>

          {/* Reports */}
          <PressableSpring
            style={styles.menuItem}
            onPress={() => router.push('/reports')}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#EAF8F2' }]}>
              <BarChart3 size={18} color="#18A86B" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Financial Reports</Text>
              <Text style={styles.menuDesc}>Revenue trends, receivables & exports</Text>
            </View>
            <ChevronRight size={18} color="#9AA2B1" />
          </PressableSpring>
        </View>

        {/* Business Profile & Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Preferences & Profile</Text>

          <PressableSpring
            style={styles.menuItem}
            onPress={() => router.push('/settings')}
          >
            <View style={[styles.iconWrap, { backgroundColor: '#FFF6DF' }]}>
              <Bell size={18} color="#D99000" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Business Profile & Notifications</Text>
              <Text style={styles.menuDesc}>Company info, receipt prefixes & reminders</Text>
            </View>
            <ChevronRight size={18} color="#9AA2B1" />
          </PressableSpring>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <PressableSpring style={styles.signOutBtn} onPress={handleSignOut}>
            <LogOut size={16} color="#D94B63" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </PressableSpring>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>WebRajya Control Center</Text>
          <Text style={styles.footerSub}>Private Personal App for Aryan Rajput</Text>
        </View>
      </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#171A21',
  },
  subtitle: {
    fontSize: 13,
    color: '#687080',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E9EE',
    marginBottom: 12,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171A21',
  },
  profileEmail: {
    fontSize: 12,
    color: '#687080',
    marginTop: 2,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EEF0FF',
    borderWidth: 1,
    borderColor: 'rgba(91, 92, 226, 0.2)',
  },
  ownerRoleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5B5CE2',
    letterSpacing: 0.8,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  syncOnline: {
    backgroundColor: '#EAF8F2',
    borderColor: 'rgba(24, 168, 107, 0.2)',
  },
  syncOffline: {
    backgroundColor: '#FFF0F3',
    borderColor: 'rgba(217, 75, 99, 0.2)',
  },
  syncText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  syncTextOnline: {
    color: '#18A86B',
  },
  syncTextOffline: {
    color: '#D94B63',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#687080',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E7E9EE',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171A21',
  },
  menuDesc: {
    fontSize: 12,
    color: '#687080',
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFF0F3',
    padding: 14,
    borderRadius: 14,
  },
  signOutText: {
    color: '#D94B63',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#687080',
    fontWeight: '600',
  },
  footerSub: {
    fontSize: 11,
    color: '#9AA2B1',
    marginTop: 2,
  },
});
