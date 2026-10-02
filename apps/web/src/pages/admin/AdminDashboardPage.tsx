import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Stethoscope, Calendar, CreditCard, MessageCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { formatCurrency, formatDate, getRefundStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const AdminDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: statsData, isLoading: statsLoading } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.getStats, refetchInterval: 60000 });
  const { data: refundsData } = useQuery({ queryKey: ['admin-refunds'], queryFn: adminApi.getRefunds });
  const { data: doctorsData } = useQuery({ queryKey: ['admin-doctors', { verified: 'false' }], queryFn: () => adminApi.getDoctors({ verified: 'false', limit: 5 }) });

  const stats = statsData?.data?.data;
  const pendingRefunds = (refundsData?.data?.data ?? []).filter(r => ['REQUESTED', 'UNDER_REVIEW'].includes(r.status)).slice(0, 5);
  const unverifiedDoctors = doctorsData?.data?.data ?? [];

  const verifyMutation = useMutation({
    mutationFn: adminApi.verifyDoctor,
    onSuccess: () => { toast.success('Doctor verified'); queryClient.invalidateQueries({ queryKey: ['admin-doctors'] }); },
  });

  const processRefundMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.processRefund(id, { status }),
    onSuccess: () => { toast.success('Refund updated'); queryClient.invalidateQueries({ queryKey: ['admin-refunds'] }); },
  });

  const statCards = stats ? [
    { label: 'Total Patients', value: stats.totalPatients.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Doctors', value: stats.totalDoctors.toLocaleString(), icon: Stethoscope, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: "Today's Appointments", value: stats.todayAppointments.toLocaleString(), icon: Calendar, color: 'text-primary-600', bg: 'bg-primary-50' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Refunds', value: stats.pendingRefunds.toString(), icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Open Tickets', value: stats.openTickets.toString(), icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats */}
      {statsLoading ? <div className="flex justify-center py-8"><Spinner size="lg" /></div> : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Unverified doctors */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Doctors Awaiting Verification</h2>
          {unverifiedDoctors.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">All doctors are verified ✓</p>
          ) : (
            <div className="space-y-3">
              {unverifiedDoctors.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">Dr. {doc.firstName} {doc.lastName}</p>
                    <p className="text-xs text-gray-500">{doc.specialties?.[0]?.specialty?.name ?? 'General'}</p>
                    <p className="text-xs text-gray-400">{(doc as { user?: { email?: string } }).user?.email}</p>
                  </div>
                  <button onClick={() => verifyMutation.mutate(doc.id)} disabled={verifyMutation.isPending} className="btn-primary btn-sm">
                    <CheckCircle size={13} />Verify
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending refunds */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Pending Refunds</h2>
          {pendingRefunds.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">No pending refunds</p>
          ) : (
            <div className="space-y-3">
              {pendingRefunds.map((refund) => (
                <div key={refund.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {refund.appointment?.patient?.firstName} {refund.appointment?.patient?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Dr. {refund.appointment?.doctor?.firstName} {refund.appointment?.doctor?.lastName}</p>
                      <p className="text-xs text-gray-400">{formatDate(refund.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(refund.amount)}</p>
                      <span className={`badge text-xs ${getRefundStatusColor(refund.status)}`}>{refund.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => processRefundMutation.mutate({ id: refund.id, status: 'APPROVED' })} className="btn-primary btn-sm flex-1 text-xs py-1.5">Approve</button>
                    <button onClick={() => processRefundMutation.mutate({ id: refund.id, status: 'PROCESSED' })} className="btn-secondary btn-sm flex-1 text-xs py-1.5">Process</button>
                    <button onClick={() => processRefundMutation.mutate({ id: refund.id, status: 'REJECTED' })} className="btn-danger btn-sm flex-1 text-xs py-1.5">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
