import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Plus,
  ArrowUpRight,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { NotificationsModal } from '../../src/components/NotificationsModal';
import { PressableSpring } from '../../src/components/PressableSpring';
import { useData } from '../../src/contexts/DataContext';
import {
  formatCurrency,
  formatDateDisplay,
  calculateDaysRemaining,
} from '../../src/lib/dateUtils';

export default function HomeScreen() {
  const { clients, subscriptions, payments, isRefreshing, refreshData } = useData();
  const [showNotifications, setShowNotifications] = useState(false);

  // Active clients count
  const activeClientsCount = clients.filter((c) => c.status === 'ACTIVE').length;

  // Active licenses/subscriptions count
  const activeSubsCount = subscriptions.filter((s) => s.status === 'ACTIVE' || s.status === 'EXPIRING_SOON').length;

  // Subscriptions expiring soon (within 30 days)
  const expiringSoonSubs = subscriptions.filter((s) => s.status === 'EXPIRING_SOON');

  // Expired subscriptions
  const expiredSubs = subscriptions.filter((s) => s.status === 'EXPIRED');

  // Renewals due within 7 days
  const dueWithin7Days = subscriptions.filter((s) => {
    if (s.status === 'CANCELLED') return false;
    const days = calculateDaysRemaining(s.end_date);
    return days >= 0 && days <= 7;
  });

  // Pending payments (subscriptions with outstanding balance)
  const pendingPaymentSubs = subscriptions.filter((s) => (s.outstanding_balance || 0) > 0);

  // Monthly Revenue (payments in current calendar month excluding VOIDED)
  const currentMonthKey = new Date().toISOString().substring(0, 7);
  const monthlyRevenue = payments
    .filter((p) => p.status !== 'VOIDED' && p.payment_date.startsWith(currentMonthKey))
    .reduce((sum, p) => sum + p.amount, 0);

  // Previous month revenue comparison
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = prevMonthDate.toISOString().substring(0, 7);
  const prevMonthRevenue = payments
    .filter((p) => p.status !== 'VOIDED' && p.payment_date.startsWith(prevMonthKey))
    .reduce((sum, p) => sum + p.amount, 0);

  let growthPercentage = 12.4;
  if (prevMonthRevenue > 0) {
    growthPercentage = Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100);
  }

  // Total Outstanding balance across all active subscriptions
  const totalOutstanding = subscriptions
    .filter((s) => s.status !== 'CANCELLED')
    .reduce((sum, s) => sum + (s.outstanding_balance || 0), 0);

  const totalRenewalsCount = expiringSoonSubs.length + expiredSubs.length;

  // Top expiring / expired renewals for horizontal scroll
  const upcomingRenewals = subscriptions
    .filter((s) => s.status === 'EXPIRING_SOON' || s.status === 'EXPIRED')
    .slice(0, 8);

  // Recent 5 payments
  const recentPaymentsList = payments.slice(0, 5);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  const formattedCurrentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            colors={['#5B5CE2']}
            tintColor="#5B5CE2"
          />
        }
      >
        {/* Editorial Brand & Greeting Header */}
        <View style={styles.topHeader}>
          <Text style={styles.brandMark}>WEBRAJYA</Text>
          <Text style={styles.greetingTitle}>{getTimeGreeting()}, Aryan</Text>
          <Text style={styles.dateSubtitle}>{formattedCurrentDate}</Text>

          {/* Integrated Quick Action Capsule Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            <PressableSpring
              style={styles.actionPillPrimary}
              onPress={() => router.push('/clients/new')}
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.actionPillPrimaryText}>New Client</Text>
            </PressableSpring>

            <PressableSpring
              style={styles.actionPillSecondary}
              onPress={() => router.push('/payments/new')}
            >
              <CreditCard size={14} color="#5B5CE2" />
              <Text style={styles.actionPillSecondaryText}>Record Payment</Text>
            </PressableSpring>

            <PressableSpring
              style={styles.actionPillSecondary}
              onPress={() => router.push('/subscriptions/new')}
            >
              <RefreshCw size={14} color="#5B5CE2" />
              <Text style={styles.actionPillSecondaryText}>New Subscription</Text>
            </PressableSpring>
          </ScrollView>
        </View>

        {/* Expressive Dominant Hero Revenue Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroLabel}>September revenue</Text>
            <View style={styles.growthBadge}>
              <TrendingUp size={12} color="#18A86B" />
              <Text style={styles.growthText}>
                {growthPercentage >= 0 ? `+${growthPercentage}%` : `${growthPercentage}%`} vs last month
              </Text>
            </View>
          </View>

          <Text style={styles.heroAmount}>{formatCurrency(monthlyRevenue)}</Text>

          {/* Smooth Trend Sparkline */}
          <View style={styles.sparklineContainer}>
            <Svg height="44" width="100%" viewBox="0 0 300 44">
              <Path
                d="M 0 38 Q 45 12, 90 28 T 180 14 T 270 24 T 300 6"
                fill="none"
                stroke="#5B5CE2"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </Svg>
          </View>

          <PressableSpring
            style={styles.heroFooterLink}
            onPress={() => router.push('/reports')}
          >
            <Text style={styles.heroFooterText}>View Financial Breakdown</Text>
            <ArrowUpRight size={15} color="#5B5CE2" />
          </PressableSpring>
        </View>

        {/* Asymmetric Compact Supporting Stats (Free on Canvas) */}
        <View style={styles.supportingStatsRow}>
          <View style={styles.statCompactBox}>
            <Text style={styles.statCompactLabel}>Active clients</Text>
            <Text style={styles.statCompactValue}>{activeClientsCount}</Text>
          </View>

          <View style={styles.statCompactBox}>
            <Text style={styles.statCompactLabel}>Active licenses</Text>
            <Text style={styles.statCompactValue}>{activeSubsCount}</Text>
          </View>

          <View style={[styles.statCompactBox, styles.statOutstandingBox]}>
            <Text style={styles.statOutstandingLabel}>Outstanding</Text>
            <Text style={styles.statOutstandingValue}>{formatCurrency(totalOutstanding)}</Text>
          </View>
        </View>

        {/* Upcoming Renewals — Horizontal Cards (Peek Reveal) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming renewals</Text>
          <PressableSpring onPress={() => router.push('/(tabs)/renewals')}>
            <Text style={styles.seeAllLink}>See all</Text>
          </PressableSpring>
        </View>

        {upcomingRenewals.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.renewalsCardsScroll}
          >
            {upcomingRenewals.map((sub) => {
              const daysRemaining = calculateDaysRemaining(sub.end_date);
              const isExpired = daysRemaining < 0;

              return (
                <PressableSpring
                  key={sub.id}
                  style={styles.renewalHorizontalCard}
                  onPress={() => router.push(`/renewals/${sub.id}`)}
                >
                  <View style={styles.renewalCardTop}>
                    <Text style={styles.renewalClientName} numberOfLines={1}>
                      {sub.client?.business_name || 'Client'}
                    </Text>
                    <Text style={styles.renewalProductName} numberOfLines={1}>
                      {sub.product?.name || 'SaaS License'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.daysPill,
                      isExpired ? styles.daysPillExpired : styles.daysPillWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.daysPillText,
                        isExpired ? styles.daysTextExpired : styles.daysTextWarning,
                      ]}
                    >
                      {isExpired ? 'Expired' : `${daysRemaining} days left`}
                    </Text>
                  </View>

                  <Text style={styles.renewalCardAmount}>{formatCurrency(sub.amount)}</Text>
                </PressableSpring>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyRenewalsCard}>
            <Text style={styles.emptyRenewalsText}>You're all clear — no renewals due right now.</Text>
          </View>
        )}

        {/* Recent Payments — Clean Borderless Ledger Rows */}
        <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
          <Text style={styles.sectionTitle}>Recent payments</Text>
          <PressableSpring onPress={() => router.push('/(tabs)/payments')}>
            <Text style={styles.seeAllLink}>See all</Text>
          </PressableSpring>
        </View>

        <View style={styles.recentPaymentsContainer}>
          {recentPaymentsList.length > 0 ? (
            recentPaymentsList.map((payment, idx) => (
              <PressableSpring
                key={payment.id}
                style={[
                  styles.paymentRowItem,
                  idx === recentPaymentsList.length - 1 && styles.lastPaymentRow,
                ]}
                onPress={() => router.push(`/payments/${payment.id}`)}
              >
                <View style={styles.paymentRowLeft}>
                  <View style={styles.paymentIconBox}>
                    <CreditCard size={16} color="#5B5CE2" />
                  </View>
                  <View style={styles.paymentInfoGroup}>
                    <Text style={styles.paymentClientTitle} numberOfLines={1}>
                      {payment.client?.business_name || 'Client'}
                    </Text>
                    <Text style={styles.paymentProductSub}>
                      {payment.subscription?.product?.name || 'SaaS Settlement'}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentRowRight}>
                  <Text style={styles.paymentAmountText}>{formatCurrency(payment.amount)}</Text>
                  <Text style={styles.paymentDateText}>
                    {payment.payment_date ? formatDateDisplay(payment.payment_date) : 'Today'}
                  </Text>
                </View>
              </PressableSpring>
            ))
          ) : (
            <View style={styles.emptyPaymentsBox}>
              <Text style={styles.emptyPaymentsText}>No recent payments recorded yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Notifications Modal */}
      <NotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        expiringSubs={expiringSoonSubs}
        expiredSubs={expiredSubs}
        outstandingSubs={pendingPaymentSubs}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 110, // Extra clearance for floating bottom navigation capsule
  },
  topHeader: {
    marginBottom: 24,
  },
  brandMark: {
    fontSize: 11,
    fontWeight: '800',
    color: '#5B5CE2',
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#171A21',
    letterSpacing: -0.8,
  },
  dateSubtitle: {
    fontSize: 14,
    color: '#687080',
    marginTop: 4,
    fontWeight: '500',
  },
  quickActionsScroll: {
    gap: 10,
    marginTop: 16,
  },
  actionPillPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#5B5CE2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  actionPillPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionPillSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E9EE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  actionPillSecondaryText: {
    color: '#171A21',
    fontSize: 13,
    fontWeight: '600',
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E7E9EE',
    marginBottom: 20,
    shadowColor: '#171A21',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#687080',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF8F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#18A86B',
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#171A21',
    letterSpacing: -1.2,
    marginVertical: 4,
  },
  sparklineContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  heroFooterLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F6',
  },
  heroFooterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B5CE2',
  },
  supportingStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCompactBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7E9EE',
  },
  statCompactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#687080',
    marginBottom: 4,
  },
  statCompactValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171A21',
  },
  statOutstandingBox: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FFE0E6',
  },
  statOutstandingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D94B63',
    marginBottom: 4,
  },
  statOutstandingValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D94B63',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171A21',
    letterSpacing: -0.3,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B5CE2',
  },
  renewalsCardsScroll: {
    gap: 12,
    paddingBottom: 4,
    marginBottom: 8,
  },
  renewalHorizontalCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7E9EE',
    justifyContent: 'space-between',
    height: 142,
  },
  renewalCardTop: {
    marginBottom: 6,
  },
  renewalClientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171A21',
  },
  renewalProductName: {
    fontSize: 12,
    color: '#687080',
    marginTop: 2,
  },
  daysPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    marginVertical: 4,
  },
  daysPillWarning: {
    backgroundColor: '#FFF6DF',
  },
  daysPillExpired: {
    backgroundColor: '#FFF0F3',
  },
  daysPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  daysTextWarning: {
    color: '#D99000',
  },
  daysTextExpired: {
    color: '#D94B63',
  },
  renewalCardAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171A21',
  },
  emptyRenewalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E9EE',
  },
  emptyRenewalsText: {
    fontSize: 13,
    color: '#687080',
    fontWeight: '500',
  },
  recentPaymentsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E7E9EE',
    overflow: 'hidden',
  },
  paymentRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F6',
  },
  lastPaymentRow: {
    borderBottomWidth: 0,
  },
  paymentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  paymentIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentInfoGroup: {
    flex: 1,
  },
  paymentClientTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171A21',
  },
  paymentProductSub: {
    fontSize: 12,
    color: '#687080',
    marginTop: 2,
  },
  paymentRowRight: {
    alignItems: 'flex-end',
  },
  paymentAmountText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171A21',
  },
  paymentDateText: {
    fontSize: 11,
    color: '#9AA2B1',
    marginTop: 2,
  },
  emptyPaymentsBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyPaymentsText: {
    fontSize: 13,
    color: '#687080',
  },
});
