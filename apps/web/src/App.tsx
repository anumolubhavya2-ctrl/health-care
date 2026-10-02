import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './layouts/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PageLoader } from './components/ui/Spinner';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Public pages
import { LandingPage } from './pages/LandingPage';
import { DoctorSearchPage } from './pages/patient/DoctorSearchPage';
import { DoctorDetailsPage } from './pages/patient/DoctorDetailsPage';
import { SymptomMatcherPage } from './pages/patient/SymptomMatcherPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Patient pages
import { DashboardPage } from './pages/patient/DashboardPage';
import { AppointmentsPage } from './pages/patient/AppointmentsPage';
import { AppointmentDetailPage } from './pages/patient/AppointmentDetailPage';
import { AppointmentConfirmPage } from './pages/patient/AppointmentConfirmPage';
import { BookingPage } from './pages/patient/BookingPage';
import { QueueTrackerPage } from './pages/patient/QueueTrackerPage';
import { RefundTrackerPage } from './pages/patient/RefundTrackerPage';
import { SupportChatPage } from './pages/patient/SupportChatPage';
import { NotificationsPage } from './pages/patient/NotificationsPage';
import { PaymentPage } from './pages/patient/PaymentPage';
import { ProfilePage } from './pages/patient/ProfilePage';

// Doctor pages
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* ============================================================ */}
        {/* Auth routes (no layout) */}
        {/* ============================================================ */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* ============================================================ */}
        {/* Public routes (main layout with nav) */}
        {/* ============================================================ */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/doctors" element={<DoctorSearchPage />} />
          <Route path="/doctors/:id" element={<DoctorDetailsPage />} />
          <Route path="/symptoms" element={<SymptomMatcherPage />} />
        </Route>

        {/* ============================================================ */}
        {/* Patient dashboard (sidebar layout) */}
        {/* ============================================================ */}
        <Route element={
          <ProtectedRoute roles={['PATIENT']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
          <Route path="/appointments/:id/confirm" element={<AppointmentConfirmPage />} />
          <Route path="/book/:id" element={<BookingPage />} />
          <Route path="/queue" element={<QueueTrackerPage />} />
          <Route path="/refunds" element={<RefundTrackerPage />} />
          <Route path="/support" element={<SupportChatPage />} />
          <Route path="/support/:ticketId" element={<SupportChatPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/payments" element={<PaymentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<ProfilePage />} />
        </Route>

        {/* ============================================================ */}
        {/* Doctor dashboard */}
        {/* ============================================================ */}
        <Route path="/doctor" element={
          <ProtectedRoute roles={['DOCTOR']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<DoctorDashboardPage />} />
        </Route>

        {/* ============================================================ */}
        {/* Admin dashboard */}
        {/* ============================================================ */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<AdminDashboardPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/home" element={<Navigate to="/" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
