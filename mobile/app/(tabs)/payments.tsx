import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, CreditCard, X, ChevronRight, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { PressableSpring } from '../../src/components/PressableSpring';
import { useData } from '../../src/contexts/DataContext';
import { formatCurrency, formatDateDisplay, getTodayISO } from '../../src/lib/dateUtils';
import { EmptyState } from '../../src/components/EmptyState';

type TimeFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';

export default function PaymentsTab() {
  const { payments, isRefreshing, refreshData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('THIS_MONTH');

  const filteredPayments = useMemo(() => {
    let list = payments.filter((p) => p.status !== 'VOIDED');
    const today = getTodayISO();

    if (timeFilter === 'TODAY') {
      list = list.filter((p) => p.payment_date === today);
    } else if (timeFilter === 'THIS_WEEK') {
      const now = new Date();
      const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const firstDayISO = firstDayOfWeek.toISOString().substring(0, 10);
      list = list.filter((p) => p.payment_date >= firstDayISO);
    } else if (timeFilter === 'THIS_MONTH') {
      const currentMonthKey = today.substring(0, 7);
      list = list.filter((p) => p.payment_date.startsWith(currentMonthKey));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.receipt_number.toLowerCase().includes(q) ||
          (p.client?.business_name && p.client.business_name.toLowerCase().includes(q)) ||
          (p.transaction_reference && p.transaction_reference.toLowerCase().includes(q)) ||
          p.payment_method.toLowerCase().includes(q)
      );
    }

    return list;
  }, [payments, searchQuery, timeFilter]);

  // Total collected for filtered period
  const totalCollected = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredPayments]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Payments</Text>
            <Text style={styles.subtitle}>Banking-style transaction ledger & receipts</Text>
          </View>
          <PressableSpring
            style={styles.addBtn}
            onPress={() => router.push('/payments/new')}
          >
            <Plus size={16} color="#5B5CE2" />
            <Text style={styles.addBtnText}>Record</Text>
          </PressableSpring>
        </View>

        {/* Banking Total Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalHeader}>
            <Text style={styles.totalLabel}>Total Collected</Text>
            <View style={styles.totalBadge}>
              <TrendingUp size={12} color="#18A86B" />
              <Text style={styles.totalBadgeText}>Completed</Text>
            </View>
          </View>
          <Text style={styles.totalAmount}>{formatCurrency(totalCollected)}</Text>
        </View>

        {/* Search Field */}
        <View style={styles.searchBar}>
          <Search size={18} color="#9AA2B1" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search receipt #, client, ref..."
            placeholderTextColor="#9AA2B1"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <PressableSpring onPress={() => setSearchQuery('')}>
              <X size={16} color="#9AA2B1" />
            </PressableSpring>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.pillsRow}>
          {[
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'THIS_WEEK', label: 'This Week' },
            { id: 'TODAY', label: 'Today' },
            { id: 'ALL', label: 'All Time' },
          ].map((item) => {
            const isSelected = timeFilter === item.id;
            return (
              <PressableSpring
                key={item.id}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => setTimeFilter(item.id as TimeFilter)}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {item.label}
                </Text>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* Payments Banking List */}
      <FlatList
        data={filteredPayments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={['#5B5CE2']}
            tintColor="#5B5CE2"
          />
        }
        renderItem={({ item, index }) => (
          <PressableSpring
            style={[
              styles.paymentRow,
              index === filteredPayments.length - 1 && styles.lastRow,
            ]}
            onPress={() => router.push(`/payments/${item.id}`)}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.methodIconBox}>
                <CreditCard size={16} color="#5B5CE2" />
              </View>
              <View style={styles.paymentTextGroup}>
                <Text style={styles.clientName} numberOfLines={1}>
                  {item.client?.business_name || 'Client'}
                </Text>
                <Text style={styles.subtext} numberOfLines={1}>
                  {item.subscription?.product?.name || 'SaaS Settlement'} • {item.receipt_number}
                </Text>
              </View>
            </View>

            <View style={styles.paymentRight}>
              <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
              <View style={styles.methodBadge}>
                <Text style={styles.methodBadgeText}>{item.payment_method}</Text>
              </View>
            </View>
          </PressableSpring>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<CreditCard size={32} color="#9AA2B1" />}
              title="No payments recorded"
              description={
                searchQuery
                  ? `No receipt matched "${searchQuery}".`
                  : 'No payment transactions recorded for this period.'
              }
              actionText={searchQuery ? 'Clear Search' : '+ Record Payment'}
              onAction={() => {
                if (searchQuery) setSearchQuery('');
                else router.push('/payments/new');
              }}
            />
          </View>
        }
      />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#171A21',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#687080',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF0FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(91, 92, 226, 0.2)',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B5CE2',
  },
  totalCard: {
    backgroundColor: '#F7F8FA',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E9EE',
    marginBottom: 12,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#687080',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF8F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  totalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#18A86B',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171A21',
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E7E9EE',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#171A21',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E7E9EE',
  },
  pillActive: {
    backgroundColor: '#5B5CE2',
    borderColor: '#5B5CE2',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#687080',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingBottom: 110,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7E9EE',
  },
  lastRow: {
    marginBottom: 0,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentTextGroup: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171A21',
  },
  subtext: {
    fontSize: 12,
    color: '#687080',
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171A21',
  },
  methodBadge: {
    marginTop: 3,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E7E9EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#687080',
  },
  emptyContainer: {
    paddingTop: 40,
  },
});
