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
import { Search, UserPlus, Users, X, SlidersHorizontal, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { PressableSpring } from '../../src/components/PressableSpring';
import { useData } from '../../src/contexts/DataContext';
import { formatDateDisplay, calculateDaysRemaining } from '../../src/lib/dateUtils';
import { EmptyState } from '../../src/components/EmptyState';

export default function ClientsTab() {
  const { clients, isRefreshing, refreshData } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED'>('ALL');

  const filteredClients = useMemo(() => {
    let result = clients;

    if (filterStatus === 'ACTIVE') {
      result = result.filter((c) => c.status === 'ACTIVE');
    } else if (filterStatus === 'EXPIRING') {
      result = result.filter((c) =>
        (c.subscriptions || []).some((s) => s.status === 'EXPIRING_SOON')
      );
    } else if (filterStatus === 'EXPIRED') {
      result = result.filter((c) =>
        (c.subscriptions || []).some((s) => s.status === 'EXPIRED')
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.business_name.toLowerCase().includes(q) ||
          (c.owner_name && c.owner_name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.whatsapp && c.whatsapp.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.gstin && c.gstin.toLowerCase().includes(q))
      );
    }

    return result;
  }, [clients, searchQuery, filterStatus]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Editorial Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Clients</Text>
            <Text style={styles.subtitle}>Your WebRajya clients & subscriptions</Text>
          </View>
          <PressableSpring
            style={styles.addClientBtn}
            onPress={() => router.push('/clients/new')}
          >
            <UserPlus size={16} color="#5B5CE2" />
            <Text style={styles.addClientBtnText}>Add</Text>
          </PressableSpring>
        </View>

        {/* Rounded Search Field */}
        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Search size={18} color="#9AA2B1" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
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
        </View>

        {/* Horizontal Filter Pills */}
        <View style={styles.pillsRow}>
          {[
            { key: 'ALL', label: 'All Clients' },
            { key: 'ACTIVE', label: 'Active' },
            { key: 'EXPIRING', label: 'Expiring Soon' },
            { key: 'EXPIRED', label: 'Expired' },
          ].map((pill) => {
            const isSelected = filterStatus === pill.key;
            return (
              <PressableSpring
                key={pill.key}
                style={[styles.pill, isSelected && styles.pillActive]}
                onPress={() => setFilterStatus(pill.key as any)}
              >
                <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                  {pill.label}
                </Text>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* Clients List */}
      <FlatList
        data={filteredClients}
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
        renderItem={({ item, index }) => {
          const activeSub = (item.subscriptions || [])[0];
          const daysLeft = activeSub ? calculateDaysRemaining(activeSub.end_date) : null;
          const isExpired = daysLeft !== null && daysLeft < 0;

          return (
            <PressableSpring
              style={[
                styles.clientRow,
                index === filteredClients.length - 1 && styles.lastRow,
              ]}
              onPress={() => router.push(`/clients/${item.id}`)}
            >
              <View style={styles.clientRowLeft}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {item.business_name ? item.business_name.charAt(0).toUpperCase() : 'C'}
                  </Text>
                </View>
                <View style={styles.clientInfoGroup}>
                  <Text style={styles.businessName} numberOfLines={1}>
                    {item.business_name}
                  </Text>
                  <Text style={styles.productSubtext} numberOfLines={1}>
                    {activeSub?.product?.name || 'No active plan'}
                  </Text>
                </View>
              </View>

              <View style={styles.clientRowRight}>
                {activeSub ? (
                  <View style={styles.dateGroup}>
                    <Text style={styles.renewalLabel}>
                      {isExpired ? 'Expired' : `Renewal ${formatDateDisplay(activeSub.end_date)}`}
                    </Text>
                    <View
                      style={[
                        styles.statusDot,
                        isExpired ? styles.dotDanger : styles.dotSuccess,
                      ]}
                    />
                  </View>
                ) : (
                  <Text style={styles.noSubText}>Inactive</Text>
                )}
                <ChevronRight size={16} color="#9AA2B1" />
              </View>
            </PressableSpring>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<Users size={32} color="#9AA2B1" />}
              title="No clients found"
              description={
                searchQuery
                  ? `No clients matched "${searchQuery}". Try a different term.`
                  : 'You have no clients in this filter section.'
              }
              actionText={searchQuery ? 'Clear Search' : '+ Add Client'}
              onAction={() => {
                if (searchQuery) setSearchQuery('');
                else router.push('/clients/new');
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
    marginBottom: 14,
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
  addClientBtn: {
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
  addClientBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B5CE2',
  },
  searchRow: {
    marginBottom: 12,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E7E9EE',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 44,
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
  clientRow: {
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
  clientRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B5CE2',
  },
  clientInfoGroup: {
    flex: 1,
  },
  businessName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171A21',
  },
  productSubtext: {
    fontSize: 12,
    color: '#687080',
    marginTop: 2,
  },
  clientRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  renewalLabel: {
    fontSize: 12,
    color: '#687080',
    fontWeight: '500',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotSuccess: {
    backgroundColor: '#18A86B',
  },
  dotDanger: {
    backgroundColor: '#D94B63',
  },
  noSubText: {
    fontSize: 12,
    color: '#9AA2B1',
  },
  emptyContainer: {
    paddingTop: 40,
  },
});
