import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  FileText,
  Share2,
  Printer,
  Download,
  Shield,
  CheckCircle2,
  Ban,
} from 'lucide-react-native';
import * as Print from 'expo-print';
import { useData } from '../../src/contexts/DataContext';
import {
  formatCurrency,
  formatDateDisplay,
  formatDateTimeDisplay,
} from '../../src/lib/dateUtils';

export default function PaymentReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPaymentById, settings } = useData();

  const payment = getPaymentById(id);

  if (!payment) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Receipt not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isVoided = payment.status === 'VOIDED';

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #111827; }
            .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
            .brand { font-size: 24px; font-weight: 900; color: #4f46e5; letter-spacing: 1px; }
            .receipt-no { font-size: 16px; font-weight: bold; margin-top: 10px; color: #374151; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; margin-top: 8px; ${
              isVoided ? 'background: #fee2e2; color: #dc2626;' : 'background: #ecfdf5; color: #059669;'
            } }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
            .label { color: #6b7280; font-size: 14px; }
            .value { font-weight: 600; font-size: 14px; }
            .total-row { display: flex; justify-content: space-between; padding: 16px 0; margin-top: 20px; border-top: 2px solid #111827; }
            .total-label { font-size: 18px; font-weight: bold; }
            .total-value { font-size: 22px; font-weight: 900; color: #4f46e5; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">WEBRAJYA SUBSCRIPTION RECEIPT</div>
            <div class="receipt-no">Receipt #${payment.receipt_number}</div>
            <div class="status-badge">${isVoided ? 'VOIDED TRANSACTION' : 'OFFICIAL PAYMENT RECEIPT'}</div>
          </div>

          <div class="row">
            <span class="label">Client / Business</span>
            <span class="value">${payment.client?.business_name || 'Client'}</span>
          </div>

          <div class="row">
            <span class="label">Product & Plan</span>
            <span class="value">${payment.subscription?.product?.name || 'SaaS'} - ${payment.subscription?.plan?.name || 'Subscription'}</span>
          </div>

          <div class="row">
            <span class="label">Payment Date</span>
            <span class="value">${formatDateDisplay(payment.payment_date)}</span>
          </div>

          <div class="row">
            <span class="label">Payment Method</span>
            <span class="value">${payment.payment_method}</span>
          </div>

          ${
            payment.transaction_reference
              ? `<div class="row"><span class="label">Transaction Ref</span><span class="value">${payment.transaction_reference}</span></div>`
              : ''
          }

          ${
            payment.subscription
              ? `<div class="row"><span class="label">Subscription Term</span><span class="value">${formatDateDisplay(
                  payment.subscription.start_date
                )} to ${formatDateDisplay(payment.subscription.end_date)}</span></div>`
              : ''
          }

          <div class="total-row">
            <span class="total-label">Amount Paid</span>
            <span class="total-value">${formatCurrency(payment.amount)}</span>
          </div>

          <div class="footer">
            <p>Thank you for your business with WebRajya Technologies.</p>
            <p>Generated on ${formatDateTimeDisplay(new Date().toISOString())}</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleShare = async () => {
    const textMessage = `*WEBRAJYA OFFICIAL RECEIPT*\n\nReceipt No: ${payment.receipt_number}\nClient: ${payment.client?.business_name}\nProduct: ${payment.subscription?.product?.name || 'SaaS'}\nAmount Paid: ${formatCurrency(payment.amount)}\nDate: ${formatDateDisplay(payment.payment_date)}\nMethod: ${payment.payment_method}\nStatus: ${payment.status}\n\nThank you for choosing WebRajya!`;

    try {
      await Share.share({
        message: textMessage,
        title: `Receipt ${payment.receipt_number}`,
      });
    } catch (err: any) {
      Alert.alert('Share Error', err.message);
    }
  };

  const handlePrint = async () => {
    try {
      const html = generateReceiptHTML();
      await Print.printAsync({ html });
    } catch (err: any) {
      Alert.alert('Print Error', err.message);
    }
  };

  const handleDownload = async () => {
    try {
      const html = generateReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html });
      await Share.share({
        url: uri,
        title: `Receipt_${payment.receipt_number}.pdf`,
      });
    } catch (err: any) {
      Alert.alert('Download/PDF Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Official Receipt Card */}
      <View style={[styles.receiptCard, isVoided && styles.receiptCardVoided]}>
        {/* Brand Banner */}
        <View style={styles.brandHeader}>
          <View style={styles.brandBadge}>
            <Shield size={20} color="#4f46e5" />
            <Text style={styles.brandText}>WEBRAJYA</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isVoided ? styles.statusBadgeVoided : styles.statusBadgeSuccess,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isVoided ? styles.statusTextVoided : styles.statusTextSuccess,
              ]}
            >
              {payment.status}
            </Text>
          </View>
        </View>

        <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>
        <Text style={styles.receiptNumber}>#{payment.receipt_number}</Text>

        {/* Big Amount */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total Amount Paid</Text>
          <Text style={[styles.amountValue, isVoided && styles.amountVoided]}>
            {formatCurrency(payment.amount)}
          </Text>
        </View>

        {/* Breakdown Items */}
        <View style={styles.breakdown}>
          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Client</Text>
            <Text style={styles.itemValue}>{payment.client?.business_name}</Text>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Product & Plan</Text>
            <Text style={styles.itemValue}>
              {payment.subscription?.product?.name || 'SaaS'} •{' '}
              {payment.subscription?.plan?.name || 'Plan'}
            </Text>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Payment Date</Text>
            <Text style={styles.itemValue}>{formatDateDisplay(payment.payment_date)}</Text>
          </View>

          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Payment Method</Text>
            <Text style={styles.itemValue}>{payment.payment_method}</Text>
          </View>

          {payment.transaction_reference ? (
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Transaction Ref</Text>
              <Text style={styles.itemValue}>{payment.transaction_reference}</Text>
            </View>
          ) : null}

          {payment.subscription ? (
            <View style={styles.itemRow}>
              <Text style={styles.itemLabel}>Subscription Term</Text>
              <Text style={styles.itemValue}>
                {formatDateDisplay(payment.subscription.start_date)} →{' '}
                {formatDateDisplay(payment.subscription.end_date)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>
            This is an electronically generated official receipt issued via WebRajya Subscription
            Manager.
          </Text>
        </View>
      </View>

      {/* Action Buttons: Share, Print, Download */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleShare} activeOpacity={0.8}>
          <Share2 size={18} color="#ffffff" />
          <Text style={styles.actionBtnPrimaryText}>Share Receipt</Text>
        </TouchableOpacity>

        <View style={styles.actionBtnRow}>
          <TouchableOpacity style={styles.actionBtnSecondary} onPress={handlePrint} activeOpacity={0.8}>
            <Printer size={16} color="#4f46e5" />
            <Text style={styles.actionBtnSecondaryText}>Print</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={handleDownload}
            activeOpacity={0.8}
          >
            <Download size={16} color="#4f46e5" />
            <Text style={styles.actionBtnSecondaryText}>Download PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  receiptCardVoided: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffafb',
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4f46e5',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeSuccess: {
    backgroundColor: '#ecfdf5',
  },
  statusBadgeVoided: {
    backgroundColor: '#fef2f2',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextSuccess: {
    color: '#059669',
  },
  statusTextVoided: {
    color: '#dc2626',
  },
  receiptTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1,
  },
  receiptNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },
  amountBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginVertical: 18,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
    marginTop: 4,
  },
  amountVoided: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  breakdown: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  footerNote: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerNoteText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnSecondaryText: {
    color: '#4f46e5',
    fontSize: 13,
    fontWeight: '700',
  },
});
