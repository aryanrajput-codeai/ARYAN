export type ClientStatus = 'ACTIVE' | 'INACTIVE';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED';

export type PaymentMethod = 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'OTHER';

export type ReminderType =
  | '90_DAYS'
  | '60_DAYS'
  | '30_DAYS'
  | '15_DAYS'
  | '7_DAYS'
  | '3_DAYS'
  | '1_DAY'
  | 'EXPIRY_DAY';

export type ReminderStatus = 'PENDING' | 'READY' | 'OPENED' | 'SENT' | 'FAILED' | 'DISMISSED';

export type SubscriptionEventType =
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'SUBSCRIPTION_CREATED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_VOIDED'
  | 'REMINDER_CREATED'
  | 'REMINDER_OPENED'
  | 'REMINDER_SENT'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'PLAN_CHANGED'
  | 'STATUS_CHANGED';

export type UserRole = 'ADMIN' | 'STAFF';

export interface Client {
  id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Enriched/Joined fields
  subscriptions?: Subscription[];
  total_outstanding?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  plans?: Plan[];
}

export interface Plan {
  id: string;
  product_id: string;
  name: string;
  duration_months: number;
  price: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  client_id: string;
  product_id: string;
  plan_id: string | null;
  amount: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  status: SubscriptionStatus;
  auto_renew: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields for display
  client?: Client;
  product?: Product;
  plan?: Plan;
  total_paid?: number;
  outstanding_balance?: number;
}

export interface Payment {
  id: string;
  client_id: string;
  subscription_id: string | null;
  amount: number;
  payment_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  transaction_reference: string | null;
  receipt_number: string;
  status?: 'COMPLETED' | 'VOIDED';
  voided_at?: string | null;
  void_reason?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined fields
  client?: Client;
  subscription?: Subscription;
}

export interface Reminder {
  id: string;
  client_id: string | null;
  subscription_id: string | null;
  reminder_type: ReminderType;
  reminder_date: string; // YYYY-MM-DD
  status: ReminderStatus;
  message: string | null;
  sent_at: string | null;
  created_at: string;

  // Joined
  client?: Client;
  subscription?: Subscription;
}

export interface ClientNote {
  id: string;
  client_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  author?: string;
}

export interface SubscriptionEvent {
  id: string;
  subscription_id: string | null;
  client_id: string | null;
  event_type: SubscriptionEventType;
  description: string | null;
  created_at: string;
}

export type ActivityEvent = SubscriptionEvent;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface BusinessSettings {
  business_name: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
  logo_url: string | null;
  currency_symbol: string;
  currency?: string;
  receipt_prefix?: string;
  enabled_reminder_intervals: ReminderType[];
}
