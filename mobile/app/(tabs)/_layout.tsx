import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Users, RefreshCw, CreditCard, MoreHorizontal } from 'lucide-react-native';
import { useData } from '../../src/contexts/DataContext';

export default function TabLayout() {
  const { subscriptions } = useData();

  // Expiring soon count for badge
  const expiringCount = subscriptions.filter(
    (s) => s.status === 'EXPIRING_SOON' || s.status === 'EXPIRED'
  ).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#5B5CE2',
        tabBarInactiveTintColor: '#9AA2B1',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 16,
          right: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 26,
          height: 64,
          paddingBottom: Platform.OS === 'ios' ? 6 : 8,
          paddingTop: 8,
          paddingHorizontal: 8,
          borderWidth: 1,
          borderColor: '#E7E9EE',
          shadowColor: '#171A21',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => <Users size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="renewals"
        options={{
          title: 'Renewals',
          tabBarBadge: expiringCount > 0 ? expiringCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#D94B63',
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ color, size }) => <RefreshCw size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, size }) => <CreditCard size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <MoreHorizontal size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
