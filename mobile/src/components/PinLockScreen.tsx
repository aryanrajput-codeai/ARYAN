import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Vibration,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shield, Delete, ScanFace, Fingerprint, Lock } from 'lucide-react-native';
import { usePinLock } from '../contexts/PinLockContext';
import { useAuth } from '../contexts/AuthContext';

interface KeypadButtonProps {
  digit: string;
  letters?: string;
  onPress: (digit: string) => void;
  disabled?: boolean;
}

const KeypadButton: React.FC<KeypadButtonProps> = ({ digit, letters, onPress, disabled }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      speed: 30,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={() => onPress(digit)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={styles.keyWrapper}
      hitSlop={6}
    >
      <Animated.View
        style={[
          styles.keyCircle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.keyDigit}>{digit}</Text>
        {letters ? <Text style={styles.keyLetters}>{letters}</Text> : <View style={styles.emptyLetters} />}
      </Animated.View>
    </Pressable>
  );
};

export default function PinLockScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const {
    isPinSet,
    verifyPin,
    setupPin,
    biometricStatus,
    biometricsEnabled,
    triggerBiometricPrompt,
  } = usePinLock();

  const [pin, setPin] = useState('');
  const [setupStep, setSetupStep] = useState<'ENTER_FIRST' | 'CONFIRM_SECOND' | 'SUCCESS'>('ENTER_FIRST');
  const [firstPin, setFirstPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;
  const dotScaleAnims = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  // Auto trigger biometrics on initial mount if already set up
  useEffect(() => {
    if (isPinSet && biometricsEnabled && biometricStatus.isAvailable) {
      const timer = setTimeout(() => {
        triggerBiometricPrompt();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isPinSet, biometricsEnabled, biometricStatus.isAvailable, triggerBiometricPrompt]);

  const triggerShake = () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(60);
    }
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 30, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
    ]).start();
  };

  const animateDot = (index: number) => {
    if (dotScaleAnims[index]) {
      dotScaleAnims[index].setValue(0.4);
      Animated.spring(dotScaleAnims[index], {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4 || isVerifying || isSuccess) return;

    setErrorMessage(null);
    const newPin = pin + digit;
    setPin(newPin);
    animateDot(newPin.length - 1);

    if (newPin.length === 4) {
      handleCompletePin(newPin);
    }
  };

  const handleDeletePress = () => {
    if (pin.length === 0 || isVerifying || isSuccess) return;
    setErrorMessage(null);
    setPin(pin.slice(0, -1));
  };

  const handleClearAll = () => {
    if (isVerifying || isSuccess) return;
    setErrorMessage(null);
    setPin('');
  };

  const handleCompletePin = async (completedPin: string) => {
    setIsVerifying(true);

    if (!isPinSet) {
      // First-time setup flow
      if (setupStep === 'ENTER_FIRST') {
        setFirstPin(completedPin);
        setPin('');
        setSetupStep('CONFIRM_SECOND');
        setIsVerifying(false);
      } else {
        // Confirming PIN
        if (completedPin === firstPin) {
          setSetupStep('SUCCESS');
          setIsSuccess(true);
          setTimeout(async () => {
            Animated.timing(fadeOutAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start(async () => {
              await setupPin(completedPin);
            });
          }, 400);
        } else {
          triggerShake();
          setErrorMessage('PINs did not match. Try again.');
          setTimeout(() => {
            setPin('');
            setFirstPin('');
            setSetupStep('ENTER_FIRST');
            setIsVerifying(false);
          }, 600);
        }
      }
    } else {
      // Normal Unlock flow
      const isValid = await verifyPin(completedPin);
      if (isValid) {
        setIsSuccess(true);
        Animated.timing(fadeOutAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        triggerShake();
        setErrorMessage('Incorrect PIN');
        setTimeout(() => {
          setPin('');
          setIsVerifying(false);
          setTimeout(() => setErrorMessage(null), 1200);
        }, 300);
      }
    }
  };

  const handleForgotPin = () => {
    Alert.alert(
      'Reset PIN',
      'Sign out and log in with your WebRajya owner credentials to reset your security PIN?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out & Reset',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  // Header copy configuration based on requirements
  let headerGreeting = 'Welcome back, Aryan.';
  let headerPrompt = 'Enter your PIN';

  if (!isPinSet) {
    if (setupStep === 'ENTER_FIRST') {
      headerGreeting = "Let's secure your WebRajya.";
      headerPrompt = 'Create your owner PIN';
    } else if (setupStep === 'CONFIRM_SECOND') {
      headerGreeting = 'Confirm your PIN';
      headerPrompt = 'Re-enter your 4-digit PIN';
    } else {
      headerGreeting = "You're all set.";
      headerPrompt = 'Entering WebRajya...';
    }
  }

  const renderBiometricIcon = () => {
    if (biometricStatus.biometryType === 'Face ID') {
      return <ScanFace size={22} color="#5B5CE2" />;
    }
    return <Fingerprint size={22} color="#5B5CE2" />;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 20),
          opacity: fadeOutAnim,
        },
      ]}
    >
      {/* Top Brand Banner */}
      <View style={styles.brandRow}>
        <View style={styles.brandBadge}>
          <Shield size={16} color="#5B5CE2" />
          <Text style={styles.brandName}>WEBRAJYA</Text>
        </View>
        <View style={styles.vaultBadge}>
          <Lock size={12} color="#5B5CE2" />
          <Text style={styles.vaultText}>OWNER VAULT</Text>
        </View>
      </View>

      {/* Center PIN Title & Dots */}
      <View style={styles.centerSection}>
        <Text style={styles.titleText}>{headerGreeting}</Text>
        <Text style={styles.subtitleText}>{headerPrompt}</Text>

        {/* 4 PIN Dots */}
        <Animated.View
          style={[
            styles.dotsRow,
            {
              transform: [{ translateX: shakeAnim }],
            },
          ]}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dotBase,
                  isFilled ? styles.dotFilled : styles.dotEmpty,
                  isSuccess && styles.dotSuccess,
                  errorMessage && isFilled && styles.dotError,
                  {
                    transform: [{ scale: dotScaleAnims[index] }],
                  },
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Error Notice */}
        <View style={styles.errorContainer}>
          {errorMessage ? (
            <Text style={styles.errorFeedbackText}>{errorMessage}</Text>
          ) : (
            <Text style={styles.placeholderFeedbackText}> </Text>
          )}
        </View>
      </View>

      {/* Numeric Keypad */}
      <View style={styles.keypadContainer}>
        {/* Row 1 */}
        <View style={styles.keypadRow}>
          <KeypadButton digit="1" onPress={handleDigitPress} disabled={isVerifying || isSuccess} />
          <KeypadButton digit="2" letters="ABC" onPress={handleDigitPress} disabled={isVerifying || isSuccess} />
          <KeypadButton digit="3" letters="DEF" onPress={handleDigitPress} disabled={isVerifying || isSuccess} />
        </View>

        {/* Row 2 */}
        <View style={styles.keypadRow}>
          <KeypadButton digit="4" letters="GHI" onPress={handleDigitPress} disabled={isVerifying || isSuccess} />
          <KeypadButton digit="5" letters="JKL" onPress={handleDigitPress} disabled={isVerifying || isSuccess} />
          <KeypadButton digit="6" letters="MNO" onPress={handleDigitPress} disabled={isVerifying || isSuccess} />
        </View>

        {/* Row 3 */}
        <View style={styles.keypadRow}>
          <KeypadButton digit="7" letters="PQRS" onPress={handleDigitPress} disabled={isVerifying || isSuccess} />
          <KeypadButton digit="8" letters="TUV" onPress={handleDigitPress} disabled={isVerifying || isSuccess} />
          <KeypadButton digit="9" letters="WXYZ" onPress={handleDigitPress} disabled={isVerifying || isSuccess} />
        </View>

        {/* Row 4: Biometrics | 0 | Delete */}
        <View style={styles.keypadRow}>
          {/* Biometrics */}
          <View style={styles.sideKeyWrapper}>
            {isPinSet && biometricsEnabled && biometricStatus.isAvailable ? (
              <TouchableOpacity
                style={styles.auxKeyCircle}
                onPress={triggerBiometricPrompt}
                activeOpacity={0.65}
                hitSlop={12}
              >
                {renderBiometricIcon()}
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Digit 0 */}
          <KeypadButton digit="0" letters="+" onPress={handleDigitPress} disabled={isVerifying || isSuccess} />

          {/* Delete / Backspace */}
          <View style={styles.sideKeyWrapper}>
            {pin.length > 0 ? (
              <TouchableOpacity
                style={styles.auxKeyCircle}
                onPress={handleDeletePress}
                onLongPress={handleClearAll}
                activeOpacity={0.65}
                hitSlop={12}
              >
                <Delete size={20} color="#687080" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {/* Footer Option */}
      <View style={styles.footerSection}>
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={handleForgotPin}
          activeOpacity={0.7}
          hitSlop={10}
        >
          <Text style={styles.forgotBtnText}>Forgot PIN? Sign In with Password</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F7F8FA',
    zIndex: 99999,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 8,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171A21',
    letterSpacing: 2,
  },
  vaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF0FF',
    borderWidth: 1,
    borderColor: 'rgba(91, 92, 226, 0.2)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  vaultText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5B5CE2',
    letterSpacing: 1,
  },
  centerSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#171A21',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: '#687080',
    marginTop: 6,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 32,
    height: 30,
  },
  dotBase: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dotEmpty: {
    borderWidth: 1.5,
    borderColor: '#E7E9EE',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#5B5CE2',
    borderWidth: 1.5,
    borderColor: '#5B5CE2',
  },
  dotSuccess: {
    backgroundColor: '#18A86B',
    borderColor: '#18A86B',
  },
  dotError: {
    backgroundColor: '#D94B63',
    borderColor: '#D94B63',
  },
  errorContainer: {
    height: 24,
    marginTop: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorFeedbackText: {
    fontSize: 13,
    color: '#D94B63',
    fontWeight: '600',
  },
  placeholderFeedbackText: {
    fontSize: 13,
    color: 'transparent',
  },
  keypadContainer: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyWrapper: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9EE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171A21',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  keyDigit: {
    fontSize: 26,
    fontWeight: '600',
    color: '#171A21',
  },
  keyLetters: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9AA2B1',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  emptyLetters: {
    height: 11,
  },
  sideKeyWrapper: {
    width: 74,
    height: 74,
    justifyContent: 'center',
    alignItems: 'center',
  },
  auxKeyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  forgotBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  forgotBtnText: {
    fontSize: 13,
    color: '#5B5CE2',
    fontWeight: '600',
  },
});
