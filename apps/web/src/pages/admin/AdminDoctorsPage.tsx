import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, CheckCircle, X } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { Spinner } from '../../components/ui/Spinner';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

export const AdminDoctorsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-doctors-list', search, verifiedFilter],
    queryFn: () => adminApi.getDoctors({ search: search || undefined, verified: verifiedFilter || undefined, limit: 50 }),
  });

  const verifyMutation = useMutation({
    mutationFn: adminApi.verifyDoctor,
    onSuccess: () => { toast.success('Doctor verified'); queryClient.invalidateQueries({ queryKey: ['admin-doctors-list'] }); },
  });

  const doctors = data?.data?.data ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Doctors</h1>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-10" placeholder="Search by name or email..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-44" value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
          <option value="">All Doctors</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {isLoading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Doctor', 'Specialty', 'City', 'Fee', 'Patients', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {doctors.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar firstName={doc.firstName} lastName={doc.lastName} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">Dr. {doc.firstName} {doc.lastName}</p>
                        <p className="text-xs text-gray-500">{(doc as { user?: { email?: string } }).user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{doc.specialties?.[0]?.specialty?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{doc.clinicCity ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(doc.consultationFee)}</td>
                  <td className="px-4 py-3 text-gray-600">{doc.totalPatients.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${doc.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {doc.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(doc.createdAt)}</td>
                  <td className="px-4 py-3">
                    {!doc.isVerified && (
                      <button onClick={() => verifyMutation.mutate(doc.id)} disabled={verifyMutation.isPending}
                        className="btn-primary btn-sm text-xs py-1">
                        <CheckCircle size={12} />Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {doctors.length === 0 && <p className="text-center text-gray-400 py-10">No doctors found</p>}
        </div>
      )}
    </div>
  );
};
