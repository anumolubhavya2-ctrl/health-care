import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Heart, Home, Calendar, Search, Activity, CreditCard,
  RotateCcw, MessageCircle, Bell, User, Menu, X, LogOut,
  Stethoscope, Users, Shield, BarChart2, ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';

// ── Patient navigation ─────────────────────────────────────
const patientNav = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/appointments', icon: Calendar, label: 'My Appointments' },
  { to: '/doctors', icon: Search, label: 'Find Doctors' },
  { to: '/queue', icon: Activity, label: 'Live Queue' },
  { to: '/payments', icon: CreditCard, label: 'Payments' },
  { to: '/refunds', icon: RotateCcw, label: 'Refunds' },
  { to: '/support', icon: MessageCircle, label: 'Support' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
];

// ── Doctor navigation ──────────────────────────────────────
const doctorNav = [
  { to: '/doctor/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/doctor/appointments', icon: Calendar, label: "Today's Patients" },
  { to: '/doctor/queue', icon: Activity, label: 'Manage Queue' },
  { to: '/doctor/profile', icon: Stethoscope, label: 'My Profile' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

// ── Admin navigation ───────────────────────────────────────
const adminNav = [
  { to: '/admin/dashboard', icon: BarChart2, label: 'Dashboard' },
  { to: '/admin/doctors', icon: Stethoscope, label: 'Doctors' },
  { to: '/admin/patients', icon: Users, label: 'Patients' },
  { to: '/admin/appointments', icon: ClipboardList, label: 'Appointments' },
  { to: '/admin/refunds', icon: RotateCcw, label: 'Refunds' },
  { to: '/admin/support', icon: MessageCircle, label: 'Support Tickets' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

type NavItem = { to: string; icon: React.ComponentType<{ size?: number; className?: string }>; label: string };

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const profile = user?.patient ?? user?.doctor ?? user?.admin;
  const firstName = (profile as { firstName?: string })?.firstName ?? '';
  const lastName = (profile as { lastName?: string })?.lastName ?? '';

  // Pick nav items based on role
  const navItems: NavItem[] =
    user?.role === 'DOCTOR' ? doctorNav :
    user?.role === 'ADMIN'  ? adminNav  :
    patientNav;

  // Role badge colour
  const roleBadgeColor =
    user?.role === 'DOCTOR' ? 'bg-teal-100 text-teal-700' :
    user?.role === 'ADMIN'  ? 'bg-purple-100 text-purple-700' :
    'bg-primary-100 text-primary-700';

  const isActive = (path: string) => {
    // Exact match for root dashboard paths, prefix match for everything else
    const exactPaths = ['/dashboard', '/doctor/dashboard', '/admin/dashboard'];
    return exactPaths.includes(path)
      ? location.pathname === path
      : location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 h-screen z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Heart size={13} className="text-white fill-white" />
            </div>
            <span className="font-bold text-gray-900">CareSync</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Profile summary */}
        <div className="px-4 py-3 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Avatar firstName={firstName} lastName={lastName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{firstName} {lastName}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor}`}>
                {user?.role === 'DOCTOR' ? 'Doctor' : user?.role === 'ADMIN' ? 'Admin' : 'Patient'}
              </span>
            </div>
          </div>
        </div>

        {/* Role-specific navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(to) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={17} className={isActive(to) ? 'text-primary-600' : 'text-gray-400'} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-3 border-t border-gray-100">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={17} />Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Heart size={13} className="text-white fill-white" />
            </div>
            <span className="font-bold text-gray-900">CareSync</span>
          </Link>
          {/* Role indicator on mobile */}
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor}`}>
            {user?.role === 'DOCTOR' ? 'Doctor' : user?.role === 'ADMIN' ? 'Admin' : 'Patient'}
          </span>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
