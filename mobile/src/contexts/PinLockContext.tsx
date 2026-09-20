import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  hasOwnerPin,
  setOwnerPin,
  verifyOwnerPin,
  clearOwnerPin,
  getAutoLockTimeout,
  setAutoLockTimeout as persistAutoLockTimeout,
  checkBiometricStatus,
  isBiometricsEnabled as fetchBiometricsEnabled,
  setBiometricsEnabled as persistBiometricsEnabled,
  authenticateWithBiometrics,
  BiometricStatus,
  DEFAULT_AUTO_LOCK_SECONDS,
} from '../services/pinService';
import { useAuth } from './AuthContext';

interface PinLockContextType {
  isLocked: boolean;
  isPinSet: boolean;
  isReady: boolean;
  autoLockSeconds: number;
  biometricStatus: BiometricStatus;
  biometricsEnabled: boolean;
  unlockApp: () => void;
  lockApp: () => void;
  verifyPin: (pin: string) => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  updateAutoLockSeconds: (seconds: number) => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<void>;
  triggerBiometricPrompt: () => Promise<boolean>;
  resetPinSession: () => Promise<void>;
}

const PinLockContext = createContext<PinLockContextType | undefined>(undefined);

export const PinLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isPinSet, setIsPinSet] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [autoLockSeconds, setAutoLockSeconds] = useState<number>(DEFAULT_AUTO_LOCK_SECONDS);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(true);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>({
    isAvailable: false,
    hasHardware: false,
    isEnrolled: false,
    biometryType: null,
  });

  const lastBackgroundTimeRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Initialize PIN & Security state
  const refreshSecurityState = useCallback(async () => {
    try {
      const pinExists = await hasOwnerPin();
      const timeout = await getAutoLockTimeout();
      const bioStatus = await checkBiometricStatus();
      const bioEnabled = await fetchBiometricsEnabled();

      setIsPinSet(pinExists);
      setAutoLockSeconds(timeout);
      setBiometricStatus(bioStatus);
      setBiometricsEnabled(bioEnabled);

      // If user is authenticated and PIN is already set, lock on startup
      if (user && pinExists) {
        setIsLocked(true);
      } else if (!user) {
        setIsLocked(false);
      } else {
        // Authenticated but no PIN configured yet -> will trigger setup
        setIsLocked(true);
      }
    } catch (err) {
      console.log('Error initializing PIN security state:', err);
    } finally {
      setIsReady(true);
    }
  }, [user]);

  useEffect(() => {
    refreshSecurityState();
  }, [refreshSecurityState]);

  // AppState background/active listener for auto-lock
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // Moving from active to background/inactive
      if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
        lastBackgroundTimeRef.current = Date.now();
      }

      // Returning from background to active
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        const backgroundTime = lastBackgroundTimeRef.current;
        lastBackgroundTimeRef.current = null;

        if (user && isPinSet && backgroundTime !== null) {
          const timeout = autoLockSeconds;

          // -1 means Never lock on background
          if (timeout !== -1) {
            const elapsedSeconds = (Date.now() - backgroundTime) / 1000;
            if (timeout === 0 || elapsedSeconds >= timeout) {
              setIsLocked(true);
            }
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [user, isPinSet, autoLockSeconds]);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
  }, []);

  const lockApp = useCallback(() => {
    if (isPinSet) {
      setIsLocked(true);
    }
  }, [isPinSet]);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const success = await verifyOwnerPin(pin);
    if (success) {
      setIsLocked(false);
    }
    return success;
  }, []);

  const setupPin = useCallback(async (pin: string): Promise<void> => {
    await setOwnerPin(pin);
    setIsPinSet(true);
    setIsLocked(false);
  }, []);

  const updateAutoLockSeconds = useCallback(async (seconds: number): Promise<void> => {
    await persistAutoLockTimeout(seconds);
    setAutoLockSeconds(seconds);
  }, []);

  const toggleBiometrics = useCallback(async (enabled: boolean): Promise<void> => {
    await persistBiometricsEnabled(enabled);
    setBiometricsEnabled(enabled);
  }, []);

  const triggerBiometricPrompt = useCallback(async (): Promise<boolean> => {
    if (!biometricsEnabled || !biometricStatus.isAvailable) {
      return false;
    }
    const success = await authenticateWithBiometrics('Unlock WebRajya Owner Console');
    if (success) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [biometricsEnabled, biometricStatus]);

  const resetPinSession = useCallback(async () => {
    await clearOwnerPin();
    setIsPinSet(false);
    setIsLocked(false);
  }, []);

  const value = {
    isLocked,
    isPinSet,
    isReady,
    autoLockSeconds,
    biometricStatus,
    biometricsEnabled,
    unlockApp,
    lockApp,
    verifyPin,
    setupPin,
    updateAutoLockSeconds,
    toggleBiometrics,
    triggerBiometricPrompt,
    resetPinSession,
  };

  return <PinLockContext.Provider value={value}>{children}</PinLockContext.Provider>;
};

export const usePinLock = () => {
  const context = useContext(PinLockContext);
  if (!context) {
    throw new Error('usePinLock must be used within a PinLockProvider');
  }
  return context;
};
