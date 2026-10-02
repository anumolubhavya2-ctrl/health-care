import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Bell, Menu, X, ChevronDown, User, Calendar, LogOut, Settings, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../api/endpoints';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationApi.getAll({ limit: 1, unreadOnly: true }),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  const unreadCount = notifData?.data?.data?.unreadCount ?? 0;

  const profile = user?.patient ?? user?.doctor ?? user?.admin;
  const firstName = (profile as { firstName?: string })?.firstName ?? user?.email?.split('@')[0] ?? '';
  const lastName = (profile as { lastName?: string })?.lastName ?? '';

  const navLinks = [
    { to: '/doctors', label: 'Find Doctors' },
    { to: '/symptoms', label: 'Symptom Checker' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
              <Heart size={16} className="text-white fill-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">CareSync</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Avatar firstName={firstName} lastName={lastName} size="sm" />
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">{firstName}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-20 animate-slide-down">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">{firstName} {lastName}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                          <span className="mt-1 inline-block text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full capitalize">
                            {user?.role?.toLowerCase()}
                          </span>
                        </div>

                        {user?.role === 'PATIENT' && (
                          <>
                            <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <Calendar size={15} className="text-gray-400" />My Appointments
                            </Link>
                            <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <User size={15} className="text-gray-400" />Profile
                            </Link>
                          </>
                        )}
                        {user?.role === 'DOCTOR' && (
                          <Link to="/doctor/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <Calendar size={15} className="text-gray-400" />Dashboard
                          </Link>
                        )}
                        {user?.role === 'ADMIN' && (
                          <Link to="/admin/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <Shield size={15} className="text-gray-400" />Admin Panel
                          </Link>
                        )}
                        <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Settings size={15} className="text-gray-400" />Settings
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={() => { setProfileOpen(false); logout(); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} />Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary btn-sm hidden sm:flex">Sign In</Link>
                <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
              </div>
            )}

            <button className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white py-3 px-4 space-y-1">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              {l.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary btn-sm flex-1 text-center">Sign In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary btn-sm flex-1 text-center">Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
