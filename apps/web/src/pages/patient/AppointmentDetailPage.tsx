import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Calendar, Clock, Activity, CreditCard, RotateCcw, AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { appointmentApi } from '../../api/endpoints';
import { Avatar } from '../../components/ui/Avatar';
import { DoctorStatusBadge } from '../../components/ui/DoctorStatusBadge';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatTime, formatCurrency, getAppointmentStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const AppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['appointment', id], queryFn: () => appointmentApi.getById(id!), enabled: !!id });
  const appt = data?.data?.data;

  const cancelMutation = useMutation({
    mutationFn: () => appointmentApi.cancel(id!, cancelReason || undefined),
    onSuccess: () => {
      toast.success('Appointment cancelled');
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
      setShowCancelModal(false);
    },
    onError: () => toast.error('Failed to cancel appointment'),
  });

  const checkInMutation = useMutation({
    mutationFn: () => appointmentApi.checkIn(id!),
    onSuccess: () => {
      toast.success('Checked in successfully!');
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!appt) return <div className="page-container py-10 text-center text-gray-500">Appointment not found</div>;

  const canCancel = ['PENDING', 'CONFIRMED'].includes(appt.status);
  const canCheckIn = appt.status === 'CONFIRMED';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/appointments" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft size={16} />My Appointments
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
        <span className={`badge text-sm ${getAppointmentStatusColor(appt.status)}`}>{appt.status.replace('_', ' ')}</span>
      </div>

      <div className="space-y-5">
        {/* Doctor card */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <Avatar firstName={appt.doctor.firstName} lastName={appt.doctor.lastName} image={appt.doctor.profileImage} size="lg" />
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-lg">Dr. {appt.doctor.firstName} {appt.doctor.lastName}</p>
              <p className="text-primary-600">{appt.doctor.specialties?.[0]?.specialty?.name}</p>
              <DoctorStatusBadge status={appt.doctor.status} className="mt-1" />
            </div>
            <Link to={`/doctors/${appt.doctorId}`} className="btn-secondary btn-sm">View Profile</Link>
          </div>
          {appt.doctor.clinicName && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
              <MapPin size={13} />{appt.doctor.clinicName}{appt.doctor.clinicCity ? `, ${appt.doctor.clinicCity}` : ''}
            </div>
          )}
        </div>

        {/* Token & time */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Calendar, label: 'Date', value: formatDate(appt.scheduledDate) },
            { icon: Clock, label: 'Time', value: formatTime(appt.scheduledTime) },
            { icon: Activity, label: 'Token', value: appt.tokenNumber ? `#${appt.tokenNumber}` : 'N/A' },
            { icon: CreditCard, label: 'Type', value: appt.consultationType.replace('_', ' ') },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-4 text-center">
              <Icon size={20} className="text-primary-600 mx-auto mb-1.5" />
              <p className="text-xs text-gray-500">{label}</p>
              <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Symptoms */}
        {appt.symptoms && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Symptoms / Reason</h3>
            <p className="text-gray-600 text-sm">{appt.symptoms}</p>
          </div>
        )}

        {/* Doctor notes (post-consultation) */}
        {appt.doctorNotes && (
          <div className="card p-5 border-l-4 border-emerald-500">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600" />Doctor's Notes</h3>
            <p className="text-gray-600 text-sm">{appt.doctorNotes}</p>
            {appt.diagnosis && <><p className="font-medium text-gray-800 mt-3">Diagnosis</p><p className="text-gray-600 text-sm">{appt.diagnosis}</p></>}
            {appt.prescription && <><p className="font-medium text-gray-800 mt-3">Prescription</p><p className="text-gray-600 text-sm">{appt.prescription}</p></>}
            {appt.followUpDate && <p className="text-sm text-primary-600 mt-3">Follow-up: {formatDate(appt.followUpDate)}</p>}
          </div>
        )}

        {/* Payment */}
        {appt.payment && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Payment</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(appt.payment.amount)}</p>
                {appt.payment.transactionId && <p className="text-xs text-gray-400 mt-0.5">TXN: {appt.payment.transactionId}</p>}
              </div>
              <span className={`badge ${appt.payment.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : appt.payment.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                {appt.payment.status}
              </span>
            </div>
            {appt.payment.status === 'PENDING' && (
              <Link to={`/payments?appointmentId=${appt.id}`} className="btn-primary btn-sm mt-3 inline-flex"><CreditCard size={14} />Pay Now</Link>
            )}
          </div>
        )}

        {/* Refund */}
        {appt.refund && (
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><RotateCcw size={16} />Refund Status</h3>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">₹{appt.refund.amount}</p>
              <span className={`badge ${appt.refund.status === 'PROCESSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{appt.refund.status}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2">
          {canCheckIn && (
            <button onClick={() => checkInMutation.mutate()} disabled={checkInMutation.isPending} className="btn-primary">
              {checkInMutation.isPending ? <Spinner size="sm" /> : <CheckCircle size={16} />}Check In
            </button>
          )}
          {appt.tokenNumber && (
            <Link to={`/queue?doctorId=${appt.doctorId}&appointmentId=${appt.id}`} className="btn-secondary">
              <Activity size={16} />Track Queue
            </Link>
          )}
          {canCancel && (
            <button onClick={() => setShowCancelModal(true)} className="btn-danger btn-sm ml-auto">
              <AlertTriangle size={15} />Cancel Appointment
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Appointment">
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure you want to cancel this appointment?</p>
          {appt.payment?.status === 'PAID' && (
            <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
              A refund of {formatCurrency(appt.payment.amount)} will be initiated automatically.
            </div>
          )}
          <div>
            <label className="label">Reason (optional)</label>
            <textarea className="input resize-none" rows={3} placeholder="Reason for cancellation..."
              value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCancelModal(false)} className="btn-secondary flex-1">Keep Appointment</button>
            <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="btn-danger flex-1">
              {cancelMutation.isPending ? <Spinner size="sm" /> : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
