import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Client,
  Product,
  Plan,
  Subscription,
  Payment,
  Reminder,
  ClientNote,
  SubscriptionEvent,
  BusinessSettings,
  PaymentMethod,
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  calculateSubscriptionEndDate,
  calculateNextRenewalStartDate,
  deriveSubscriptionStatus,
  calculateDaysRemaining,
  formatCurrency,
  getTodayISO,
} from '../lib/dateUtils';
import { useAuth } from './AuthContext';

// Default seed products & plans matching backend
const DEFAULT_PRODUCTS: Product[] = [
  { id: 'b1000000-0000-0000-0000-000000000001', name: 'WebRajya POS', description: 'Comprehensive cloud point-of-sale for retail and restaurants', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'b1000000-0000-0000-0000-000000000002', name: 'WebRajya Invoice', description: 'GST invoicing, billing, and accounting suite for businesses', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'b1000000-0000-0000-0000-000000000003', name: 'WebRajya Digital Menu', description: 'Contactless QR digital ordering & interactive menu system', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'b1000000-0000-0000-0000-000000000004', name: 'Custom Software', description: 'Bespoke internal web/mobile enterprise solutions', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'b1000000-0000-0000-0000-000000000005', name: 'Website', description: 'High-performance modern business web presence and portal', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'b1000000-0000-0000-0000-000000000006', name: 'Other', description: 'Maintenance, custom integration & add-on services', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const DEFAULT_PLANS: Plan[] = [
  { id: 'c1000000-0000-0000-0000-000000000001', product_id: 'b1000000-0000-0000-0000-000000000001', name: '1 Year License', duration_months: 12, price: 5000, description: 'Single counter full POS access with cloud sync', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000002', product_id: 'b1000000-0000-0000-0000-000000000001', name: '2 Year License', duration_months: 24, price: 10000, description: 'Two-year multi-device license with priority support', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000003', product_id: 'b1000000-0000-0000-0000-000000000001', name: '3 Year Enterprise', duration_months: 36, price: 15000, description: '3-year enterprise license with complimentary updates', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000004', product_id: 'b1000000-0000-0000-0000-000000000002', name: '1 Year Standard', duration_months: 12, price: 6000, description: 'Unlimited e-invoicing & GST returns filing', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000005', product_id: 'b1000000-0000-0000-0000-000000000002', name: '3 Year Pro', duration_months: 36, price: 12000, description: 'Complete multi-user invoicing & customer ledger', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000006', product_id: 'b1000000-0000-0000-0000-000000000003', name: '1 Year QR Menu', duration_months: 12, price: 3500, description: 'Dynamic QR menu with instant pricing updates', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000007', product_id: 'b1000000-0000-0000-0000-000000000005', name: 'Annual Hosting & Maintenance', duration_months: 12, price: 8000, description: 'Domain renewal, SSL, hosting, and quarterly changes', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const DEFAULT_SETTINGS: BusinessSettings = {
  business_name: 'WebRajya Solutions',
  email: 'contact@webrajya.com',
  phone: '+91 98765 43210',
  address: 'Plot 42, Silicon Square, Software Park, Pune, MH 411057',
  gstin: '27AAAAA0000A1Z5',
  logo_url: null,
  currency_symbol: '₹',
  currency: 'INR',
  receipt_prefix: 'WR-PAY',
  enabled_reminder_intervals: ['30_DAYS', '15_DAYS', '7_DAYS', '3_DAYS', '1_DAY', 'EXPIRY_DAY'],
};

const CACHE_KEYS = {
  CLIENTS: '@webrajya:clients',
  PRODUCTS: '@webrajya:products',
  PLANS: '@webrajya:plans',
  SUBSCRIPTIONS: '@webrajya:subscriptions',
  PAYMENTS: '@webrajya:payments',
  REMINDERS: '@webrajya:reminders',
  EVENTS: '@webrajya:events',
  SETTINGS: '@webrajya:settings',
};

interface DataContextType {
  clients: Client[];
  products: Product[];
  plans: Plan[];
  subscriptions: Subscription[];
  payments: Payment[];
  reminders: Reminder[];
  events: SubscriptionEvent[];
  settings: BusinessSettings;
  isLoading: boolean;
  isRefreshing: boolean;
  isOnline: boolean;
  error: string | null;

  // Refresh
  refreshData: () => Promise<void>;

  // Getters
  getClientById: (id: string) => Client | undefined;
  getSubscriptionById: (id: string) => Subscription | undefined;
  getPaymentById: (id: string) => Payment | undefined;

  // Financial Mutations
  recordPayment: (payment: {
    client_id: string;
    subscription_id: string | null;
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    transaction_reference?: string;
    notes?: string;
  }) => Promise<Payment>;

  voidPayment: (paymentId: string, reason: string) => Promise<void>;

  createClient: (clientData: {
    business_name: string;
    owner_name?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    gstin?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    notes?: string;
  }) => Promise<Client>;

  updateClient: (id: string, clientData: Partial<Client>) => Promise<Client>;

  createSubscription: (subData: {
    client_id: string;
    product_id: string;
    plan_id: string | null;
    amount: number;
    start_date: string;
    duration_months: number;
    notes?: string;
    initial_payment_amount?: number;
    payment_method?: PaymentMethod;
    transaction_reference?: string;
  }) => Promise<{ subscription: Subscription; payment?: Payment }>;

  renewSubscription: (
    subscriptionId: string,
    planId: string,
    paymentDetails?: {
      amount: number;
      payment_method: PaymentMethod;
      transaction_reference?: string;
      notes?: string;
    }
  ) => Promise<{ newSubscription: Subscription; payment?: Payment }>;

  sendReminder: (
    subscriptionId: string,
    channel: 'WHATSAPP' | 'EMAIL',
    actionStatus?: 'OPENED' | 'SENT'
  ) => Promise<void>;

  addClientNote: (clientId: string, noteText: string) => Promise<ClientNote>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();

  const [rawClients, setRawClients] = useState<Client[]>([]);
  const [rawProducts, setRawProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [rawPlans, setRawPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [rawSubscriptions, setRawSubscriptions] = useState<Subscription[]>([]);
  const [rawPayments, setRawPayments] = useState<Payment[]>([]);
  const [rawReminders, setRawReminders] = useState<Reminder[]>([]);
  const [rawEvents, setRawEvents] = useState<SubscriptionEvent[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cached data from AsyncStorage on initial boot
  const loadCachedData = async () => {
    try {
      const [cachedClients, cachedSubs, cachedPayments, cachedReminders, cachedEvents] = await Promise.all([
        AsyncStorage.getItem(CACHE_KEYS.CLIENTS),
        AsyncStorage.getItem(CACHE_KEYS.SUBSCRIPTIONS),
        AsyncStorage.getItem(CACHE_KEYS.PAYMENTS),
        AsyncStorage.getItem(CACHE_KEYS.REMINDERS),
        AsyncStorage.getItem(CACHE_KEYS.EVENTS),
      ]);

      if (cachedClients) setRawClients(JSON.parse(cachedClients));
      if (cachedSubs) setRawSubscriptions(JSON.parse(cachedSubs));
      if (cachedPayments) setRawPayments(JSON.parse(cachedPayments));
      if (cachedReminders) setRawReminders(JSON.parse(cachedReminders));
      if (cachedEvents) setRawEvents(JSON.parse(cachedEvents));
    } catch (err) {
      console.log('Error reading cached mobile data:', err);
    }
  };

  // Fetch live records from Supabase
  const fetchLiveData = useCallback(async () => {
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        setIsOnline(false);
        return;
      }

      // Query products & plans
      const [pRes, plRes, cRes, sRes, payRes, rRes, eRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('plans').select('*').order('duration_months'),
        supabase.from('clients').select('*').order('business_name'),
        supabase.from('subscriptions').select('*').order('end_date', { ascending: true }),
        supabase.from('payments').select('*').order('payment_date', { ascending: false }),
        supabase.from('reminders').select('*').order('reminder_date', { ascending: true }),
        supabase.from('subscription_events').select('*').order('created_at', { ascending: false }).limit(200),
      ]);

      if (pRes.data && pRes.data.length > 0) {
        setRawProducts(pRes.data);
      }
      if (plRes.data && plRes.data.length > 0) {
        setRawPlans(plRes.data);
      }

      if (cRes.data) {
        setRawClients(cRes.data);
        AsyncStorage.setItem(CACHE_KEYS.CLIENTS, JSON.stringify(cRes.data)).catch(() => {});
      }
      if (sRes.data) {
        setRawSubscriptions(sRes.data);
        AsyncStorage.setItem(CACHE_KEYS.SUBSCRIPTIONS, JSON.stringify(sRes.data)).catch(() => {});
      }
      if (payRes.data) {
        setRawPayments(payRes.data);
        AsyncStorage.setItem(CACHE_KEYS.PAYMENTS, JSON.stringify(payRes.data)).catch(() => {});
      }
      if (rRes.data) {
        setRawReminders(rRes.data);
        AsyncStorage.setItem(CACHE_KEYS.REMINDERS, JSON.stringify(rRes.data)).catch(() => {});
      }
      if (eRes.data) {
        setRawEvents(eRes.data);
        AsyncStorage.setItem(CACHE_KEYS.EVENTS, JSON.stringify(eRes.data)).catch(() => {});
      }

      setIsOnline(true);
    } catch (err: any) {
      console.log('Mobile Supabase sync notice:', err.message);
      setIsOnline(false);
      setError('Working in offline mode. Cached records are available for viewing.');
    }
  }, []);

  // Initial load
  useEffect(() => {
    let active = true;
    (async () => {
      await loadCachedData();
      if (active) {
        await fetchLiveData();
        setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchLiveData]);

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchLiveData();
    setIsRefreshing(false);
  };

  // Safe offline financial mutation check
  const assertOnlineForFinancialMutation = (operationName: string) => {
    if (!isOnline && isSupabaseConfigured) {
      throw new Error(
        `You're offline.\n${operationName} requires an active connection.\nPlease reconnect and try again.`
      );
    }
  };

  // Enriched subscriptions
  const subscriptions = useMemo(() => {
    return rawSubscriptions.map((sub) => {
      const client = rawClients.find((c) => c.id === sub.client_id);
      const product = rawProducts.find((p) => p.id === sub.product_id);
      const plan = rawPlans.find((pl) => pl.id === sub.plan_id);

      // Calculate total paid excluding VOIDED payments
      const subPayments = rawPayments.filter(
        (p) => p.subscription_id === sub.id && p.status !== 'VOIDED'
      );
      const total_paid = subPayments.reduce((acc, curr) => acc + curr.amount, 0);
      const outstanding_balance = Math.max(0, sub.amount - total_paid);
      const dynamicStatus = deriveSubscriptionStatus(sub.start_date, sub.end_date, sub.status);

      return {
        ...sub,
        status: dynamicStatus,
        client,
        product,
        plan,
        total_paid,
        outstanding_balance,
      };
    });
  }, [rawSubscriptions, rawClients, rawProducts, rawPlans, rawPayments]);

  // Enriched clients
  const clients = useMemo(() => {
    return rawClients.map((client) => {
      const clientSubs = subscriptions.filter((s) => s.client_id === client.id);
      const total_outstanding = clientSubs.reduce(
        (sum, s) => sum + (s.outstanding_balance || 0),
        0
      );
      return {
        ...client,
        subscriptions: clientSubs,
        total_outstanding,
      };
    });
  }, [rawClients, subscriptions]);

  // Enriched payments
  const payments = useMemo(() => {
    return rawPayments.map((payment) => {
      const client = rawClients.find((c) => c.id === payment.client_id);
      const subscription = subscriptions.find((s) => s.id === payment.subscription_id);
      return {
        ...payment,
        client,
        subscription,
      };
    });
  }, [rawPayments, rawClients, subscriptions]);

  // Enriched reminders
  const reminders = useMemo(() => {
    return rawReminders.map((r) => {
      const client = rawClients.find((c) => c.id === r.client_id);
      const subscription = subscriptions.find((s) => s.id === r.subscription_id);
      return {
        ...r,
        client,
        subscription,
      };
    });
  }, [rawReminders, rawClients, subscriptions]);

  // Getters
  const getClientById = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);
  const getSubscriptionById = useCallback((id: string) => subscriptions.find((s) => s.id === id), [subscriptions]);
  const getPaymentById = useCallback((id: string) => payments.find((p) => p.id === id), [payments]);

  // Generate sequential receipt number
  const generateReceiptNumber = () => {
    const count = rawPayments.length + 1;
    return `WR-PAY-${String(count).padStart(5, '0')}`;
  };

  // Record Payment
  const recordPayment = async (paymentData: {
    client_id: string;
    subscription_id: string | null;
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    transaction_reference?: string;
    notes?: string;
  }): Promise<Payment> => {
    assertOnlineForFinancialMutation('Payment recording');

    if (paymentData.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const receipt_number = generateReceiptNumber();
    const newPayment: Payment = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'p_' + Date.now(),
      client_id: paymentData.client_id,
      subscription_id: paymentData.subscription_id,
      amount: paymentData.amount,
      payment_date: paymentData.payment_date || getTodayISO(),
      payment_method: paymentData.payment_method,
      transaction_reference: paymentData.transaction_reference || null,
      receipt_number,
      status: 'COMPLETED',
      notes: paymentData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error: pErr } = await supabase.from('payments').insert([newPayment]).select().single();
      if (pErr) throw new Error(pErr.message);

      // Audit event
      await supabase.from('subscription_events').insert([
        {
          subscription_id: paymentData.subscription_id,
          client_id: paymentData.client_id,
          event_type: 'PAYMENT_RECEIVED',
          description: `Payment of ${formatCurrency(paymentData.amount)} received via ${paymentData.payment_method} (Receipt #${receipt_number})`,
        },
      ]);
    }

    setRawPayments((prev) => [newPayment, ...prev]);
    return newPayment;
  };

  // Void Payment
  const voidPayment = async (paymentId: string, reason: string) => {
    assertOnlineForFinancialMutation('Payment voiding');
    if (!reason.trim()) throw new Error('A reason is required to void a payment.');

    const payment = rawPayments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found.');

    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { error: vErr } = await supabase
        .from('payments')
        .update({
          status: 'VOIDED',
          voided_at: now,
          void_reason: reason.trim(),
          updated_at: now,
        })
        .eq('id', paymentId);

      if (vErr) throw new Error(vErr.message);

      await supabase.from('subscription_events').insert([
        {
          subscription_id: payment.subscription_id,
          client_id: payment.client_id,
          event_type: 'PAYMENT_VOIDED',
          description: `Receipt #${payment.receipt_number} (${formatCurrency(payment.amount)}) VOIDED: ${reason.trim()}`,
        },
      ]);
    }

    setRawPayments((prev) =>
      prev.map((p) =>
        p.id === paymentId ? { ...p, status: 'VOIDED', voided_at: now, void_reason: reason.trim() } : p
      )
    );
  };

  // Create Client
  const createClient = async (clientData: {
    business_name: string;
    owner_name?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    gstin?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    notes?: string;
  }): Promise<Client> => {
    assertOnlineForFinancialMutation('Client registration');

    const cleanName = clientData.business_name.trim();
    if (!cleanName) throw new Error('Business name is required.');

    const newClient: Client = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'c_' + Date.now(),
      business_name: cleanName,
      owner_name: clientData.owner_name?.trim() || null,
      phone: clientData.phone?.trim() || null,
      whatsapp: clientData.whatsapp?.trim() || clientData.phone?.trim() || null,
      email: clientData.email?.trim() || null,
      gstin: clientData.gstin?.trim() || null,
      address: clientData.address?.trim() || null,
      city: clientData.city?.trim() || null,
      state: clientData.state?.trim() || null,
      pincode: clientData.pincode?.trim() || null,
      status: 'ACTIVE',
      notes: clientData.notes?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { data, error: cErr } = await supabase.from('clients').insert([newClient]).select().single();
      if (cErr) throw new Error(cErr.message);

      await supabase.from('subscription_events').insert([
        {
          client_id: newClient.id,
          event_type: 'CLIENT_CREATED',
          description: `Client account created for ${cleanName}`,
        },
      ]);
    }

    setRawClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  // Update Client
  const updateClient = async (id: string, clientData: Partial<Client>): Promise<Client> => {
    assertOnlineForFinancialMutation('Client update');

    const now = new Date().toISOString();
    const updated = { ...clientData, updated_at: now };

    if (isSupabaseConfigured) {
      const { error: uErr } = await supabase.from('clients').update(updated).eq('id', id);
      if (uErr) throw new Error(uErr.message);

      await supabase.from('subscription_events').insert([
        {
          client_id: id,
          event_type: 'CLIENT_UPDATED',
          description: `Client profile updated`,
        },
      ]);
    }

    setRawClients((prev) => prev.map((c) => (c.id === id ? ({ ...c, ...updated } as Client) : c)));
    return { ...getClientById(id)!, ...updated } as Client;
  };

  // Create Subscription
  const createSubscription = async (subData: {
    client_id: string;
    product_id: string;
    plan_id: string | null;
    amount: number;
    start_date: string;
    duration_months: number;
    notes?: string;
    initial_payment_amount?: number;
    payment_method?: PaymentMethod;
    transaction_reference?: string;
  }): Promise<{ subscription: Subscription; payment?: Payment }> => {
    assertOnlineForFinancialMutation('Subscription activation');

    const end_date = calculateSubscriptionEndDate(subData.start_date, subData.duration_months);
    const newSub: Subscription = {
      id: crypto.randomUUID ? crypto.randomUUID() : 's_' + Date.now(),
      client_id: subData.client_id,
      product_id: subData.product_id,
      plan_id: subData.plan_id,
      amount: subData.amount,
      start_date: subData.start_date,
      end_date,
      status: 'ACTIVE',
      auto_renew: false,
      notes: subData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { error: sErr } = await supabase.from('subscriptions').insert([newSub]);
      if (sErr) throw new Error(sErr.message);

      await supabase.from('subscription_events').insert([
        {
          subscription_id: newSub.id,
          client_id: newSub.client_id,
          event_type: 'SUBSCRIPTION_CREATED',
          description: `Subscription activated from ${subData.start_date} to ${end_date}`,
        },
      ]);
    }

    setRawSubscriptions((prev) => [newSub, ...prev]);

    let recordedPayment: Payment | undefined = undefined;
    if (subData.initial_payment_amount && subData.initial_payment_amount > 0 && subData.payment_method) {
      recordedPayment = await recordPayment({
        client_id: subData.client_id,
        subscription_id: newSub.id,
        amount: subData.initial_payment_amount,
        payment_method: subData.payment_method,
        payment_date: subData.start_date,
        transaction_reference: subData.transaction_reference,
        notes: 'Initial activation settlement',
      });
    }

    return { subscription: newSub, payment: recordedPayment };
  };

  // Renew Subscription
  const renewSubscription = async (
    subscriptionId: string,
    planId: string,
    paymentDetails?: {
      amount: number;
      payment_method: PaymentMethod;
      transaction_reference?: string;
      notes?: string;
    }
  ): Promise<{ newSubscription: Subscription; payment?: Payment }> => {
    assertOnlineForFinancialMutation('Subscription renewal');

    const oldSub = subscriptions.find((s) => s.id === subscriptionId);
    if (!oldSub) throw new Error('Original subscription not found');

    const renewalPlan = rawPlans.find((p) => p.id === planId);
    if (!renewalPlan) throw new Error('Selected renewal plan not found');

    const nextStartDate = calculateNextRenewalStartDate(oldSub.end_date);
    const nextEndDate = calculateSubscriptionEndDate(nextStartDate, renewalPlan.duration_months);

    const renewedSub: Subscription = {
      id: crypto.randomUUID ? crypto.randomUUID() : 's_' + Date.now(),
      client_id: oldSub.client_id,
      product_id: oldSub.product_id,
      plan_id: planId,
      amount: renewalPlan.price,
      start_date: nextStartDate,
      end_date: nextEndDate,
      status: 'ACTIVE',
      auto_renew: false,
      notes: `Renewed from subscription ${oldSub.id.slice(0, 8)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      const { error: sErr } = await supabase.from('subscriptions').insert([renewedSub]);
      if (sErr) throw new Error(sErr.message);

      await supabase.from('subscription_events').insert([
        {
          subscription_id: renewedSub.id,
          client_id: renewedSub.client_id,
          event_type: 'SUBSCRIPTION_RENEWED',
          description: `Subscription renewed for ${renewalPlan.name} (${nextStartDate} to ${nextEndDate})`,
        },
      ]);
    }

    setRawSubscriptions((prev) => [renewedSub, ...prev]);

    let recordedPayment: Payment | undefined = undefined;
    if (paymentDetails && paymentDetails.amount > 0) {
      recordedPayment = await recordPayment({
        client_id: oldSub.client_id,
        subscription_id: renewedSub.id,
        amount: paymentDetails.amount,
        payment_method: paymentDetails.payment_method,
        payment_date: getTodayISO(),
        transaction_reference: paymentDetails.transaction_reference,
        notes: paymentDetails.notes || `Renewal settlement for ${renewalPlan.name}`,
      });
    }

    return { newSubscription: renewedSub, payment: recordedPayment };
  };

  // Send Reminder
  const sendReminder = async (
    subscriptionId: string,
    channel: 'WHATSAPP' | 'EMAIL',
    actionStatus: 'OPENED' | 'SENT' = 'OPENED'
  ) => {
    const sub = subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) return;

    const isConfirmedSent = actionStatus === 'SENT';
    const now = new Date().toISOString();

    const newEvent: SubscriptionEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'e_' + Date.now(),
      subscription_id: subscriptionId,
      client_id: sub.client_id,
      event_type: isConfirmedSent ? 'REMINDER_SENT' : 'REMINDER_OPENED',
      description: isConfirmedSent
        ? `Delivered ${channel} renewal reminder to ${sub.client?.business_name || 'Client'}`
        : `Opened ${channel} renewal message for ${sub.client?.business_name || 'Client'}`,
      created_at: now,
    };

    setRawEvents((prev) => [newEvent, ...prev]);

    if (isSupabaseConfigured) {
      await supabase.from('subscription_events').insert([newEvent]);
    }
  };

  // Add Client Note
  const addClientNote = async (clientId: string, noteText: string): Promise<ClientNote> => {
    const newNote: ClientNote = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'n_' + Date.now(),
      client_id: clientId,
      note: noteText.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: user?.email || 'Owner',
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('client_notes').insert([newNote]);
        await supabase.from('subscription_events').insert([
          {
            client_id: clientId,
            event_type: 'CLIENT_UPDATED',
            description: `Internal note added: "${noteText.trim().slice(0, 50)}..."`,
          },
        ]);
      } catch (err) {
        console.log('Error recording client note:', err);
      }
    }

    return newNote;
  };

  const value = useMemo(
    () => ({
      clients,
      products: rawProducts,
      plans: rawPlans,
      subscriptions,
      payments,
      reminders,
      events: rawEvents,
      settings,
      isLoading,
      isRefreshing,
      isOnline,
      error,
      refreshData,
      getClientById,
      getSubscriptionById,
      getPaymentById,
      recordPayment,
      voidPayment,
      createClient,
      updateClient,
      createSubscription,
      renewSubscription,
      sendReminder,
      addClientNote,
    }),
    [
      clients,
      rawProducts,
      rawPlans,
      subscriptions,
      payments,
      reminders,
      rawEvents,
      settings,
      isLoading,
      isRefreshing,
      isOnline,
      error,
      refreshData,
      getClientById,
      getSubscriptionById,
      getPaymentById,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
