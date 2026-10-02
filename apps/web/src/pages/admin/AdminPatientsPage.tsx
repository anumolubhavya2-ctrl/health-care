import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate } from '../../utils/helpers';

export const AdminPatientsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-patients-list', search],
    queryFn: () => adminApi.getPatients({ search: search || undefined, limit: 50 }),
  });

  const patients = data?.data?.data ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Patients</h1>

      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-10" placeholder="Search by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Patient', 'Gender', 'City', 'Blood Group', 'Appointments', 'Status', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={p.firstName} lastName={p.lastName} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-gray-500">{(p as { user?: { email?: string } }).user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{p.gender?.toLowerCase().replace('_', ' ') ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.city ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.bloodGroup ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{(p as { _count?: { appointments?: number } })._count?.appointments ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${(p as { user?: { isActive?: boolean } }).user?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {(p as { user?: { isActive?: boolean } }).user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {patients.length === 0 && <p className="text-center text-gray-400 py-10">No patients found</p>}
        </div>
      )}
    </div>
  );
};
