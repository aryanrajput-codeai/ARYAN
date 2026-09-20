import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Client,
  Product,
  Plan,
  Subscription,
  Payment,
  Reminder,
  ClientNote,
  SubscriptionEvent,
  SubscriptionEventType,
  BusinessSettings,
  PaymentMethod,
} from '../types';
import { supabase, getSupabaseConfig } from '../lib/supabase';
import {
  calculateSubscriptionEndDate,
  calculateNextRenewalStartDate,
  deriveSubscriptionStatus,
  calculateDaysRemaining,
  calculateReminderDate,
  REMINDER_OFFSETS,
  getTodayISO,
} from '../lib/dateUtils';
import { useToast } from './ToastContext';

// Default initial seeds matching /supabase/seed.sql
const SEED_PRODUCTS: Product[] = [
  { id: 'b1000000-0000-0000-0000-000000000001', name: 'WebRajya POS', description: 'Comprehensive cloud point-of-sale for retail and restaurants', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'b1000000-0000-0000-0000-000000000002', name: 'WebRajya Invoice', description: 'GST invoicing, billing, and accounting suite for businesses', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'b1000000-0000-0000-0000-000000000003', name: 'WebRajya Digital Menu', description: 'Contactless QR digital ordering & interactive menu system', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'b1000000-0000-0000-0000-000000000004', name: 'Custom Software', description: 'Bespoke internal web/mobile enterprise solutions', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'b1000000-0000-0000-0000-000000000005', name: 'Website', description: 'High-performance modern business web presence and portal', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'b1000000-0000-0000-0000-000000000006', name: 'Other', description: 'Maintenance, custom integration & add-on services', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const SEED_PLANS: Plan[] = [
  { id: 'c1000000-0000-0000-0000-000000000001', product_id: 'b1000000-0000-0000-0000-000000000001', name: '1 Year License', duration_months: 12, price: 5000, description: 'Single counter full POS access with cloud sync', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000002', product_id: 'b1000000-0000-0000-0000-000000000001', name: '2 Year License', duration_months: 24, price: 10000, description: 'Two-year multi-device license with priority support', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000003', product_id: 'b1000000-0000-0000-0000-000000000001', name: '3 Year Enterprise', duration_months: 36, price: 15000, description: '3-year enterprise license with complimentary updates', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000004', product_id: 'b1000000-0000-0000-0000-000000000002', name: '1 Year Standard', duration_months: 12, price: 6000, description: 'Unlimited e-invoicing & GST returns filing', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000005', product_id: 'b1000000-0000-0000-0000-000000000002', name: '3 Year Pro', duration_months: 36, price: 12000, description: 'Complete multi-user invoicing & customer ledger', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000006', product_id: 'b1000000-0000-0000-0000-000000000003', name: '1 Year QR Menu', duration_months: 12, price: 3500, description: 'Dynamic QR menu with instant pricing updates', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'c1000000-0000-0000-0000-000000000007', product_id: 'b1000000-0000-0000-0000-000000000005', name: 'Annual Hosting & Maintenance', duration_months: 12, price: 8000, description: 'Domain renewal, SSL, hosting, and quarterly changes', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const SEED_CLIENTS: Client[] = [
  {
    id: 'd1000000-0000-0000-0000-000000000001',
    business_name: 'THE XINGS KITCHEN',
    owner_name: 'Rahul Sharma',
    phone: '+91 98220 11223',
    whatsapp: '+91 98220 11223',
    email: 'rahul@xingskitchen.in',
    address: 'Shop 14, High Street, Baner',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411045',
    gstin: '27AABCU9603R1ZM',
    status: 'ACTIVE',
    notes: 'Multi-cuisine restaurant using WebRajya POS on 2 terminals.',
    created_at: '2023-10-19T10:00:00Z',
    updated_at: '2026-09-15T14:20:00Z',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000002',
    business_name: 'Brew & Bites Cafe',
    owner_name: 'Priya Deshmukh',
    phone: '+91 94230 55667',
    whatsapp: '+91 94230 55667',
    email: 'priya@brewandbites.com',
    address: 'Lane 6, Koregaon Park',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    gstin: '27BAPPD1234F1Z8',
    status: 'ACTIVE',
    notes: 'Specialty coffee bar with POS + QR Menu.',
    created_at: '2026-01-15T11:00:00Z',
    updated_at: '2026-01-15T11:00:00Z',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000003',
    business_name: 'Apex Industrial Supplies',
    owner_name: 'Vikramaditya Patil',
    phone: '+91 99700 88990',
    whatsapp: '+91 99700 88990',
    email: 'v.patil@apexindustrial.co',
    address: 'Plot 42, MIDC Bhosari',
    city: 'Pimpri-Chinchwad',
    state: 'Maharashtra',
    pincode: '411026',
    gstin: '27AACCA5678B1ZQ',
    status: 'ACTIVE',
    notes: 'Wholesale manufacturing using WebRajya Invoice.',
    created_at: '2026-06-01T09:00:00Z',
    updated_at: '2026-06-01T09:00:00Z',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000004',
    business_name: 'Golden Harvest Supermart',
    owner_name: 'Anand Kulkarni',
    phone: '+91 98900 44332',
    whatsapp: '+91 98900 44332',
    email: 'anand@goldenharvest.in',
    address: 'Station Road, Kothrud',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411038',
    gstin: '27ABCFG7890C1ZW',
    status: 'ACTIVE',
    notes: 'Grocery retail store. 1 Year POS plan nearing expiry.',
    created_at: '2025-09-26T10:00:00Z',
    updated_at: '2026-09-10T11:00:00Z',
  },
  {
    id: 'd1000000-0000-0000-0000-000000000005',
    business_name: 'Royal Bakehouse & Cafe',
    owner_name: 'Farhan Merchant',
    phone: '+91 97650 33221',
    whatsapp: '+91 97650 33221',
    email: 'farhan@royalbakehouse.com',
    address: 'MG Road, Camp',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    gstin: null,
    status: 'INACTIVE',
    notes: 'Subscription expired 2 months ago; branch renovation in progress.',
    created_at: '2025-06-15T12:00:00Z',
    updated_at: '2026-06-15T12:00:00Z',
  },
];

const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'e1000000-0000-0000-0000-000000000001',
    client_id: 'd1000000-0000-0000-0000-000000000001',
    product_id: 'b1000000-0000-0000-0000-000000000001',
    plan_id: 'c1000000-0000-0000-0000-000000000003',
    amount: 15000,
    start_date: '2023-10-19',
    end_date: '2026-10-18',
    status: 'EXPIRING_SOON',
    auto_renew: false,
    notes: '3 Year Plan expiring in 29 days; contacted Rahul regarding renewal.',
    created_at: '2023-10-19T10:00:00Z',
    updated_at: '2026-09-15T14:20:00Z',
  },
  {
    id: 'e1000000-0000-0000-0000-000000000002',
    client_id: 'd1000000-0000-0000-0000-000000000002',
    product_id: 'b1000000-0000-0000-0000-000000000001',
    plan_id: 'c1000000-0000-0000-0000-000000000002',
    amount: 10000,
    start_date: '2026-01-15',
    end_date: '2028-01-14',
    status: 'ACTIVE',
    auto_renew: false,
    notes: '2 Year POS plan in good standing.',
    created_at: '2026-01-15T11:30:00Z',
    updated_at: '2026-01-15T11:30:00Z',
  },
  {
    id: 'e1000000-0000-0000-0000-000000000003',
    client_id: 'd1000000-0000-0000-0000-000000000002',
    product_id: 'b1000000-0000-0000-0000-000000000003',
    plan_id: 'c1000000-0000-0000-0000-000000000006',
    amount: 3500,
    start_date: '2026-03-01',
    end_date: '2027-02-28',
    status: 'ACTIVE',
    auto_renew: true,
    notes: 'Digital menu QR setup for 25 tables.',
    created_at: '2026-03-01T12:00:00Z',
    updated_at: '2026-03-01T12:00:00Z',
  },
  {
    id: 'e1000000-0000-0000-0000-000000000004',
    client_id: 'd1000000-0000-0000-0000-000000000003',
    product_id: 'b1000000-0000-0000-0000-000000000002',
    plan_id: 'c1000000-0000-0000-0000-000000000005',
    amount: 12000,
    start_date: '2026-06-01',
    end_date: '2029-05-31',
    status: 'ACTIVE',
    auto_renew: false,
    notes: '3 Year Pro Invoicing.',
    created_at: '2026-06-01T09:30:00Z',
    updated_at: '2026-06-01T09:30:00Z',
  },
  {
    id: 'e1000000-0000-0000-0000-000000000005',
    client_id: 'd1000000-0000-0000-0000-000000000004',
    product_id: 'b1000000-0000-0000-0000-000000000001',
    plan_id: 'c1000000-0000-0000-0000-000000000001',
    amount: 5000,
    start_date: '2025-09-26',
    end_date: '2026-09-25',
    status: 'EXPIRING_SOON',
    auto_renew: false,
    notes: 'Renewal proposal shared via WhatsApp.',
    created_at: '2025-09-26T10:15:00Z',
    updated_at: '2026-09-10T11:00:00Z',
  },
  {
    id: 'e1000000-0000-0000-0000-000000000006',
    client_id: 'd1000000-0000-0000-0000-000000000005',
    product_id: 'b1000000-0000-0000-0000-000000000001',
    plan_id: 'c1000000-0000-0000-0000-000000000001',
    amount: 5000,
    start_date: '2025-06-15',
    end_date: '2026-06-14',
    status: 'EXPIRED',
    auto_renew: false,
    notes: 'Payment pending, client promised renewal next month.',
    created_at: '2025-06-15T12:30:00Z',
    updated_at: '2026-06-15T12:30:00Z',
  },
];

const SEED_PAYMENTS: Payment[] = [
  {
    id: 'f1000000-0000-0000-0000-000000000001',
    client_id: 'd1000000-0000-0000-0000-000000000001',
    subscription_id: 'e1000000-0000-0000-0000-000000000001',
    amount: 15000,
    payment_date: '2023-10-19',
    payment_method: 'UPI',
    transaction_reference: 'UPI/329201948201/XINGS',
    receipt_number: 'WR-PAY-00001',
    notes: 'Initial 3-Year subscription payment in full.',
    created_at: '2023-10-19T10:15:00Z',
    updated_at: '2023-10-19T10:15:00Z',
  },
  {
    id: 'f1000000-0000-0000-0000-000000000002',
    client_id: 'd1000000-0000-0000-0000-000000000002',
    subscription_id: 'e1000000-0000-0000-0000-000000000002',
    amount: 10000,
    payment_date: '2026-01-15',
    payment_method: 'BANK_TRANSFER',
    transaction_reference: 'NEFT/HDFC0029104/BREW',
    receipt_number: 'WR-PAY-00002',
    notes: '2-Year POS license payment received.',
    created_at: '2026-01-15T12:00:00Z',
    updated_at: '2026-01-15T12:00:00Z',
  },
  {
    id: 'f1000000-0000-0000-0000-000000000003',
    client_id: 'd1000000-0000-0000-0000-000000000002',
    subscription_id: 'e1000000-0000-0000-0000-000000000003',
    amount: 3500,
    payment_date: '2026-03-01',
    payment_method: 'UPI',
    transaction_reference: 'UPI/606110294812/PRIYA',
    receipt_number: 'WR-PAY-00003',
    notes: 'Annual digital menu subscription.',
    created_at: '2026-03-01T12:30:00Z',
    updated_at: '2026-03-01T12:30:00Z',
  },
  {
    id: 'f1000000-0000-0000-0000-000000000004',
    client_id: 'd1000000-0000-0000-0000-000000000003',
    subscription_id: 'e1000000-0000-0000-0000-000000000004',
    amount: 12000,
    payment_date: '2026-06-01',
    payment_method: 'BANK_TRANSFER',
    transaction_reference: 'RTGS/ICIC9920194/APEX',
    receipt_number: 'WR-PAY-00004',
    notes: '3-Year Invoicing license payment.',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
  },
  {
    id: 'f1000000-0000-0000-0000-000000000005',
    client_id: 'd1000000-0000-0000-0000-000000000004',
    subscription_id: 'e1000000-0000-0000-0000-000000000005',
    amount: 3000,
    payment_date: '2025-09-26',
    payment_method: 'UPI',
    transaction_reference: 'UPI/526910283741/ANAND',
    receipt_number: 'WR-PAY-00005',
    notes: 'Partial payment of ₹3,000 received. Balance ₹2,000.',
    created_at: '2025-09-26T10:30:00Z',
    updated_at: '2025-09-26T10:30:00Z',
  },
];

const SEED_EVENTS: SubscriptionEvent[] = [
  {
    id: 'g1000000-0000-0000-0000-000000000001',
    subscription_id: 'e1000000-0000-0000-0000-000000000001',
    client_id: 'd1000000-0000-0000-0000-000000000001',
    event_type: 'SUBSCRIPTION_CREATED',
    description: 'WebRajya POS 3-Year Enterprise subscription created (₹15,000)',
    created_at: '2023-10-19T10:00:00Z',
  },
  {
    id: 'g1000000-0000-0000-0000-000000000002',
    subscription_id: 'e1000000-0000-0000-0000-000000000001',
    client_id: 'd1000000-0000-0000-0000-000000000001',
    event_type: 'PAYMENT_RECEIVED',
    description: 'Received payment ₹15,000 via UPI (WR-PAY-00001)',
    created_at: '2023-10-19T10:15:00Z',
  },
  {
    id: 'g1000000-0000-0000-0000-000000000003',
    subscription_id: 'e1000000-0000-0000-0000-000000000001',
    client_id: 'd1000000-0000-0000-0000-000000000001',
    event_type: 'REMINDER_SENT',
    description: '30-Day Renewal Reminder sent to Rahul Sharma (+91 98220 11223)',
    created_at: '2026-09-18T09:30:00Z',
  },
  {
    id: 'g1000000-0000-0000-0000-000000000004',
    subscription_id: 'e1000000-0000-0000-0000-000000000002',
    client_id: 'd1000000-0000-0000-0000-000000000002',
    event_type: 'SUBSCRIPTION_CREATED',
    description: 'WebRajya POS 2-Year subscription created (₹10,000)',
    created_at: '2026-01-15T11:30:00Z',
  },
  {
    id: 'g1000000-0000-0000-0000-000000000005',
    subscription_id: 'e1000000-0000-0000-0000-000000000002',
    client_id: 'd1000000-0000-0000-0000-000000000002',
    event_type: 'PAYMENT_RECEIVED',
    description: 'Received payment ₹10,000 via Bank Transfer (WR-PAY-00002)',
    created_at: '2026-01-15T12:00:00Z',
  },
];

const SEED_NOTES: ClientNote[] = [
  {
    id: 'h1000000-0000-0000-0000-000000000001',
    client_id: 'd1000000-0000-0000-0000-000000000001',
    note: 'Client requested kitchen printer integration upgrade alongside upcoming renewal.',
    created_at: '2026-09-15T14:20:00Z',
    updated_at: '2026-09-15T14:20:00Z',
    author: 'Rajendra Verma (Admin)',
  },
  {
    id: 'h1000000-0000-0000-0000-000000000002',
    client_id: 'd1000000-0000-0000-0000-000000000004',
    note: 'Followed up for balance payment of ₹2,000; Anand agreed to clear during renewal.',
    created_at: '2026-09-10T11:00:00Z',
    updated_at: '2026-09-10T11:00:00Z',
    author: 'Sneha Kulkarni (Staff)',
  },
];

const SEED_REMINDERS: Reminder[] = [
  {
    id: 'i1000000-0000-0000-0000-000000000001',
    client_id: 'd1000000-0000-0000-0000-000000000001',
    subscription_id: 'e1000000-0000-0000-0000-000000000001',
    reminder_type: '30_DAYS',
    reminder_date: '2026-09-18',
    status: 'SENT',
    message: 'Renewal reminder: WebRajya POS expires on 18 Oct 2026',
    sent_at: '2026-09-18T09:30:00Z',
    created_at: '2023-10-19T10:00:00Z',
  },
  {
    id: 'i1000000-0000-0000-0000-000000000002',
    client_id: 'd1000000-0000-0000-0000-000000000001',
    subscription_id: 'e1000000-0000-0000-0000-000000000001',
    reminder_type: '15_DAYS',
    reminder_date: '2026-10-03',
    status: 'PENDING',
    message: 'Renewal reminder: WebRajya POS expires on 18 Oct 2026',
    sent_at: null,
    created_at: '2023-10-19T10:00:00Z',
  },
  {
    id: 'i1000000-0000-0000-0000-000000000003',
    client_id: 'd1000000-0000-0000-0000-000000000001',
    subscription_id: 'e1000000-0000-0000-0000-000000000001',
    reminder_type: '7_DAYS',
    reminder_date: '2026-10-11',
    status: 'PENDING',
    message: 'Critical reminder: 7 days left for WebRajya POS license',
    sent_at: null,
    created_at: '2023-10-19T10:00:00Z',
  },
  {
    id: 'i1000000-0000-0000-0000-000000000004',
    client_id: 'd1000000-0000-0000-0000-000000000005',
    subscription_id: 'e1000000-0000-0000-0000-000000000005',
    reminder_type: '7_DAYS',
    reminder_date: '2026-09-18',
    status: 'SENT',
    message: 'Urgent renewal: Golden Harvest POS expires on 25 Sep 2026',
    sent_at: '2026-09-18T10:00:00Z',
    created_at: '2025-09-26T10:15:00Z',
  },
];

const DEFAULT_SETTINGS: BusinessSettings = {
  business_name: 'WebRajya Solutions',
  email: 'contact@webrajya.com',
  phone: '+91 98765 43210',
  address: 'Commercial Hub, Baner, Pune, Maharashtra 411045',
  gstin: '27AAAAA0000A1Z5',
  logo_url: null,
  currency_symbol: '₹',
  enabled_reminder_intervals: ['90_DAYS', '60_DAYS', '30_DAYS', '15_DAYS', '7_DAYS', '3_DAYS', '1_DAY', 'EXPIRY_DAY'],
};

interface AddSubscriptionParams {
  client_id: string;
  product_id: string;
  plan_id?: string;
  amount: number;
  start_date: string;
  notes?: string;
  auto_renew?: boolean;
  payment_option: 'PAID' | 'PARTIAL' | 'PENDING';
  paid_amount?: number;
  payment_method?: PaymentMethod;
  transaction_reference?: string;
}

interface RenewSubscriptionParams {
  subscription_id: string;
  plan_id?: string;
  start_date: string;
  duration_months: number;
  amount: number;
  notes?: string;
  payment_option: 'PAID' | 'PARTIAL' | 'PENDING';
  paid_amount?: number;
  payment_method?: PaymentMethod;
  transaction_reference?: string;
}

interface RecordPaymentParams {
  client_id: string;
  subscription_id?: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  notes?: string;
}

interface DataContextType {
  clients: Client[];
  products: Product[];
  plans: Plan[];
  subscriptions: Subscription[];
  payments: Payment[];
  reminders: Reminder[];
  events: SubscriptionEvent[];
  notes: ClientNote[];
  settings: BusinessSettings;
  isSupabaseLive: boolean;
  isLoading: boolean;

  // Actions
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  archiveClient: (id: string) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => (Client & { subscriptions?: Subscription[]; payments?: Payment[]; total_outstanding?: number }) | undefined;

  addProduct: (nameOrData: string | { name: string; description?: string | null; is_active?: boolean }, description?: string) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;

  addPlan: (plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>) => Promise<Plan>;
  updatePlan: (id: string, updates: Partial<Plan>) => Promise<void>;
  togglePlanStatus: (id: string) => Promise<void>;

  addSubscription: (params: AddSubscriptionParams) => Promise<Subscription>;
  renewSubscription: (params: RenewSubscriptionParams) => Promise<Subscription>;
  cancelSubscription: (id: string) => Promise<void>;
  sendReminder: (subscriptionId: string, channel?: 'WHATSAPP' | 'EMAIL' | 'SMS', actionStatus?: 'OPENED' | 'SENT') => Promise<void>;

  recordPayment: (params: RecordPaymentParams) => Promise<Payment>;
  voidPayment: (paymentId: string, reason: string) => Promise<void>;
  addClientNote: (client_id: string, note: string, author?: string) => Promise<ClientNote>;
  dismissReminder: (id: string) => Promise<void>;
  markReminderSent: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize state with local storage fallback or default seed
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('webrajya_clients');
    return saved ? JSON.parse(saved) : SEED_CLIENTS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('webrajya_products');
    return saved ? JSON.parse(saved) : SEED_PRODUCTS;
  });

  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('webrajya_plans');
    return saved ? JSON.parse(saved) : SEED_PLANS;
  });

  const [rawSubscriptions, setRawSubscriptions] = useState<Subscription[]>(() => {
    const saved = localStorage.getItem('webrajya_subscriptions');
    return saved ? JSON.parse(saved) : SEED_SUBSCRIPTIONS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('webrajya_payments');
    return saved ? JSON.parse(saved) : SEED_PAYMENTS;
  });

  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('webrajya_reminders');
    return saved ? JSON.parse(saved) : SEED_REMINDERS;
  });

  const [events, setEvents] = useState<SubscriptionEvent[]>(() => {
    const saved = localStorage.getItem('webrajya_events');
    return saved ? JSON.parse(saved) : SEED_EVENTS;
  });

  const [notes, setNotes] = useState<ClientNote[]>(() => {
    const saved = localStorage.getItem('webrajya_notes');
    return saved ? JSON.parse(saved) : SEED_NOTES;
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('webrajya_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('webrajya_clients', JSON.stringify(clients));
  }, [clients]);
  useEffect(() => {
    localStorage.setItem('webrajya_products', JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem('webrajya_plans', JSON.stringify(plans));
  }, [plans]);
  useEffect(() => {
    localStorage.setItem('webrajya_subscriptions', JSON.stringify(rawSubscriptions));
  }, [rawSubscriptions]);
  useEffect(() => {
    localStorage.setItem('webrajya_payments', JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    localStorage.setItem('webrajya_reminders', JSON.stringify(reminders));
  }, [reminders]);
  useEffect(() => {
    localStorage.setItem('webrajya_events', JSON.stringify(events));
  }, [events]);
  useEffect(() => {
    localStorage.setItem('webrajya_notes', JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem('webrajya_settings', JSON.stringify(settings));
  }, [settings]);

  // Load from Supabase if connected
  const refreshData = useCallback(async () => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      setIsSupabaseLive(false);
      return;
    }

    try {
      setIsLoading(true);
      const [
        { data: clientsData, error: errC },
        { data: productsData, error: errP },
        { data: plansData, error: errPl },
        { data: subsData, error: errS },
        { data: paymentsData, error: errPy },
        { data: remindersData },
        { data: eventsData },
        { data: notesData },
      ] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: true }),
        supabase.from('plans').select('*').order('duration_months', { ascending: true }),
        supabase.from('subscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('payment_date', { ascending: false }),
        supabase.from('reminders').select('*').order('reminder_date', { ascending: true }),
        supabase.from('subscription_events').select('*').order('created_at', { ascending: false }),
        supabase.from('client_notes').select('*').order('created_at', { ascending: false }),
      ]);

      if (!errC && clientsData && clientsData.length > 0) {
        setClients(clientsData);
        setIsSupabaseLive(true);
      }
      if (!errP && productsData && productsData.length > 0) setProducts(productsData);
      if (!errPl && plansData && plansData.length > 0) setPlans(plansData);
      if (!errS && subsData && subsData.length > 0) setRawSubscriptions(subsData);
      if (!errPy && paymentsData && paymentsData.length > 0) setPayments(paymentsData);
      if (remindersData && remindersData.length > 0) setReminders(remindersData);
      if (eventsData && eventsData.length > 0) setEvents(eventsData);
      if (notesData && notesData.length > 0) setNotes(notesData);
    } catch (err) {
      console.warn('Supabase data load error:', err);
      setIsSupabaseLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Generate automated receipt number (e.g. WR-PAY-00006)
  const generateReceiptNumber = useCallback(() => {
    const existingSeqNumbers = payments.map((p) => {
      const match = p.receipt_number.match(/WR-PAY-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxSeq = existingSeqNumbers.length > 0 ? Math.max(...existingSeqNumbers, 0) : 0;
    const nextSeq = maxSeq + 1;
    return `WR-PAY-${String(nextSeq).padStart(5, '0')}`;
  }, [payments]);

  // Derive enriched subscriptions with dynamic date-based status & financial balance
  const subscriptions = useMemo(() => {
    return rawSubscriptions.map((sub) => {
      const client = clients.find((c) => c.id === sub.client_id);
      const product = products.find((p) => p.id === sub.product_id);
      const plan = plans.find((pl) => pl.id === sub.plan_id);

      // Total paid for this subscription (excluding VOIDED payments)
      const subPayments = payments.filter((p) => p.subscription_id === sub.id && p.status !== 'VOIDED');
      const total_paid = subPayments.reduce((acc, p) => acc + Number(p.amount), 0);
      const outstanding_balance = Math.max(0, sub.amount - total_paid);

      // Strictly dynamic date-based status
      const derivedStatus = deriveSubscriptionStatus(sub.start_date, sub.end_date, sub.status);

      return {
        ...sub,
        status: derivedStatus,
        client,
        product,
        plan,
        total_paid,
        outstanding_balance,
      };
    });
  }, [rawSubscriptions, clients, products, plans, payments]);

  // Enrich payments with client & subscription
  const enrichedPayments = useMemo(() => {
    return payments.map((p) => {
      const client = clients.find((c) => c.id === p.client_id);
      const subscription = subscriptions.find((s) => s.id === p.subscription_id);
      return {
        ...p,
        client,
        subscription,
      };
    });
  }, [payments, clients, subscriptions]);

  // Enriched reminders
  const enrichedReminders = useMemo(() => {
    return reminders.map((r) => {
      const client = clients.find((c) => c.id === r.client_id);
      const subscription = subscriptions.find((s) => s.id === r.subscription_id);
      return {
        ...r,
        client,
        subscription,
      };
    });
  }, [reminders, clients, subscriptions]);

  // Enriched clients with their subscriptions and total outstanding balance
  const enrichedClients = useMemo(() => {
    return clients.map((c) => {
      const clientSubs = subscriptions.filter((s) => s.client_id === c.id);
      const totalOutstanding = clientSubs.reduce(
        (sum, s) => sum + (s.outstanding_balance || 0),
        0
      );
      return {
        ...c,
        subscriptions: clientSubs,
        total_outstanding: totalOutstanding,
      };
    });
  }, [clients, subscriptions]);

  // ==========================================
  // CLIENT ACTIONS
  // ==========================================
  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> => {
    // Unique phone and email checks
    if (clientData.phone) {
      const cleanPhone = clientData.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 8) {
        const existing = clients.find(
          (c) => c.phone && c.phone.replace(/\D/g, '') === cleanPhone
        );
        if (existing) {
          throw new Error(
            `A client with phone "${clientData.phone}" already exists (${existing.business_name}).`
          );
        }
      }
    }
    if (clientData.email) {
      const cleanEmail = clientData.email.trim().toLowerCase();
      if (cleanEmail) {
        const existing = clients.find(
          (c) => c.email && c.email.trim().toLowerCase() === cleanEmail
        );
        if (existing) {
          throw new Error(
            `A client with email "${clientData.email}" already exists (${existing.business_name}).`
          );
        }
      }
    }

    const newId = crypto.randomUUID ? crypto.randomUUID() : 'd' + Math.random().toString(36).substring(2, 14);
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      id: newId,
      created_at: now,
      updated_at: now,
    };

    setClients((prev) => [newClient, ...prev]);

    // Audit event for client creation
    const clientEvent: SubscriptionEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
      subscription_id: null,
      client_id: newId,
      event_type: 'CLIENT_CREATED',
      description: `Client profile registered: ${newClient.business_name}${newClient.owner_name ? ` (${newClient.owner_name})` : ''}`,
      created_at: now,
    };
    setEvents((prev) => [clientEvent, ...prev]);

    if (isSupabaseLive) {
      try {
        await supabase.from('clients').insert([newClient]);
        await supabase.from('subscription_events').insert([clientEvent]);
      } catch (err) {
        console.warn('Supabase insert client error:', err);
      }
    }

    addToast(`Client "${newClient.business_name}" added successfully`, 'success');
    return newClient;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    const now = new Date().toISOString();
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: now } : c))
    );

    const updateEvent: SubscriptionEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
      subscription_id: null,
      client_id: id,
      event_type: 'CLIENT_UPDATED',
      description: `Client profile details updated`,
      created_at: now,
    };
    setEvents((prev) => [updateEvent, ...prev]);

    if (isSupabaseLive) {
      try {
        await supabase.from('clients').update({ ...updates, updated_at: now }).eq('id', id);
        await supabase.from('subscription_events').insert([updateEvent]);
      } catch (err) {
        console.warn('Supabase update client error:', err);
      }
    }
    addToast('Client updated successfully', 'success');
  };

  const archiveClient = async (id: string) => {
    await updateClient(id, { status: 'INACTIVE' });
    addToast('Client marked as INACTIVE', 'info');
  };

  const deleteClient = async (id: string): Promise<void> => {
    const clientSubs = rawSubscriptions.filter((s) => s.client_id === id);
    const activeSubs = clientSubs.filter(
      (s) => s.status === 'ACTIVE' || s.status === 'EXPIRING_SOON'
    );
    if (activeSubs.length > 0) {
      throw new Error(
        `Cannot delete client with ${activeSubs.length} active or expiring subscription(s). Please cancel or expire them first.`
      );
    }

    setClients((prev) => prev.filter((c) => c.id !== id));
    setRawSubscriptions((prev) => prev.filter((s) => s.client_id !== id));
    setPayments((prev) => prev.filter((p) => p.client_id !== id));
    setReminders((prev) => prev.filter((r) => r.client_id !== id));
    setEvents((prev) => prev.filter((e) => e.client_id !== id));
    setNotes((prev) => prev.filter((n) => n.client_id !== id));

    if (isSupabaseLive) {
      try {
        await supabase.from('clients').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete client error:', err);
      }
    }
    addToast('Client deleted successfully', 'info');
  };

  // ==========================================
  // PRODUCT & PLAN ACTIONS
  // ==========================================
  const addProduct = async (
    nameOrData: string | { name: string; description?: string | null; is_active?: boolean },
    description?: string
  ): Promise<Product> => {
    const name = typeof nameOrData === 'string' ? nameOrData : nameOrData.name;
    const desc = typeof nameOrData === 'string' ? description : (nameOrData.description ?? undefined);
    const isActive = typeof nameOrData === 'string' ? true : (nameOrData.is_active ?? true);

    const newId = crypto.randomUUID ? crypto.randomUUID() : 'b' + Math.random().toString(36).substring(2, 14);
    const now = new Date().toISOString();
    const newProduct: Product = {
      id: newId,
      name,
      description: desc || null,
      is_active: isActive,
      created_at: now,
      updated_at: now,
    };

    setProducts((prev) => [...prev, newProduct]);

    if (isSupabaseLive) {
      try {
        await supabase.from('products').insert([newProduct]);
      } catch (err) {
        console.warn('Supabase insert product error:', err);
      }
    }
    addToast(`Product "${name}" created`, 'success');
    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: now } : p))
    );
    if (isSupabaseLive) {
      try {
        await supabase.from('products').update({ ...updates, updated_at: now }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update product error:', err);
      }
    }
    addToast('Product updated', 'success');
  };

  const toggleProductStatus = async (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      await updateProduct(id, { is_active: !product.is_active });
    }
  };

  const addPlan = async (planData: Omit<Plan, 'id' | 'created_at' | 'updated_at'>): Promise<Plan> => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : 'c' + Math.random().toString(36).substring(2, 14);
    const now = new Date().toISOString();
    const newPlan: Plan = {
      ...planData,
      id: newId,
      created_at: now,
      updated_at: now,
    };

    setPlans((prev) => [...prev, newPlan]);

    if (isSupabaseLive) {
      try {
        await supabase.from('plans').insert([newPlan]);
      } catch (err) {
        console.warn('Supabase insert plan error:', err);
      }
    }
    addToast(`Plan "${newPlan.name}" added`, 'success');
    return newPlan;
  };

  const updatePlan = async (id: string, updates: Partial<Plan>) => {
    const now = new Date().toISOString();
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: now } : p))
    );
    if (isSupabaseLive) {
      try {
        await supabase.from('plans').update({ ...updates, updated_at: now }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update plan error:', err);
      }
    }
    addToast('Plan updated', 'success');
  };

  const togglePlanStatus = async (id: string) => {
    const plan = plans.find((p) => p.id === id);
    if (plan) {
      await updatePlan(id, { is_active: !plan.is_active });
    }
  };

  // ==========================================
  // SUBSCRIPTION ACTIONS
  // ==========================================
  const addSubscription = async (params: AddSubscriptionParams): Promise<Subscription> => {
    const now = new Date().toISOString();
    const subId = crypto.randomUUID ? crypto.randomUUID() : 'e' + Math.random().toString(36).substring(2, 14);

    const plan = plans.find((p) => p.id === params.plan_id);
    const durationMonths = plan ? plan.duration_months : 12;

    // Strict consistent end date calculation
    const end_date = calculateSubscriptionEndDate(params.start_date, durationMonths);
    const status = deriveSubscriptionStatus(params.start_date, end_date);

    const newSub: Subscription = {
      id: subId,
      client_id: params.client_id,
      product_id: params.product_id,
      plan_id: params.plan_id || null,
      amount: params.amount,
      start_date: params.start_date,
      end_date,
      status,
      auto_renew: params.auto_renew || false,
      notes: params.notes || null,
      created_at: now,
      updated_at: now,
    };

    setRawSubscriptions((prev) => [newSub, ...prev]);

    // Create automated reminders for each enabled interval
    const newReminders: Reminder[] = REMINDER_OFFSETS.map((offset) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : 'i' + Math.random().toString(36).substring(2, 14),
      client_id: params.client_id,
      subscription_id: subId,
      reminder_type: offset.type,
      reminder_date: calculateReminderDate(end_date, offset.daysBefore),
      status: 'PENDING',
      message: `Renewal reminder: ${offset.label} for subscription ending on ${end_date}`,
      sent_at: null,
      created_at: now,
    }));
    setReminders((prev) => [...newReminders, ...prev]);

    // Timeline event for subscription creation
    const product = products.find((p) => p.id === params.product_id);
    const createEvent: SubscriptionEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
      subscription_id: subId,
      client_id: params.client_id,
      event_type: 'SUBSCRIPTION_CREATED',
      description: `${product?.name || 'Subscription'} created (${plan?.name || `${durationMonths} Mo`}) - ₹${params.amount.toLocaleString('en-IN')}`,
      created_at: now,
    };
    setEvents((prev) => [createEvent, ...prev]);

    let paymentRecord: Payment | null = null;
    let paymentEvent: SubscriptionEvent | null = null;

    // If paid or partial, create payment record
    if (params.payment_option !== 'PENDING' && (params.paid_amount || 0) > 0) {
      const receiptNumber = generateReceiptNumber();
      const paymentAmount = params.paid_amount || params.amount;
      const paymentMethod = params.payment_method || 'UPI';

      paymentRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'f' + Math.random().toString(36).substring(2, 14),
        client_id: params.client_id,
        subscription_id: subId,
        amount: paymentAmount,
        payment_date: getTodayISO(),
        payment_method: paymentMethod,
        transaction_reference: params.transaction_reference || null,
        receipt_number: receiptNumber,
        status: 'COMPLETED',
        notes: `Subscription initial payment (${params.payment_option === 'PARTIAL' ? 'Partial' : 'Full'}).`,
        created_at: now,
        updated_at: now,
      };

      setPayments((prev) => [paymentRecord!, ...prev]);

      paymentEvent = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
        subscription_id: subId,
        client_id: params.client_id,
        event_type: 'PAYMENT_RECEIVED',
        description: `Payment received: ₹${paymentAmount.toLocaleString('en-IN')} via ${paymentMethod} (${receiptNumber})`,
        created_at: now,
      };
      setEvents((prev) => [paymentEvent!, ...prev]);
    }

    if (isSupabaseLive) {
      try {
        await supabase.from('subscriptions').insert([newSub]);
        await supabase.from('subscription_events').insert([createEvent]);
        if (newReminders.length > 0) {
          await supabase.from('reminders').insert(newReminders);
        }
        if (paymentRecord && paymentEvent) {
          await supabase.from('payments').insert([paymentRecord]);
          await supabase.from('subscription_events').insert([paymentEvent]);
        }
      } catch (err) {
        console.warn('Supabase insert subscription error:', err);
      }
    }

    addToast('Subscription created successfully', 'success');
    return newSub;
  };

  const renewSubscription = async (params: RenewSubscriptionParams): Promise<Subscription> => {
    const existing = rawSubscriptions.find((s) => s.id === params.subscription_id);
    if (!existing) {
      throw new Error('Subscription not found for renewal');
    }

    // Boundary check: Renewal start date must be strictly after or on next cycle start (Current end date + 1 day)
    const nextAllowedStartDate = calculateNextRenewalStartDate(existing.end_date);
    if (params.start_date < nextAllowedStartDate) {
      throw new Error(
        `Renewal start date cannot overlap with the current cycle ending on ${existing.end_date}. Next cycle must begin on or after ${nextAllowedStartDate}.`
      );
    }

    // Prevent duplicate renewals for the same cycle
    const alreadyRenewed = rawSubscriptions.some(
      (s) =>
        s.client_id === existing.client_id &&
        s.product_id === existing.product_id &&
        s.id !== existing.id &&
        s.status !== 'CANCELLED' &&
        s.start_date >= nextAllowedStartDate
    );
    if (alreadyRenewed) {
      throw new Error('A renewal subscription for this client and product cycle already exists.');
    }

    const now = new Date().toISOString();
    const newSubId = crypto.randomUUID ? crypto.randomUUID() : 'e' + Math.random().toString(36).substring(2, 14);

    // Calculate non-overlapping renewal end date
    const endDate = calculateSubscriptionEndDate(params.start_date, params.duration_months);
    const status = deriveSubscriptionStatus(params.start_date, endDate);

    const renewedSub: Subscription = {
      id: newSubId,
      client_id: existing.client_id,
      product_id: existing.product_id,
      plan_id: params.plan_id || existing.plan_id,
      amount: params.amount,
      start_date: params.start_date,
      end_date: endDate,
      status,
      auto_renew: existing.auto_renew,
      notes: params.notes || `Renewed from prior cycle (${existing.start_date} to ${existing.end_date})`,
      created_at: now,
      updated_at: now,
    };

    setRawSubscriptions((prev) => [renewedSub, ...prev]);

    // Timeline event for renewal
    const product = products.find((p) => p.id === existing.product_id);
    const renewEvent: SubscriptionEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
      subscription_id: newSubId,
      client_id: existing.client_id,
      event_type: 'SUBSCRIPTION_RENEWED',
      description: `Renewed ${product?.name || 'Subscription'} for ${params.duration_months} months (${params.start_date} to ${endDate}) - ₹${params.amount.toLocaleString('en-IN')}`,
      created_at: now,
    };
    setEvents((prev) => [renewEvent, ...prev]);

    // Reminders for new cycle
    const newReminders: Reminder[] = REMINDER_OFFSETS.map((offset) => ({
      id: crypto.randomUUID ? crypto.randomUUID() : 'i' + Math.random().toString(36).substring(2, 14),
      client_id: existing.client_id,
      subscription_id: newSubId,
      reminder_type: offset.type,
      reminder_date: calculateReminderDate(endDate, offset.daysBefore),
      status: 'PENDING',
      message: `Renewal reminder: ${offset.label} for renewed cycle ending on ${endDate}`,
      sent_at: null,
      created_at: now,
    }));
    setReminders((prev) => [...newReminders, ...prev]);

    let renewalPaymentRecord: Payment | null = null;
    let renewalPaymentEvent: SubscriptionEvent | null = null;

    // Handle renewal payment
    if (params.payment_option !== 'PENDING' && (params.paid_amount || 0) > 0) {
      const receiptNumber = generateReceiptNumber();
      const paymentAmount = params.paid_amount || params.amount;
      const paymentMethod = params.payment_method || 'UPI';

      renewalPaymentRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'f' + Math.random().toString(36).substring(2, 14),
        client_id: existing.client_id,
        subscription_id: newSubId,
        amount: paymentAmount,
        payment_date: getTodayISO(),
        payment_method: paymentMethod,
        transaction_reference: params.transaction_reference || null,
        receipt_number: receiptNumber,
        status: 'COMPLETED',
        notes: `Renewal payment (${params.payment_option === 'PARTIAL' ? 'Partial' : 'Full'}).`,
        created_at: now,
        updated_at: now,
      };

      setPayments((prev) => [renewalPaymentRecord!, ...prev]);

      renewalPaymentEvent = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
        subscription_id: newSubId,
        client_id: existing.client_id,
        event_type: 'PAYMENT_RECEIVED',
        description: `Renewal payment received: ₹${paymentAmount.toLocaleString('en-IN')} via ${paymentMethod} (${receiptNumber})`,
        created_at: now,
      };
      setEvents((prev) => [renewalPaymentEvent!, ...prev]);
    }

    if (isSupabaseLive) {
      try {
        await supabase.from('subscriptions').insert([renewedSub]);
        await supabase.from('subscription_events').insert([renewEvent]);
        if (newReminders.length > 0) {
          await supabase.from('reminders').insert(newReminders);
        }
        if (renewalPaymentRecord && renewalPaymentEvent) {
          await supabase.from('payments').insert([renewalPaymentRecord]);
          await supabase.from('subscription_events').insert([renewalPaymentEvent]);
        }
      } catch (err) {
        console.warn('Supabase renew subscription error:', err);
      }
    }

    addToast('Subscription renewed successfully!', 'success');
    return renewedSub;
  };

  const cancelSubscription = async (id: string) => {
    const now = new Date().toISOString();
    setRawSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'CANCELLED', updated_at: now } : s))
    );

    const sub = rawSubscriptions.find((s) => s.id === id);
    if (sub) {
      const cancelEvent: SubscriptionEvent = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
        subscription_id: id,
        client_id: sub.client_id,
        event_type: 'STATUS_CHANGED',
        description: 'Subscription marked as CANCELLED',
        created_at: now,
      };
      setEvents((prev) => [cancelEvent, ...prev]);

      if (isSupabaseLive) {
        try {
          await supabase.from('subscriptions').update({ status: 'CANCELLED', updated_at: now }).eq('id', id);
          await supabase.from('subscription_events').insert([cancelEvent]);
        } catch (err) {
          console.warn('Supabase cancel subscription error:', err);
        }
      }
    }

    addToast('Subscription cancelled', 'info');
  };

  // ==========================================
  // PAYMENT ACTIONS
  // ==========================================
  const recordPayment = async (params: RecordPaymentParams): Promise<Payment> => {
    if (params.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    const now = new Date().toISOString();
    const paymentId = crypto.randomUUID ? crypto.randomUUID() : 'f' + Math.random().toString(36).substring(2, 14);
    const receiptNumber = generateReceiptNumber();

    const newPayment: Payment = {
      id: paymentId,
      client_id: params.client_id,
      subscription_id: params.subscription_id || null,
      amount: params.amount,
      payment_date: params.payment_date,
      payment_method: params.payment_method,
      transaction_reference: params.transaction_reference || null,
      receipt_number: receiptNumber,
      status: 'COMPLETED',
      notes: params.notes || null,
      created_at: now,
      updated_at: now,
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Timeline event
    const paymentEvent: SubscriptionEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
      subscription_id: params.subscription_id || null,
      client_id: params.client_id,
      event_type: 'PAYMENT_RECEIVED',
      description: `Payment of ₹${params.amount.toLocaleString('en-IN')} received via ${params.payment_method} (${receiptNumber})`,
      created_at: now,
    };
    setEvents((prev) => [paymentEvent, ...prev]);

    if (isSupabaseLive) {
      try {
        await supabase.from('payments').insert([newPayment]);
        await supabase.from('subscription_events').insert([paymentEvent]);
      } catch (err) {
        console.warn('Supabase record payment error:', err);
      }
    }

    addToast(`Payment of ₹${params.amount.toLocaleString('en-IN')} recorded (${receiptNumber})`, 'success');
    return newPayment;
  };

  const voidPayment = async (paymentId: string, reason: string): Promise<void> => {
    if (!reason || !reason.trim()) {
      throw new Error('A valid reason is required to void a payment.');
    }
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw new Error('Payment record not found.');
    }
    if (payment.status === 'VOIDED') {
      throw new Error('This payment is already voided.');
    }

    const now = new Date().toISOString();
    const updatedPayment: Payment = {
      ...payment,
      status: 'VOIDED',
      voided_at: now,
      void_reason: reason.trim(),
      updated_at: now,
    };

    setPayments((prev) => prev.map((p) => (p.id === paymentId ? updatedPayment : p)));

    // Timeline event for voiding
    const voidEvent: SubscriptionEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
      subscription_id: payment.subscription_id,
      client_id: payment.client_id,
      event_type: 'PAYMENT_VOIDED',
      description: `Payment ${payment.receipt_number} (₹${payment.amount.toLocaleString('en-IN')}) VOIDED. Reason: ${reason.trim()}`,
      created_at: now,
    };
    setEvents((prev) => [voidEvent, ...prev]);

    if (isSupabaseLive) {
      try {
        await supabase
          .from('payments')
          .update({
            status: 'VOIDED',
            voided_at: now,
            void_reason: reason.trim(),
            updated_at: now,
          })
          .eq('id', paymentId);
        await supabase.from('subscription_events').insert([voidEvent]);
      } catch (err) {
        console.warn('Supabase void payment error:', err);
      }
    }

    addToast(`Payment ${payment.receipt_number} has been voided`, 'info');
  };

  // ==========================================
  // NOTE & REMINDER ACTIONS
  // ==========================================
  const addClientNote = async (client_id: string, note: string, author?: string): Promise<ClientNote> => {
    const now = new Date().toISOString();
    const noteId = crypto.randomUUID ? crypto.randomUUID() : 'h' + Math.random().toString(36).substring(2, 14);

    const newNote: ClientNote = {
      id: noteId,
      client_id,
      note,
      created_at: now,
      updated_at: now,
      author: author || 'WebRajya Team',
    };

    setNotes((prev) => [newNote, ...prev]);

    if (isSupabaseLive) {
      try {
        await supabase.from('client_notes').insert([newNote]);
      } catch (err) {
        console.warn('Supabase note insert error:', err);
      }
    }
    addToast('Note added', 'success');
    return newNote;
  };

  const dismissReminder = async (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'DISMISSED' } : r))
    );
    if (isSupabaseLive) {
      try {
        await supabase.from('reminders').update({ status: 'DISMISSED' }).eq('id', id);
      } catch (err) {
        console.warn('Supabase dismiss reminder error:', err);
      }
    }
    addToast('Reminder dismissed', 'info');
  };

  const markReminderSent = async (id: string) => {
    const now = new Date().toISOString();
    const rem = reminders.find((r) => r.id === id);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'SENT', sent_at: now } : r))
    );

    if (rem && rem.client_id) {
      const event: SubscriptionEvent = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
        subscription_id: rem.subscription_id,
        client_id: rem.client_id,
        event_type: 'REMINDER_SENT',
        description: `Renewal reminder (${rem.reminder_type.replace('_', ' ')}) marked as sent`,
        created_at: now,
      };
      setEvents((prev) => [event, ...prev]);

      if (isSupabaseLive) {
        try {
          await supabase.from('reminders').update({ status: 'SENT', sent_at: now }).eq('id', id);
          await supabase.from('subscription_events').insert([event]);
        } catch (err) {
          console.warn('Supabase mark reminder sent error:', err);
        }
      }
    }

    addToast('Reminder marked as sent', 'success');
  };

  const sendReminder = async (
    subscriptionId: string,
    channel: 'WHATSAPP' | 'EMAIL' | 'SMS' = 'WHATSAPP',
    actionStatus: 'OPENED' | 'SENT' = 'OPENED'
  ) => {
    const sub = subscriptions.find((s) => s.id === subscriptionId);
    const now = new Date().toISOString();
    if (!sub) return;

    const isConfirmedSent = actionStatus === 'SENT';
    const eventType: SubscriptionEventType = isConfirmedSent ? 'REMINDER_SENT' : 'REMINDER_OPENED';
    const description = isConfirmedSent
      ? `Confirmed ${channel} renewal reminder delivered to ${sub.client?.business_name || 'Client'}`
      : `Opened ${channel} renewal reminder composer for ${sub.client?.business_name || 'Client'}`;

    const event: SubscriptionEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'g' + Math.random().toString(36).substring(2, 14),
      subscription_id: subscriptionId,
      client_id: sub.client_id,
      event_type: eventType,
      description,
      created_at: now,
    };
    setEvents((prev) => [event, ...prev]);

    setReminders((prev) =>
      prev.map((r) =>
        r.subscription_id === subscriptionId && (r.status === 'PENDING' || r.status === 'READY' || r.status === 'OPENED')
          ? { ...r, status: actionStatus, sent_at: isConfirmedSent ? now : r.sent_at }
          : r
      )
    );

    if (isSupabaseLive) {
      try {
        await supabase.from('subscription_events').insert([event]);
        await supabase
          .from('reminders')
          .update({ status: actionStatus, sent_at: isConfirmedSent ? now : null })
          .eq('subscription_id', subscriptionId)
          .eq('status', 'PENDING');
      } catch (err) {
        console.warn('Supabase reminder status update error:', err);
      }
    }

    addToast(
      isConfirmedSent
        ? `Reminder confirmed as delivered via ${channel}`
        : `${channel} composer opened for client`,
      'info'
    );
  };

  const getClientById = useCallback(
    (id: string) => {
      const client = enrichedClients.find((c) => c.id === id);
      if (!client) return undefined;
      const clientSubs = subscriptions.filter((s) => s.client_id === id);
      const clientPayments = enrichedPayments.filter((p) => p.client_id === id);
      const totalOutstanding = clientSubs.reduce(
        (sum, s) => sum + (s.outstanding_balance || 0),
        0
      );
      return {
        ...client,
        subscriptions: clientSubs,
        payments: clientPayments,
        total_outstanding: totalOutstanding,
      };
    },
    [enrichedClients, subscriptions, enrichedPayments]
  );

  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addToast('Business settings saved', 'success');
  };

  return (
    <DataContext.Provider
      value={{
        clients: enrichedClients,
        products,
        plans,
        subscriptions,
        payments: enrichedPayments,
        reminders: enrichedReminders,
        events,
        notes,
        settings,
        isSupabaseLive,
        isLoading,
        addClient,
        updateClient,
        archiveClient,
        deleteClient,
        getClientById,
        addProduct,
        updateProduct,
        toggleProductStatus,
        addPlan,
        updatePlan,
        togglePlanStatus,
        addSubscription,
        renewSubscription,
        cancelSubscription,
        sendReminder,
        recordPayment,
        voidPayment,
        addClientNote,
        dismissReminder,
        markReminderSent,
        updateSettings,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
