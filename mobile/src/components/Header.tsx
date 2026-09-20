import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, ShieldCheck, User } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  unreadAlertsCount?: number;
  onPressNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unreadAlertsCount = 0,
  onPressNotifications,
}) => {
  const { user, profile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.brandTitle}>WEBRAJYA</Text>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
        </View>

        <View style={styles.rightActions}>
          <View style={styles.ownerBadge}>
            <ShieldCheck size={12} color="#4338ca" />
            <Text style={styles.ownerRoleText}>OWNER</Text>
          </View>

          <TouchableOpacity
            style={styles.bellButton}
            onPress={onPressNotifications}
            activeOpacity={0.7}
          >
            <Bell size={20} color="#374151" />
            {unreadAlertsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#4f46e5',
  },
  greetingText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  ownerRoleText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#4338ca',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});
