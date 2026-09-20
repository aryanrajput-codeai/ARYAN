import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { DataProvider } from '../src/contexts/DataContext';
import { PinLockProvider, usePinLock } from '../src/contexts/PinLockContext';
import PinLockScreen from '../src/components/PinLockScreen';
import LaunchSplashScreen from '../src/components/LaunchSplashScreen';

function AppContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isLocked, isReady: isPinReady } = usePinLock();
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isAuthLoading]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
        <Stack.Screen
          name="clients/[id]"
          options={{
            headerShown: true,
            title: 'Client Profile',
            headerBackTitle: 'Back',
            headerTintColor: '#5B5CE2',
          }}
        />
        <Stack.Screen
          name="clients/new"
          options={{
            headerShown: true,
            title: 'Add Client',
            presentation: 'modal',
            headerTintColor: '#5B5CE2',
          }}
        />
        <Stack.Screen
          name="subscriptions/new"
          options={{
            headerShown: true,
            title: 'New Subscription',
            presentation: 'modal',
            headerTintColor: '#5B5CE2',
          }}
        />
        <Stack.Screen
          name="subscriptions/[id]"
          options={{
            headerShown: true,
            title: 'Subscription Details',
            headerTintColor: '#5B5CE2',
          }}
        />
        <Stack.Screen
          name="payments/new"
          options={{
            headerShown: true,
            title: 'Record Payment',
            presentation: 'modal',
            headerTintColor: '#5B5CE2',
          }}
        />
        <Stack.Screen
          name="payments/[id]"
          options={{
            headerShown: true,
            title: 'Payment Receipt',
            presentation: 'modal',
            headerTintColor: '#5B5CE2',
          }}
        />
        <Stack.Screen
          name="renewals/[id]"
          options={{
            headerShown: true,
            title: 'Renew Subscription',
            presentation: 'modal',
            headerTintColor: '#5B5CE2',
          }}
        />
        <Stack.Screen
          name="products/index"
          options={{
            headerShown: true,
            title: 'Products & Plans',
            headerTintColor: '#5B5CE2',
          }}
        />
        <Stack.Screen
          name="reports/index"
          options={{
            headerShown: true,
            title: 'Business Reports',
            headerTintColor: '#5B5CE2',
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            headerShown: true,
            title: 'Settings & Security',
            headerTintColor: '#5B5CE2',
          }}
        />
      </Stack>

      {/* 1. Launch Intro Splash Experience */}
      {showLaunchSplash ? (
        <LaunchSplashScreen onFinish={() => setShowLaunchSplash(false)} />
      ) : null}

      {/* 2. Owner PIN Lock Screen Overlay */}
      {!showLaunchSplash && user && isLocked && isPinReady ? <PinLockScreen /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PinLockProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </PinLockProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
