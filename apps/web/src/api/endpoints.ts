import apiClient from './client';
import type {
  AuthResponse,
  User,
  Doctor,
  Patient,
  Appointment,
  Specialty,
  Queue,
  QueueEntry,
  Payment,
  Refund,
  SupportTicket,
  SupportMessage,
  Notification,
  DoctorAvailabilityResponse,
  SymptomMatchResult,
  AdminStats,
  ApiResponse,
} from '../types';

// ============================================================
// AUTH
// ============================================================
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; role?: string; phone?: string }) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }),

  getMe: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put('/auth/change-password', data),
};

// ============================================================
// DOCTORS
// ============================================================
export const doctorApi = {
  search: (params: Record<string, string | number | undefined>) =>
    apiClient.get<ApiResponse<Doctor[]>>('/doctors', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}`),

  getAvailability: (id: string, date: string) =>
    apiClient.get<ApiResponse<DoctorAvailabilityResponse>>(`/doctors/${id}/availability`, { params: { date } }),

  getMyProfile: () =>
    apiClient.get<ApiResponse<Doctor>>('/doctors/me/profile'),

  updateMyProfile: (data: Partial<Doctor>) =>
    apiClient.put<ApiResponse<Doctor>>('/doctors/me/profile', data),

  updateStatus: (data: { status: string; statusMessage?: string; delayMinutes?: number }) =>
    apiClient.patch<ApiResponse<Doctor>>('/doctors/me/status', data),

  setAvailability: (slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; slotDuration?: number; isActive?: boolean }>) =>
    apiClient.post('/doctors/me/availability', slots),

  getTodayAppointments: () =>
    apiClient.get<ApiResponse<Appointment[]>>('/doctors/me/appointments/today'),
};

// ============================================================
// PATIENTS
// ============================================================
export const patientApi = {
  getMyProfile: () =>
    apiClient.get<ApiResponse<Patient>>('/patients/me'),

  updateMyProfile: (data: Partial<Patient>) =>
    apiClient.put<ApiResponse<Patient>>('/patients/me', data),

  getHistory: () =>
    apiClient.get<ApiResponse<Appointment[]>>('/patients/me/history'),
};

// ============================================================
// APPOINTMENTS
// ============================================================
export const appointmentApi = {
  book: (data: {
    doctorId: string;
    scheduledDate: string;
    scheduledTime: string;
    consultationType?: string;
    symptoms?: string;
    notes?: string;
  }) =>
    apiClient.post<ApiResponse<{ appointment: Appointment; tokenNumber: number; fee: number }>>('/appointments', data),

  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Appointment[]>>('/appointments', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`),

  cancel: (id: string, reason?: string) =>
    apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, { reason }),

  checkIn: (id: string) =>
    apiClient.patch<ApiResponse<null>>(`/appointments/${id}/checkin`),

  start: (id: string) =>
    apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/start`),

  complete: (id: string, data?: { doctorNotes?: string; diagnosis?: string; prescription?: string; followUpDate?: string }) =>
    apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/complete`, data),
};

// ============================================================
// SPECIALTIES
// ============================================================
export const specialtyApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Specialty[]>>('/specialties'),
};

// ============================================================
// SYMPTOMS
// ============================================================
export const symptomApi = {
  match: (symptoms: string) =>
    apiClient.post<ApiResponse<SymptomMatchResult>>('/symptoms/match', { symptoms }),

  getRules: () =>
    apiClient.get('/symptoms/rules'),
};

// ============================================================
// QUEUE
// ============================================================
export const queueApi = {
  getByDoctor: (doctorId: string) =>
    apiClient.get<ApiResponse<{ doctor: Partial<Doctor>; queue: Queue }>>(`/queue/${doctorId}`),

  getMyPosition: (appointmentId?: string) =>
    apiClient.get<ApiResponse<QueueEntry | QueueEntry[]>>('/queue/my/position', {
      params: appointmentId ? { appointmentId } : undefined,
    }),

  callNext: () =>
    apiClient.patch('/queue/next'),
};

// ============================================================
// PAYMENTS
// ============================================================
export const paymentApi = {
  getMyPayments: () =>
    apiClient.get<ApiResponse<Payment[]>>('/payments/my'),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Payment>>(`/payments/${id}`),

  pay: (appointmentId: string, method: string) =>
    apiClient.post<ApiResponse<Payment>>(`/payments/${appointmentId}/pay`, { method }),
};

// ============================================================
// REFUNDS
// ============================================================
export const refundApi = {
  getMyRefunds: () =>
    apiClient.get<ApiResponse<Refund[]>>('/refunds/my'),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Refund>>(`/refunds/${id}`),

  request: (data: { appointmentId: string; reason: string }) =>
    apiClient.post<ApiResponse<Refund>>('/refunds', data),
};

// ============================================================
// SUPPORT
// ============================================================
export const supportApi = {
  createTicket: (data: { subject: string; description: string; category?: string; priority?: string }) =>
    apiClient.post<ApiResponse<SupportTicket>>('/support/tickets', data),

  getMyTickets: () =>
    apiClient.get<ApiResponse<SupportTicket[]>>('/support/tickets/my'),

  getTicketById: (id: string) =>
    apiClient.get<ApiResponse<SupportTicket>>(`/support/tickets/${id}`),

  sendMessage: (ticketId: string, message: string) =>
    apiClient.post<ApiResponse<SupportMessage>>(`/support/tickets/${ticketId}/messages`, { message }),

  escalate: (ticketId: string) =>
    apiClient.patch(`/support/tickets/${ticketId}/escalate`),
};

// ============================================================
// NOTIFICATIONS
// ============================================================
export const notificationApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiClient.get<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>('/notifications', { params }),

  markRead: (ids?: string[]) =>
    apiClient.patch('/notifications/read', { ids }),
};

// ============================================================
// ADMIN
// ============================================================
export const adminApi = {
  getStats: () =>
    apiClient.get<ApiResponse<AdminStats>>('/admin/stats'),

  getDoctors: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Doctor[]>>('/admin/doctors', { params }),

  verifyDoctor: (id: string) =>
    apiClient.patch(`/admin/doctors/${id}/verify`),

  getPatients: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Patient[]>>('/admin/patients', { params }),

  getAppointments: (params?: Record<string, string | number>) =>
    apiClient.get<ApiResponse<Appointment[]>>('/admin/appointments', { params }),

  getRefunds: () =>
    apiClient.get<ApiResponse<Refund[]>>('/admin/refunds'),

  processRefund: (id: string, data: { status: string; notes?: string }) =>
    apiClient.patch(`/admin/refunds/${id}/process`, data),

  getTickets: (params?: { status?: string }) =>
    apiClient.get<ApiResponse<SupportTicket[]>>('/admin/support', { params }),
};
