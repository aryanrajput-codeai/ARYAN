import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

const STORAGE_KEY_PIN_HASH = 'webrajya_owner_pin_hash';
const STORAGE_KEY_PIN_SALT = 'webrajya_owner_pin_salt';
const STORAGE_KEY_AUTO_LOCK = 'webrajya_owner_auto_lock_seconds';
const STORAGE_KEY_BIOMETRICS_ENABLED = 'webrajya_owner_biometrics_enabled';

// Default auto-lock timeout is 5 minutes (300 seconds)
export const DEFAULT_AUTO_LOCK_SECONDS = 300;

export interface AutoLockOption {
  label: string;
  seconds: number;
}

export const AUTO_LOCK_OPTIONS: AutoLockOption[] = [
  { label: 'Immediately', seconds: 0 },
  { label: 'After 1 minute', seconds: 60 },
  { label: 'After 5 minutes', seconds: 300 },
  { label: 'After 15 minutes', seconds: 900 },
  { label: 'Never', seconds: -1 },
];

/**
 * Secure key-value storage helper with graceful fallback
 */
async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  } catch (err) {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      const val = await SecureStore.getItemAsync(key);
      if (val !== null) return val;
    }
    return await AsyncStorage.getItem(key);
  } catch (err) {
    return await AsyncStorage.getItem(key);
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (err) {
    // Ignore error
  }
  await AsyncStorage.removeItem(key);
}

/**
 * Generate a random cryptographic salt
 */
function generateSalt(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

/**
 * Hash PIN with salt using SHA-256
 */
async function hashPin(pin: string, salt: string): Promise<string> {
  const combined = `webrajya_owner_${salt}_${pin}_secure_vault`;
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
}

/**
 * Check if the owner has configured a PIN
 */
export async function hasOwnerPin(): Promise<boolean> {
  const hash = await secureGet(STORAGE_KEY_PIN_HASH);
  return Boolean(hash && hash.length > 0);
}

/**
 * Store a newly established owner PIN.
 * Uses SHA-256 + unique device salt in secure storage.
 */
export async function setOwnerPin(pin: string): Promise<void> {
  if (!pin || pin.length < 4) {
    throw new Error('Owner PIN must be at least 4 digits');
  }
  const salt = generateSalt();
  const hash = await hashPin(pin, salt);

  await secureSet(STORAGE_KEY_PIN_SALT, salt);
  await secureSet(STORAGE_KEY_PIN_HASH, hash);
}

/**
 * Verify entered PIN against stored secure hash
 */
export async function verifyOwnerPin(enteredPin: string): Promise<boolean> {
  const storedHash = await secureGet(STORAGE_KEY_PIN_HASH);
  const storedSalt = await secureGet(STORAGE_KEY_PIN_SALT);

  if (!storedHash || !storedSalt) {
    return false;
  }

  const computedHash = await hashPin(enteredPin, storedSalt);
  return computedHash === storedHash;
}

/**
 * Clear stored PIN credentials (e.g. on full account sign out)
 */
export async function clearOwnerPin(): Promise<void> {
  await secureDelete(STORAGE_KEY_PIN_HASH);
  await secureDelete(STORAGE_KEY_PIN_SALT);
}

/**
 * Auto-lock preferences
 */
export async function getAutoLockTimeout(): Promise<number> {
  const val = await secureGet(STORAGE_KEY_AUTO_LOCK);
  if (val === null) return DEFAULT_AUTO_LOCK_SECONDS;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? DEFAULT_AUTO_LOCK_SECONDS : parsed;
}

export async function setAutoLockTimeout(seconds: number): Promise<void> {
  await secureSet(STORAGE_KEY_AUTO_LOCK, String(seconds));
}

/**
 * Biometrics support & preferences
 */
export interface BiometricStatus {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  biometryType: 'Face ID' | 'Touch ID' | 'Biometrics' | null;
}

export async function checkBiometricStatus(): Promise<BiometricStatus> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometryType: 'Face ID' | 'Touch ID' | 'Biometrics' | null = null;
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometryType = 'Face ID';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometryType = Platform.OS === 'ios' ? 'Touch ID' : 'Biometrics';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometryType = 'Biometrics';
    }

    return {
      isAvailable: hasHardware && isEnrolled,
      hasHardware,
      isEnrolled,
      biometryType,
    };
  } catch (err) {
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      biometryType: null,
    };
  }
}

export async function isBiometricsEnabled(): Promise<boolean> {
  const val = await secureGet(STORAGE_KEY_BIOMETRICS_ENABLED);
  // Default to true if biometrics hardware is available
  if (val === null) return true;
  return val === 'true';
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  await secureSet(STORAGE_KEY_BIOMETRICS_ENABLED, enabled ? 'true' : 'false');
}

/**
 * Prompt native Face ID / Touch ID / Biometrics prompt
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Unlock WebRajya Owner Console'
): Promise<boolean> {
  try {
    const status = await checkBiometricStatus();
    if (!status.isAvailable) return false;

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use PIN',
      fallbackLabel: 'Enter PIN',
      disableDeviceFallback: true,
    });

    return res.success;
  } catch (err) {
    console.log('Biometric auth notice:', err);
    return false;
  }
}
