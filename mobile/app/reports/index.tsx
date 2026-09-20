import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  TrendingUp,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Users,
  PieChart,
  Calendar,
} from 'lucide-react-native';
import { useData } from '../../src/contexts/DataContext';
import { formatCurrency } from '../../src/lib/dateUtils';

type ReportTab = 'REVENUE' | 'SUBSCRIPTIONS' | 'RENEWALS' | 'OUTSTANDING';

export default function ReportsScreen() {
  const { payments, subscriptions, clients } = useData();
  const [activeTab, setActiveTab] = useState<ReportTab>('REVENUE');

  // Revenue computations
  const validPayments = payments.filter((p) => p.status !== 'VOIDED');
  const totalLifetimeRevenue = validPayments.reduce((sum, p) => sum + p.amount, 0);

  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const currentMonthRevenue = validPayments
    .filter((p) => p.payment_date.startsWith(currentMonthKey))
    .reduce((sum, p) => sum + p.amount, 0);

  // Revenue by payment method
  const methodBreakdown = validPayments.reduce((acc, p) => {
    acc[p.payment_method] = (acc[p.payment_method] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  // Subscriptions computations
  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const expiringSoonSubs = subscriptions.filter((s) => s.status === 'EXPIRING_SOON');
  const expiredSubs = subscriptions.filter((s) => s.status === 'EXPIRED');
  const cancelledSubs = subscriptions.filter((s) => s.status === 'CANCELLED');

  const activeMRR = activeSubs.reduce((sum, s) => sum + s.amount, 0);

  // Outstanding computations
  const totalOutstanding = subscriptions
    .filter((s) => s.status !== 'CANCELLED')
    .reduce((sum, s) => sum + (s.outstanding_balance || 0), 0);

  const clientsWithBalance = clients
    .map((c) => {
      const balance = (c.subscriptions || []).reduce(
        (sum, s) => sum + (s.outstanding_balance || 0),
        0
      );
      return { client: c, balance };
    })
    .filter((i) => i.balance > 0)
    .sort((a, b) => b.balance - a.balance);

  // Renewals pipeline (due within 30 days)
  const renewalsPipelineValue = expiringSoonSubs.reduce((sum, s) => sum + s.amount, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        {[
          { id: 'REVENUE', label: 'Revenue' },
          { id: 'SUBSCRIPTIONS', label: 'Subscriptions' },
          { id: 'RENEWALS', label: 'Renewals' },
          { id: 'OUTSTANDING', label: 'Outstanding' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id as ReportTab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 1. REVENUE REPORT */}
      {activeTab === 'REVENUE' && (
        <View style={styles.reportSection}>
          <View style={styles.bigKpiCard}>
            <Text style={styles.kpiTitle}>Monthly Revenue (Current Month)</Text>
            <Text style={styles.kpiBigVal}>{formatCurrency(currentMonthRevenue)}</Text>
            <Text style={styles.kpiSub}>
              From {validPayments.filter((p) => p.payment_date.startsWith(currentMonthKey)).length}{' '}
              recorded receipts
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Lifetime Collections</Text>
            <Text style={styles.cardBigVal}>{formatCurrency(totalLifetimeRevenue)}</Text>
            <Text style={styles.cardSub}>Cumulative receipts audited across all time</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Collections by Payment Method</Text>
            {Object.entries(methodBreakdown).map(([method, amt]) => {
              const pct = totalLifetimeRevenue > 0 ? (amt / totalLifetimeRevenue) * 100 : 0;
              return (
                <View key={method} style={styles.breakdownRow}>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodName}>{method.replace('_', ' ')}</Text>
                    <Text style={styles.methodPct}>{pct.toFixed(1)}%</Text>
                  </View>
                  <Text style={styles.methodAmount}>{formatCurrency(amt)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 2. SUBSCRIPTIONS REPORT */}
      {activeTab === 'SUBSCRIPTIONS' && (
        <View style={styles.reportSection}>
          <View style={styles.bigKpiCard}>
            <Text style={styles.kpiTitle}>Active Contract Volume</Text>
            <Text style={styles.kpiBigVal}>{formatCurrency(activeMRR)}</Text>
            <Text style={styles.kpiSub}>{activeSubs.length} active software contracts</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Subscription Lifecycle Status</Text>

            <View style={styles.metricRow}>
              <View style={[styles.statusDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.metricLabel}>Active Subscriptions</Text>
              <Text style={styles.metricCount}>{activeSubs.length}</Text>
            </View>

            <View style={styles.metricRow}>
              <View style={[styles.statusDot, { backgroundColor: '#d97706' }]} />
              <Text style={styles.metricLabel}>Expiring Soon (&lt;30 days)</Text>
              <Text style={styles.metricCount}>{expiringSoonSubs.length}</Text>
            </View>

            <View style={styles.metricRow}>
              <View style={[styles.statusDot, { backgroundColor: '#dc2626' }]} />
              <Text style={styles.metricLabel}>Expired / Lapsed</Text>
              <Text style={styles.metricCount}>{expiredSubs.length}</Text>
            </View>

            <View style={styles.metricRow}>
              <View style={[styles.statusDot, { backgroundColor: '#9ca3af' }]} />
              <Text style={styles.metricLabel}>Cancelled</Text>
              <Text style={styles.metricCount}>{cancelledSubs.length}</Text>
            </View>
          </View>
        </View>
      )}

      {/* 3. RENEWALS REPORT */}
      {activeTab === 'RENEWALS' && (
        <View style={styles.reportSection}>
          <View style={styles.bigKpiCard}>
            <Text style={styles.kpiTitle}>30-Day Renewal Pipeline</Text>
            <Text style={styles.kpiBigVal}>{formatCurrency(renewalsPipelineValue)}</Text>
            <Text style={styles.kpiSub}>
              {expiringSoonSubs.length} subscriptions requiring outreach
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upcoming Renewal Targets</Text>
            {expiringSoonSubs.slice(0, 6).map((sub) => (
              <View key={sub.id} style={styles.pipelineRow}>
                <View style={styles.pipelineLeft}>
                  <Text style={styles.pipelineClient}>{sub.client?.business_name}</Text>
                  <Text style={styles.pipelineProduct}>{sub.product?.name}</Text>
                </View>
                <Text style={styles.pipelineAmt}>{formatCurrency(sub.amount)}</Text>
              </View>
            ))}
            {expiringSoonSubs.length === 0 && (
              <Text style={styles.emptyNotice}>No subscriptions expiring in the next 30 days.</Text>
            )}
          </View>
        </View>
      )}

      {/* 4. OUTSTANDING REPORT */}
      {activeTab === 'OUTSTANDING' && (
        <View style={styles.reportSection}>
          <View style={[styles.bigKpiCard, { borderColor: '#fca5a5' }]}>
            <Text style={styles.kpiTitle}>Total Outstanding Receivables</Text>
            <Text style={[styles.kpiBigVal, { color: '#dc2626' }]}>
              {formatCurrency(totalOutstanding)}
            </Text>
            <Text style={styles.kpiSub}>Unpaid contract balances across active clients</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top Debtors / Balances Due</Text>
            {clientsWithBalance.slice(0, 10).map(({ client, balance }) => (
              <View key={client.id} style={styles.debtorRow}>
                <View style={styles.debtorLeft}>
                  <Text style={styles.debtorName}>{client.business_name}</Text>
                  {client.phone ? (
                    <Text style={styles.debtorPhone}>{client.phone}</Text>
                  ) : null}
                </View>
                <Text style={styles.debtorAmount}>{formatCurrency(balance)}</Text>
              </View>
            ))}
            {clientsWithBalance.length === 0 && (
              <Text style={styles.emptyNotice}>All accounts in good standing! No overdue balances.</Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#4f46e5',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  reportSection: {
    gap: 12,
  },
  bigKpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  kpiTitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '700',
  },
  kpiBigVal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  cardBigVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
  },
  cardSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  methodPct: {
    fontSize: 12,
    color: '#9ca3af',
  },
  methodAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  metricLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  metricCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  pipelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pipelineLeft: {
    flex: 1,
  },
  pipelineClient: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  pipelineProduct: {
    fontSize: 12,
    color: '#6b7280',
  },
  pipelineAmt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4f46e5',
  },
  debtorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  debtorLeft: {
    flex: 1,
  },
  debtorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  debtorPhone: {
    fontSize: 12,
    color: '#6b7280',
  },
  debtorAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dc2626',
  },
  emptyNotice: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
});
