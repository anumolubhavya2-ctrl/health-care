import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { formatDate, formatCurrency, getRefundStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const AdminRefundsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['admin-refunds-list'], queryFn: adminApi.getRefunds });
  const refunds = data?.data?.data ?? [];

  const processMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.processRefund(id, { status }),
    onSuccess: () => { toast.success('Refund updated'); queryClient.invalidateQueries({ queryKey: ['admin-refunds-list'] }); },
    onError: () => toast.error('Failed to update refund'),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Refunds</h1>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="space-y-4">
          {refunds.length === 0 && <p className="text-center text-gray-400 py-16">No refunds found</p>}
          {refunds.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold text-gray-900">
                      {r.appointment?.patient?.firstName} {r.appointment?.patient?.lastName}
                    </p>
                    <span className="text-gray-400">→</span>
                    <p className="text-gray-600">Dr. {r.appointment?.doctor?.firstName} {r.appointment?.doctor?.lastName}</p>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Reason: {r.reason}</p>
                  <p className="text-xs text-gray-400">Requested: {formatDate(r.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(r.amount)}</p>
                  <span className={`badge text-xs mt-1 ${getRefundStatusColor(r.status)}`}>{r.status}</span>
                </div>
              </div>

              {['REQUESTED', 'UNDER_REVIEW'].includes(r.status) && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button onClick={() => processMutation.mutate({ id: r.id, status: 'APPROVED' })}
                    className="btn-primary btn-sm flex-1" disabled={processMutation.isPending}>Approve</button>
                  <button onClick={() => processMutation.mutate({ id: r.id, status: 'PROCESSED' })}
                    className="btn-secondary btn-sm flex-1" disabled={processMutation.isPending}>Mark Processed</button>
                  <button onClick={() => processMutation.mutate({ id: r.id, status: 'REJECTED' })}
                    className="btn-danger btn-sm flex-1" disabled={processMutation.isPending}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
