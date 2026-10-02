import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';
import type { NotificationType } from '../../types';

const typeIcons: Record<NotificationType, string> = {
  APPOINTMENT_CONFIRMED: '📅',
  APPOINTMENT_CANCELLED: '❌',
  APPOINTMENT_REMINDER: '⏰',
  QUEUE_UPDATE: '🔄',
  DOCTOR_STATUS_CHANGE: '👨‍⚕️',
  REFUND_UPDATE: '💰',
  SUPPORT_MESSAGE: '💬',
  PAYMENT_SUCCESS: '✅',
  PAYMENT_FAILED: '⚠️',
  GENERAL: '🔔',
};

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationApi.getAll({ limit: 50 }) });
  const notifications = data?.data?.data?.notifications ?? [];
  const unreadCount = data?.data?.data?.unreadCount ?? 0;

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markRead(),
    onSuccess: () => {
      toast.success('All marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-primary-600 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending} className="btn-secondary btn-sm">
            <CheckCheck size={15} />Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell size={48} />} title="No notifications yet" description="You'll see appointment updates, queue alerts, and payment info here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`card p-4 flex items-start gap-4 ${!n.isRead ? 'border-primary-100 bg-primary-50/30' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${!n.isRead ? 'bg-primary-100' : 'bg-gray-100'}`}>
                {typeIcons[n.type] ?? '🔔'}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-medium text-sm ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                  {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1 flex-shrink-0" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1.5">{formatRelativeTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
