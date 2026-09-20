import { ReminderType, SubscriptionStatus } from '../types';

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD into a local Date (at 00:00:00)
 */
export function parseDateISO(str: string): Date {
  if (!str) return new Date();
  const parts = str.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(str);
}

/**
 * Get current system date in YYYY-MM-DD format
 */
export function getTodayISO(): string {
  return formatDateISO(new Date());
}

/**
 * Add calendar months to a start date and subtract 1 day.
 * Formula: Start Date + Duration Months - 1 Day
 * Handles leap years, month-ends, and exact anniversary days.
 */
export function calculateSubscriptionEndDate(startDateStr: string, durationMonths: number): string {
  const startDate = parseDateISO(startDateStr);
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const startDay = startDate.getDate();

  const totalMonths = startMonth + durationMonths;
  const targetYear = startYear + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  const maxDaysInSourceMonth = new Date(startYear, startMonth + 1, 0).getDate();
  const maxDaysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const isMonthEndStart = startDay === maxDaysInSourceMonth;

  if (isMonthEndStart || startDay > maxDaysInTargetMonth) {
    const endOfMonthDate = new Date(targetYear, targetMonth, maxDaysInTargetMonth);
    return formatDateISO(endOfMonthDate);
  }

  const anniversaryDate = new Date(targetYear, targetMonth, startDay);
  const endDate = new Date(anniversaryDate);
  endDate.setDate(endDate.getDate() - 1);

  return formatDateISO(endDate);
}

/**
 * Calculate the next renewal start date:
 * If current subscription ends on `end_date`, new subscription begins on `end_date + 1 day`.
 */
export function calculateNextRenewalStartDate(currentEndDateStr: string): string {
  const endDate = parseDateISO(currentEndDateStr);
  const nextStart = new Date(endDate);
  nextStart.setDate(nextStart.getDate() + 1);
  return formatDateISO(nextStart);
}

/**
 * Dynamically derive subscription status based on date criteria:
 * end_date < today -> EXPIRED
 * end_date >= today && end_date <= today + 30 days -> EXPIRING_SOON
 * otherwise -> ACTIVE
 */
export function deriveSubscriptionStatus(
  startDateStr: string,
  endDateStr: string,
  currentStatus?: SubscriptionStatus
): SubscriptionStatus {
  if (currentStatus === 'CANCELLED') {
    return 'CANCELLED';
  }

  const todayStr = getTodayISO();
  if (endDateStr < todayStr) {
    return 'EXPIRED';
  }

  const today = parseDateISO(todayStr);
  const in30Days = new Date(today);
  in30Days.setDate(in30Days.getDate() + 30);
  const in30DaysStr = formatDateISO(in30Days);

  if (endDateStr <= in30DaysStr) {
    return 'EXPIRING_SOON';
  }

  return 'ACTIVE';
}

/**
 * Calculate remaining days until end date.
 * Negative if already expired.
 */
export function calculateDaysRemaining(endDateStr: string): number {
  const today = parseDateISO(getTodayISO());
  const endDate = parseDateISO(endDateStr);
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export const getDaysRemaining = calculateDaysRemaining;

/**
 * Format date for display: "19 Sep 2026"
 */
export function formatDateDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = parseDateISO(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format datetime for timeline: "19 Sep 2026, 02:30 PM"
 */
export function formatDateTimeDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hours}:${minutes} ${ampm}`;
}

/**
 * Format Indian Currency: ₹15,000
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const rounded = Math.round(amount);
  const parts = rounded.toString().split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `₹${formatted}`;
}

/**
 * Calculate reminder dates for a subscription
 */
export const REMINDER_OFFSETS: { type: ReminderType; daysBefore: number; label: string }[] = [
  { type: '90_DAYS', daysBefore: 90, label: '90 Days Before Expiry' },
  { type: '60_DAYS', daysBefore: 60, label: '60 Days Before Expiry' },
  { type: '30_DAYS', daysBefore: 30, label: '30 Days Before Expiry' },
  { type: '15_DAYS', daysBefore: 15, label: '15 Days Before Expiry' },
  { type: '7_DAYS', daysBefore: 7, label: '7 Days Before Expiry' },
  { type: '3_DAYS', daysBefore: 3, label: '3 Days Before Expiry' },
  { type: '1_DAY', daysBefore: 1, label: '1 Day Before Expiry' },
  { type: 'EXPIRY_DAY', daysBefore: 0, label: 'On Expiry Day' },
];

export function calculateReminderDate(endDateStr: string, daysBefore: number): string {
  const endDate = parseDateISO(endDateStr);
  const reminderDate = new Date(endDate);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);
  return formatDateISO(reminderDate);
}
