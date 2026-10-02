import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { formatRelativeTime } from '../../utils/helpers';

export const AdminSupportPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tickets-list', statusFilter],
    queryFn: () => adminApi.getTickets({ status: statusFilter || undefined }),
  });

  const tickets = data?.data?.data ?? [];

  const priorityColor: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700',
  };
  const statusColor: Record<string, string> = {
    OPEN: 'bg-emerald-100 text-emerald-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    ESCALATED: 'bg-orange-100 text-orange-700',
    RESOLVED: 'bg-gray-100 text-gray-600',
    CLOSED: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Support Tickets</h1>

      <div className="flex gap-3 mb-6">
        <select className="input w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['OPEN','IN_PROGRESS','ESCALATED','RESOLVED','CLOSED'].map(s => (
            <option key={s} value={s}>{s.replace('_',' ')}</option>
          ))}
        </select>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="space-y-3">
          {tickets.length === 0 && <p className="text-center text-gray-400 py-16">No tickets found</p>}
          {tickets.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{t.subject}</p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                    {t.messages?.[0]?.message ?? t.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    {t.assignedAdmin && (
                      <span className="text-xs text-gray-500">
                        Assigned: {t.assignedAdmin.firstName} {t.assignedAdmin.lastName}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatRelativeTime(t.updatedAt)}</span>
                    <span className="text-xs text-gray-400">{t._count?.messages ?? 0} messages</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`badge text-xs ${statusColor[t.status] ?? 'bg-gray-100 text-gray-500'}`}>{t.status}</span>
                  <span className={`badge text-xs ${priorityColor[t.priority] ?? 'bg-gray-100 text-gray-500'}`}>{t.priority}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
