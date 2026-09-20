import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Shield } from 'lucide-react-native';

interface LaunchSplashScreenProps {
  onFinish: () => void;
}

export const LaunchSplashScreen: React.FC<LaunchSplashScreenProps> = ({ onFinish }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(8)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(12)).current;
  const titleScale = useRef(new Animated.Value(0.98)).current;

  const subOpacity = useRef(new Animated.Value(0)).current;
  const subTranslateY = useRef(new Animated.Value(6)).current;

  const dateOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // STEP 1: Logo animation (0 to 1 opacity, translateY 8 to 0 over 500ms)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // STEP 2: Show "Hello, Aryan Sir." after 400ms delay
    const timerStep2 = setTimeout(() => {
      setStep(2);
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(titleScale, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
      ]).start();
    }, 400);

    // STEP 3: Show dynamic time greeting & date after ~150ms additional delay
    const timerStep3 = setTimeout(() => {
      setStep(3);
      Animated.parallel([
        Animated.timing(subOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(subTranslateY, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(dateOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();
    }, 550);

    // Complete launch splash after ~2.0 seconds total
    const timerFinish = setTimeout(() => {
      onFinish();
    }, 2100);

    return () => {
      clearTimeout(timerStep2);
      clearTimeout(timerStep3);
      clearTimeout(timerFinish);
    };
  }, [onFinish]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning.';
    if (hour >= 12 && hour < 17) return 'Good afternoon.';
    if (hour >= 17 && hour < 21) return 'Good evening.';
    return 'Good night.';
  };

  const getFormattedDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    return now.toLocaleDateString('en-US', options);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* STEP 1: WebRajya Logo Identity */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <View style={styles.logoBadge}>
            <Shield size={28} color="#5B5CE2" />
          </View>
          <Text style={styles.brandName}>WEBRAJYA</Text>
        </Animated.View>

        {/* STEP 2: "Hello, Aryan Sir." */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [
                { translateY: titleTranslateY },
                { scale: titleScale },
              ],
            },
          ]}
        >
          <Text style={styles.titleText}>Hello, Aryan Sir.</Text>
        </Animated.View>

        {/* STEP 3: Dynamic Time Greeting & Date */}
        <Animated.View
          style={[
            styles.subContainer,
            {
              opacity: subOpacity,
              transform: [{ translateY: subTranslateY }],
            },
          ]}
        >
          <Text style={styles.subGreeting}>{getTimeGreeting()}</Text>
          <Animated.Text style={[styles.dateText, { opacity: dateOpacity }]}>
            {getFormattedDate()}
          </Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F7F8FA',
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EEF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(91, 92, 226, 0.15)',
  },
  brandName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5B5CE2',
    letterSpacing: 3.5,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171A21',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subContainer: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  subGreeting: {
    fontSize: 17,
    fontWeight: '500',
    color: '#687080',
    textAlign: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9AA2B1',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default LaunchSplashScreen;
