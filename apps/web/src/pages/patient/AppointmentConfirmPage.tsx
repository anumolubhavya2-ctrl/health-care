import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Calendar, Clock, Hash, CreditCard, Activity } from 'lucide-react';
import { appointmentApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate, formatTime, formatCurrency } from '../../utils/helpers';

export const AppointmentConfirmPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentApi.getById(id!),
    enabled: !!id,
  });

  const appt = data?.data?.data;

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!appt) return <div className="page-container py-10 text-center text-gray-500">Appointment not found</div>;

  return (
    <div className="page-container py-16 max-w-2xl">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Appointment Confirmed!</h1>
        <p className="text-gray-500 mt-2">Your appointment has been successfully booked</p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Doctor info */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <Avatar firstName={appt.doctor.firstName} lastName={appt.doctor.lastName} image={appt.doctor.profileImage} size="lg" />
          <div>
            <p className="font-bold text-gray-900 text-lg">Dr. {appt.doctor.firstName} {appt.doctor.lastName}</p>
            <p className="text-primary-600">{appt.doctor.specialties?.[0]?.specialty?.name}</p>
            {appt.doctor.clinicName && <p className="text-gray-500 text-sm">{appt.doctor.clinicName}</p>}
          </div>
        </div>

        {/* Token */}
        {appt.tokenNumber && (
          <div className="flex items-center justify-center p-6 bg-primary-50 rounded-2xl">
            <div className="text-center">
              <p className="text-sm font-medium text-primary-600 uppercase tracking-wide mb-1">Your Queue Token</p>
              <p className="text-6xl font-black text-primary-700">#{appt.tokenNumber}</p>
              <p className="text-sm text-primary-500 mt-1">Save this number — you'll need it to track your queue</p>
            </div>
          </div>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Calendar size={18} className="text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="font-medium text-gray-900">{formatDate(appt.scheduledDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Clock size={18} className="text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Time</p>
              <p className="font-medium text-gray-900">{formatTime(appt.scheduledTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Hash size={18} className="text-primary-600" />
            <div>
              <p className="text-xs text-gray-500">Appointment ID</p>
              <p className="font-medium text-gray-900 text-xs">{appt.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          {appt.payment && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <CreditCard size={18} className="text-primary-600" />
              <div>
                <p className="text-xs text-gray-500">Consultation Fee</p>
                <p className="font-medium text-gray-900">{formatCurrency(appt.payment.amount)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment pending notice */}
        {appt.payment?.status === 'PENDING' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <p className="font-medium mb-1">⚠️ Payment Pending</p>
            <p>Complete your payment to confirm the appointment slot.</p>
            <Link to={`/payments?appointmentId=${appt.id}`} className="btn-primary btn-sm mt-3 inline-flex">
              <CreditCard size={14} />Pay Now — {formatCurrency(appt.payment.amount)}
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Link to={`/queue?doctorId=${appt.doctorId}`} className="btn-primary flex-1 justify-center">
          <Activity size={16} />Track Live Queue
        </Link>
        <Link to="/appointments" className="btn-secondary flex-1 justify-center">
          <Calendar size={16} />My Appointments
        </Link>
      </div>
    </div>
  );
};
