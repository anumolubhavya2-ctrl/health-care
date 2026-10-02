import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Users, Clock, Activity, CheckCircle, ChevronRight } from 'lucide-react';
import { doctorApi, queueApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { Avatar } from '../../components/ui/Avatar';
import { DoctorStatusBadge } from '../../components/ui/DoctorStatusBadge';
import { Select } from '../../components/ui/Select';
import { formatTime, getAppointmentStatusColor } from '../../utils/helpers';
import type { DoctorStatus } from '../../types';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: { value: DoctorStatus; label: string }[] = [
  { value: 'AVAILABLE', label: '🟢 Available' },
  { value: 'BUSY', label: '🟡 Busy' },
  { value: 'IN_CONSULTATION', label: '🔵 In Consultation' },
  { value: 'DELAYED', label: '🟠 Delayed' },
  { value: 'ON_LEAVE', label: '⚪ On Leave' },
  { value: 'OFFLINE', label: '⚫ Offline' },
];

export const DoctorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const doctor = user?.doctor;
  const [newStatus, setNewStatus] = useState<DoctorStatus>(doctor?.status ?? 'AVAILABLE');
  const [statusMessage, setStatusMessage] = useState(doctor?.statusMessage ?? '');
  const [delayMinutes, setDelayMinutes] = useState(doctor?.delayMinutes?.toString() ?? '');

  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: ['doctor-today-appointments'],
    queryFn: doctorApi.getTodayAppointments,
    refetchInterval: 30000,
  });
  const appointments = apptData?.data?.data ?? [];

  const { data: queueData } = useQuery({
    queryKey: ['doctor-queue', doctor?.id],
    queryFn: () => queueApi.getByDoctor(doctor!.id),
    enabled: !!doctor?.id,
    refetchInterval: 10000,
  });

  const statusMutation = useMutation({
    mutationFn: () => doctorApi.updateStatus({
      status: newStatus,
      statusMessage: statusMessage || undefined,
      delayMinutes: newStatus === 'DELAYED' && delayMinutes ? parseInt(delayMinutes) : undefined,
    }),
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries({ queryKey: ['auth-me'] }); },
    onError: () => toast.error('Failed to update status'),
  });

  const callNextMutation = useMutation({
    mutationFn: queueApi.callNext,
    onSuccess: () => { toast.success('Next patient called!'); queryClient.invalidateQueries({ queryKey: ['doctor-queue'] }); },
  });

  const firstName = doctor?.firstName ?? '';
  const lastName = doctor?.lastName ?? '';
  const queueInfo = queueData?.data?.data;
  const activeQueue = queueInfo?.queue?.entries?.filter(e => !e.completedAt && !e.isSkipped) ?? [];

  const todayStats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    remaining: appointments.filter(a => ['CONFIRMED', 'CHECKED_IN'].includes(a.status)).length,
    checkedIn: appointments.filter(a => a.status === 'CHECKED_IN').length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar firstName={firstName} lastName={lastName} image={doctor?.profileImage} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dr. {firstName} {lastName}</h1>
            <p className="text-gray-500 text-sm">{doctor?.specialties?.[0]?.specialty?.name}</p>
            <DoctorStatusBadge status={doctor?.status ?? 'OFFLINE'} className="mt-1" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Total", value: todayStats.total, icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Remaining', value: todayStats.remaining, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Checked In', value: todayStats.checkedIn, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: todayStats.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status control */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Activity size={18} className="text-primary-600" />Update Your Status</h2>
          <Select label="Current Status" options={STATUS_OPTIONS} value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as DoctorStatus)} />
          {newStatus === 'DELAYED' && (
            <div>
              <label className="label">Delay (minutes)</label>
              <input type="number" className="input" placeholder="e.g. 15" value={delayMinutes} onChange={(e) => setDelayMinutes(e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">Status Message (optional)</label>
            <input className="input" placeholder="e.g. Running 10 min late..." value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)} />
          </div>
          <button onClick={() => statusMutation.mutate()} disabled={statusMutation.isPending} className="btn-primary w-full">
            {statusMutation.isPending ? <Spinner size="sm" /> : 'Update Status'}
          </button>
        </div>

        {/* Live queue */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Users size={18} className="text-primary-600" />Live Queue ({activeQueue.length})</h2>
            <button onClick={() => callNextMutation.mutate()} disabled={callNextMutation.isPending || activeQueue.length === 0} className="btn-primary btn-sm">
              {callNextMutation.isPending ? <Spinner size="sm" /> : 'Call Next'}
            </button>
          </div>
          {activeQueue.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">Queue is empty</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeQueue.slice(0, 8).map((entry, idx) => (
                <div key={entry.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${idx === 0 ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'}`}>
                  <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${idx === 0 ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>{entry.position}</span>
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-gray-800">Token #{entry.tokenNumber}</p>
                    {entry.checkedInAt && <p className="text-xs text-emerald-600">Checked in</p>}
                  </div>
                  {idx === 0 && <span className="text-xs text-primary-600 bg-primary-100 px-2 py-0.5 rounded-full">Next</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's appointments */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary-600" />Today's Schedule</h2>
          {apptLoading ? <div className="flex justify-center py-6"><Spinner /></div> :
            appointments.length === 0 ? <p className="text-center text-gray-400 py-6 text-sm">No appointments today</p> : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <div className="text-center min-w-[48px]">
                      <p className="text-xs font-bold text-primary-700">{formatTime(appt.scheduledTime)}</p>
                    </div>
                    <Avatar firstName={appt.patient.firstName} lastName={appt.patient.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{appt.patient.firstName} {appt.patient.lastName}</p>
                    </div>
                    <span className={`badge text-xs ${getAppointmentStatusColor(appt.status)}`}>{appt.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
