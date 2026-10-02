import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { doctorApi, specialtyApi } from '../../api/endpoints';
import { DoctorCard } from '../../components/DoctorCard';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Select } from '../../components/ui/Select';
import type { Specialty } from '../../types';

export const DoctorSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') ?? '',
    specialty: searchParams.get('specialty') ?? '',
    status: searchParams.get('status') ?? '',
    city: searchParams.get('city') ?? '',
    minFee: searchParams.get('minFee') ?? '',
    maxFee: searchParams.get('maxFee') ?? '',
    gender: searchParams.get('gender') ?? '',
  });

  const { data: specialtiesData } = useQuery({ queryKey: ['specialties'], queryFn: specialtyApi.getAll, staleTime: Infinity });
  const specialtyOptions = [
    { value: '', label: 'All Specialties' },
    ...(specialtiesData?.data?.data ?? []).map((s: Specialty) => ({ value: s.slug, label: `${s.icon ?? ''} ${s.name}` })),
  ];

  const queryParams = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['doctors', queryParams],
    queryFn: () => doctorApi.search(queryParams),
    staleTime: 1000 * 30,
  });

  const doctors = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const setFilter = (key: string, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    const params: Record<string, string> = {};
    Object.entries(next).forEach(([k, v]) => { if (v) params[k] = v; });
    setSearchParams(params);
  };

  const clearFilters = () => {
    const reset = { search: '', specialty: '', status: '', city: '', minFee: '', maxFee: '', gender: '' };
    setFilters(reset);
    setSearchParams({});
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="page-container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Find the right doctor</h1>
        <p className="text-gray-500 mt-1">{meta?.total != null ? `${meta.total} verified doctors` : 'Search our network of verified specialists'}</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" className="input pl-11 h-12 text-base" placeholder="Search by doctor name, specialty, clinic..."
            value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
          {filters.search && (
            <button onClick={() => setFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
          )}
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary h-12 px-4 relative gap-2 ${activeFilterCount > 0 ? 'border-primary-300 text-primary-700' : ''}`}>
          <SlidersHorizontal size={17} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">{activeFilterCount}</span>
          )}
          {showFilters ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {showFilters && (
        <div className="card p-5 mb-6 animate-slide-down">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Select label="Specialty" options={specialtyOptions} value={filters.specialty} onChange={(e) => setFilter('specialty', e.target.value)} />
            <Select label="Doctor Status" options={[
              { value: '', label: 'Any Status' }, { value: 'AVAILABLE', label: '🟢 Available' },
              { value: 'BUSY', label: '🟡 Busy' }, { value: 'DELAYED', label: '🟠 Delayed' },
              { value: 'IN_CONSULTATION', label: '🔵 In Consultation' },
            ]} value={filters.status} onChange={(e) => setFilter('status', e.target.value)} />
            <Select label="Gender" options={[{ value: '', label: 'Any Gender' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }]}
              value={filters.gender} onChange={(e) => setFilter('gender', e.target.value)} />
            <div>
              <label className="label">City</label>
              <input className="input" placeholder="e.g. Mumbai" value={filters.city} onChange={(e) => setFilter('city', e.target.value)} />
            </div>
            <div>
              <label className="label">Min Fee (₹)</label>
              <input type="number" className="input" placeholder="0" value={filters.minFee} onChange={(e) => setFilter('minFee', e.target.value)} />
            </div>
            <div>
              <label className="label">Max Fee (₹)</label>
              <input type="number" className="input" placeholder="5000" value={filters.maxFee} onChange={(e) => setFilter('maxFee', e.target.value)} />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="mt-4 text-sm text-red-600 hover:underline flex items-center gap-1"><X size={14} />Clear all filters</button>
          )}
        </div>
      )}

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(filters).map(([key, val]) => val ? (
            <span key={key} className="flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-200">
              {key}: {val}
              <button onClick={() => setFilter(key, '')}><X size={12} /></button>
            </span>
          ) : null)}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : doctors.length === 0 ? (
        <EmptyState icon={<Search size={48} />} title="No doctors found"
          description="Try adjusting your search filters or search for a different specialty."
          action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>} />
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            {isFetching && <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin mr-2" />}
            Showing {doctors.length} of {meta?.total ?? doctors.length} doctors
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
          </div>
        </>
      )}
    </div>
  );
};
