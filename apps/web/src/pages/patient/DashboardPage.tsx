import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Activity, CreditCard, ArrowRight, Search, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentApi, notificationApi } from '../../api/endpoints';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';
import { formatDate, formatTime, getAppointmentStatusColor } from '../../utils/helpers';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const patient = user?.patient;

  const { data: apptData, isLoading } = useQuery({ queryKey: ['my-appointments'], queryFn: () => appointmentApi.getAll({ limit: 5 }) });
  const { data: notifData } = useQuery({ queryKey: ['notifications-recent'], queryFn: () => notificationApi.getAll({ limit: 5 }) });

  const appointments = apptData?.data?.data ?? [];
  const notifications = notifData?.data?.data?.notifications ?? [];
  const unreadCount = notifData?.data?.data?.unreadCount ?? 0;

  const upcoming = appointments.filter(a => ['CONFIRMED', 'CHECKED_IN', 'PENDING'].includes(a.status));
  const completed = appointments.filter(a => a.status === 'COMPLETED');

  const stats = [
    { label: 'Upcoming', value: upcoming.length, icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50', to: '/appointments' },
    { label: 'Completed', value: completed.length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', to: '/appointments' },
    { label: 'Unread', value: unreadCount, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', to: '/notifications' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            {patient?.firstName ?? 'there'} 👋
          </h1>
          <p className="text-gray-500 mt-0.5">Here's your healthcare overview</p>
        </div>
        <Link to="/doctors" className="btn-primary"><Plus size={16} />Book Appointment</Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link to="/appointments" className="text-sm text-primary-600 hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>

          {isLoading ? (
            <div className="card p-8 flex justify-center"><Spinner /></div>
          ) : upcoming.length === 0 ? (
            <div className="card p-8 text-center">
              <Calendar size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No upcoming appointments</p>
              <Link to="/doctors" className="btn-primary btn-sm mt-4 inline-flex"><Search size={14} />Find a Doctor</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((appt) => (
                <Link key={appt.id} to={`/appointments/${appt.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-all">
                  <Avatar firstName={appt.doctor.firstName} lastName={appt.doctor.lastName} image={appt.doctor.profileImage} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">Dr. {appt.doctor.firstName} {appt.doctor.lastName}</p>
                    <p className="text-xs text-gray-500">{appt.doctor.specialties?.[0]?.specialty?.name}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar size={11} />{formatDate(appt.scheduledDate)}</span>
                      <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11} />{formatTime(appt.scheduledTime)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`badge text-xs ${getAppointmentStatusColor(appt.status)}`}>{appt.status.replace('_', ' ')}</span>
                    {appt.tokenNumber && <p className="text-xs text-gray-500 mt-1">Token #{appt.tokenNumber}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: '/doctors', icon: Search, label: 'Find a Doctor' },
                { to: '/symptoms', icon: Activity, label: 'Symptom Checker' },
                { to: '/queue', icon: Clock, label: 'Track Queue' },
                { to: '/refunds', icon: CreditCard, label: 'My Refunds' },
              ].map(({ to, icon: Icon, label }) => (
                <Link key={to} to={to} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center group-hover:bg-primary-100">
                    <Icon size={15} className="text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <ArrowRight size={14} className="text-gray-400 ml-auto" />
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <Link to="/notifications" className="text-xs text-primary-600 hover:underline">View all</Link>
            </div>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">No notifications yet</p>
            ) : (
              <div className="space-y-2.5">
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className={`flex gap-3 p-2.5 rounded-xl ${n.isRead ? '' : 'bg-primary-50'}`}>
                    <div className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-primary-500'}`} />
                    <div>
                      <p className="text-xs font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
