import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  onPress?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subtitle,
  icon,
  accentColor = '#4f46e5',
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {icon && <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>{icon}</View>}
      </View>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    flex: 1,
    minWidth: '46%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  iconContainer: {
    padding: 6,
    borderRadius: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
});
