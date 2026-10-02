import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { formatDate, formatTime, getAppointmentStatusColor } from '../../utils/helpers';

export const AdminAppointmentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-appointments-list', statusFilter, dateFilter],
    queryFn: () => adminApi.getAppointments({ status: statusFilter || undefined, date: dateFilter || undefined, limit: 50 }),
  });

  const appointments = data?.data?.data ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Appointments</h1>

      <div className="flex gap-3 mb-6">
        <select className="input w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['PENDING','CONFIRMED','CHECKED_IN','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW'].map(s => (
            <option key={s} value={s}>{s.replace('_',' ')}</option>
          ))}
        </select>
        <input type="date" className="input w-44" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        {(statusFilter || dateFilter) && (
          <button onClick={() => { setStatusFilter(''); setDateFilter(''); }} className="btn-secondary btn-sm">Clear</button>
        )}
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Patient', 'Doctor', 'Date', 'Time', 'Type', 'Status', 'Amount'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.patient.firstName} {a.patient.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">Dr. {a.doctor.firstName} {a.doctor.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(a.scheduledDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatTime(a.scheduledTime)}</td>
                  <td className="px-4 py-3 text-gray-600">{a.consultationType.replace('_',' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${getAppointmentStatusColor(a.status)}`}>{a.status.replace('_',' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {(a as { payment?: { amount?: number } }).payment?.amount
                      ? `₹${(a as { payment?: { amount?: number } }).payment!.amount}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && <p className="text-center text-gray-400 py-10">No appointments found</p>}
        </div>
      )}
    </div>
  );
};
