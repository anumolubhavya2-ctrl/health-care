import type { DoctorStatus } from '../types';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: string | Date, fmt = 'dd MMM yyyy'): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return String(date);
  }
};

export const formatTime = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export const formatCurrency = (amount: number | string, currency = 'INR'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, minimumFractionDigits: 0 }).format(num);
};

export const formatRelativeTime = (date: string): string => {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true });
  } catch {
    return date;
  }
};

export const getDoctorStatusLabel = (status: DoctorStatus): string => {
  const labels: Record<DoctorStatus, string> = {
    AVAILABLE: 'Available',
    BUSY: 'Busy',
    DELAYED: 'Delayed',
    ON_LEAVE: 'On Leave',
    IN_CONSULTATION: 'In Consultation',
    OFFLINE: 'Offline',
  };
  return labels[status] ?? status;
};

export const getDoctorStatusClass = (status: DoctorStatus): string => {
  const classes: Record<DoctorStatus, string> = {
    AVAILABLE: 'badge-available',
    BUSY: 'badge-busy',
    DELAYED: 'badge-delayed',
    ON_LEAVE: 'badge-on-leave',
    IN_CONSULTATION: 'badge-in-consultation',
    OFFLINE: 'badge-offline',
  };
  return classes[status] ?? 'badge-offline';
};

export const getDoctorStatusDotClass = (status: DoctorStatus): string => {
  return `status-dot-${status.toLowerCase().replace('_', '-')}`;
};

export const getAppointmentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    CHECKED_IN: 'bg-teal-100 text-teal-700',
    IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-gray-100 text-gray-600',
    RESCHEDULED: 'bg-purple-100 text-purple-700',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-600';
};

export const getRefundStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    REQUESTED: 'bg-amber-100 text-amber-700',
    UNDER_REVIEW: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-teal-100 text-teal-700',
    PROCESSED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-600';
};

export const getPaymentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    PAID: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-blue-100 text-blue-700',
    PARTIALLY_REFUNDED: 'bg-indigo-100 text-indigo-700',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-600';
};

export const getDayName = (day: number): string => {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day] ?? '';
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
};

export const calculateAge = (dob: string): number => {
  const birth = parseISO(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export const truncate = (str: string, n: number): string =>
  str.length > n ? `${str.substring(0, n)}...` : str;
