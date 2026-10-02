import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, ChevronRight, Plus } from 'lucide-react';
import { appointmentApi } from '../../api/endpoints';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, formatTime, getAppointmentStatusColor } from '../../utils/helpers';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'CONFIRMED', label: 'Upcoming' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export const AppointmentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeStatus, setActiveStatus] = useState(searchParams.get('status') ?? '');

  const { data, isLoading } = useQuery({
    queryKey: ['my-appointments', activeStatus],
    queryFn: () => appointmentApi.getAll({ status: activeStatus || undefined, limit: 20 }),
  });

  const appointments = data?.data?.data ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <Link to="/doctors" className="btn-primary btn-sm"><Plus size={15} />New Appointment</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveStatus(tab.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeStatus === tab.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : appointments.length === 0 ? (
        <EmptyState icon={<Calendar size={48} />} title="No appointments found"
          description={activeStatus ? `You have no ${activeStatus.toLowerCase()} appointments.` : 'Book your first consultation.'}
          action={<Link to="/doctors" className="btn-primary">Find a Doctor</Link>} />
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Link key={appt.id} to={`/appointments/${appt.id}`}
              className="card p-5 flex items-center gap-4 hover:shadow-md transition-all group">
              <Avatar firstName={appt.doctor.firstName} lastName={appt.doctor.lastName} image={appt.doctor.profileImage} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">Dr. {appt.doctor.firstName} {appt.doctor.lastName}</p>
                <p className="text-sm text-gray-500">{appt.doctor.specialties?.[0]?.specialty?.name}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar size={11} />{formatDate(appt.scheduledDate)}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500"><Clock size={11} />{formatTime(appt.scheduledTime)}</span>
                  {appt.consultationType !== 'IN_PERSON' && (
                    <span className="text-xs text-teal-600">{appt.consultationType.replace('_', ' ')}</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                <span className={`badge text-xs ${getAppointmentStatusColor(appt.status)}`}>{appt.status.replace('_', ' ')}</span>
                {appt.tokenNumber && <span className="text-xs text-gray-500">Token #{appt.tokenNumber}</span>}
                {appt.payment && <span className="text-xs font-medium text-gray-700">₹{appt.payment.amount}</span>}
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
