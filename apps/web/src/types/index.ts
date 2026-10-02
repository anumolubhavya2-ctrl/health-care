// ============================================================
// CareSync TypeScript Types
// ============================================================

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'SUPPORT_AGENT';

export type DoctorStatus =
  | 'AVAILABLE'
  | 'BUSY'
  | 'DELAYED'
  | 'ON_LEAVE'
  | 'IN_CONSULTATION'
  | 'OFFLINE';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'RESCHEDULED';

export type ConsultationType = 'IN_PERSON' | 'VIDEO' | 'PHONE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type RefundStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
export type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
export type SupportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'QUEUE_UPDATE'
  | 'DOCTOR_STATUS_CHANGE'
  | 'REFUND_UPDATE'
  | 'SUPPORT_MESSAGE'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'GENERAL';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  patient?: Patient;
  doctor?: Doctor;
  admin?: Admin;
}

export interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender: Gender;
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  pincode?: string;
  profileImage?: string;
  medicalHistory?: string;
  allergies: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  profileImage?: string;
  registrationNo?: string;
  bio?: string;
  experience: number;
  qualifications: string[];
  languages: string[];
  consultationFee: number;
  videoFee?: number;
  phoneFee?: number;
  status: DoctorStatus;
  statusMessage?: string;
  delayMinutes?: number;
  isAvailableForVideo: boolean;
  isAvailableForPhone: boolean;
  clinicName?: string;
  clinicAddress?: string;
  clinicCity?: string;
  clinicState?: string;
  rating: number;
  totalReviews: number;
  totalPatients: number;
  isVerified: boolean;
  specialties: DoctorSpecialty[];
  availabilities: Availability[];
  queue?: Queue;
  reviews?: Review[];
  createdAt: string;
}

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  _count?: { doctors: number };
}

export interface DoctorSpecialty {
  id: string;
  doctorId: string;
  specialtyId: string;
  isPrimary: boolean;
  specialty: Specialty;
}

export interface Availability {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  isActive: boolean;
}

export interface Admin {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  department?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledDate: string;
  scheduledTime: string;
  consultationType: ConsultationType;
  status: AppointmentStatus;
  tokenNumber?: number;
  queuePosition?: number;
  symptoms?: string;
  notes?: string;
  doctorNotes?: string;
  diagnosis?: string;
  prescription?: string;
  followUpDate?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  doctor: Doctor;
  patient: Patient;
  payment?: Payment;
  queueEntry?: QueueEntry;
  refund?: Refund;
}

export interface Queue {
  id: string;
  doctorId: string;
  date: string;
  currentToken: number;
  totalTokens: number;
  avgWaitMinutes: number;
  isActive: boolean;
  entries: QueueEntry[];
}

export interface QueueEntry {
  id: string;
  queueId: string;
  appointmentId: string;
  tokenNumber: number;
  position: number;
  estimatedTime?: string;
  checkedInAt?: string;
  calledAt?: string;
  completedAt?: string;
  isSkipped: boolean;
  createdAt: string;
  appointment?: Appointment;
  queue?: Queue & { doctor?: Partial<Doctor> };
}

export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  appointment?: Appointment;
  refund?: Refund;
}

export interface Refund {
  id: string;
  appointmentId: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  notes?: string;
  processedAt?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  appointment?: Partial<Appointment>;
  payment?: Partial<Payment>;
}

export interface SupportTicket {
  id: string;
  patientId: string;
  subject: string;
  description: string;
  category?: string;
  status: SupportStatus;
  priority: SupportPriority;
  assignedTo?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  messages: SupportMessage[];
  _count?: { messages: number };
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isInternal: boolean;
  readAt?: string;
  createdAt: string;
  sender?: { role: UserRole; patient?: Partial<Patient>; admin?: Partial<Admin> };
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  doctorId: string;
  patientId: string;
  rating: number;
  comment?: string;
  isPublic: boolean;
  createdAt: string;
  patient?: Partial<Patient>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DoctorAvailabilityResponse {
  available: boolean;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  slotDuration?: number;
  slots: TimeSlot[];
}

export interface SymptomMatchResult {
  matched: boolean;
  recommendation: {
    specialty: string;
    specialtySlug: string;
    reason: string;
    confidence: number;
  };
  doctors: Doctor[];
  disclaimer: string;
}

export interface AdminStats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  todayAppointments: number;
  pendingRefunds: number;
  openTickets: number;
  totalRevenue: number;
}
