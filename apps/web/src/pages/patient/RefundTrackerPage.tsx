import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { refundApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, formatCurrency, getRefundStatusColor } from '../../utils/helpers';
import type { RefundStatus } from '../../types';

const statusIcons: Record<RefundStatus, React.ReactNode> = {
  REQUESTED: <Clock size={16} className="text-amber-500" />,
  UNDER_REVIEW: <AlertCircle size={16} className="text-blue-500" />,
  APPROVED: <CheckCircle size={16} className="text-teal-500" />,
  PROCESSED: <CheckCircle size={16} className="text-emerald-600" />,
  REJECTED: <XCircle size={16} className="text-red-500" />,
};

const statusSteps: RefundStatus[] = ['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSED'];

export const RefundTrackerPage: React.FC = () => {
  const { data, isLoading } = useQuery({ queryKey: ['my-refunds'], queryFn: refundApi.getMyRefunds });
  const refunds = data?.data?.data ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Refund Tracker</h1>
        <p className="text-gray-500 mt-1">Track all your refund requests in real time</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : refunds.length === 0 ? (
        <EmptyState icon={<RotateCcw size={48} />} title="No refund requests"
          description="When you cancel a paid appointment, your refund will appear here." />
      ) : (
        <div className="space-y-5">
          {refunds.map((refund) => {
            const currentStepIndex = statusSteps.indexOf(refund.status as RefundStatus);
            const isRejected = refund.status === 'REJECTED';
            return (
              <div key={refund.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Dr. {refund.appointment?.doctor?.firstName} {refund.appointment?.doctor?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Appointment: {refund.appointment?.scheduledDate ? formatDate(refund.appointment.scheduledDate) : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">Reason: {refund.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(refund.amount)}</p>
                    <span className={`badge text-xs mt-1 ${getRefundStatusColor(refund.status)}`}>
                      {statusIcons[refund.status as RefundStatus]} {refund.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Progress tracker */}
                {!isRejected && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      {statusSteps.map((step, idx) => (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              idx <= currentStepIndex ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {idx < currentStepIndex ? <CheckCircle size={14} /> : idx + 1}
                            </div>
                            <span className="text-[10px] text-gray-500 text-center max-w-[64px] leading-tight">
                              {step.replace('_', ' ')}
                            </span>
                          </div>
                          {idx < statusSteps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 ${idx < currentStepIndex ? 'bg-primary-600' : 'bg-gray-200'}`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {isRejected && refund.notes && (
                  <div className="mt-3 p-3 bg-red-50 rounded-xl text-sm text-red-700">
                    <p className="font-medium">Rejection reason:</p>
                    <p>{refund.notes}</p>
                  </div>
                )}

                {refund.transactionId && (
                  <p className="text-xs text-gray-400 mt-3">Transaction ID: {refund.transactionId}</p>
                )}

                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span>Requested: {formatDate(refund.createdAt)}</span>
                  {refund.processedAt && <span>Processed: {formatDate(refund.processedAt)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
