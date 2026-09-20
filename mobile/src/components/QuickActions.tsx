import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { UserPlus, PlusCircle, CreditCard } from 'lucide-react-native';
import { router } from 'expo-router';

export const QuickActions: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/clients/new')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#eef2ff' }]}>
            <UserPlus size={18} color="#4f46e5" />
          </View>
          <Text style={styles.buttonText}>+ Add Client</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/subscriptions/new')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#f0fdf4' }]}>
            <PlusCircle size={18} color="#16a34a" />
          </View>
          <Text style={styles.buttonText}>+ Add Sub</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/payments/new')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#faf5ff' }]}>
            <CreditCard size={18} color="#9333ea" />
          </View>
          <Text style={styles.buttonText}>+ Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
});
