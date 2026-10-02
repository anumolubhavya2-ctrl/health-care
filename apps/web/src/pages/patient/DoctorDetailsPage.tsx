import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Globe, GraduationCap, Users, Video, Phone, ChevronLeft, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { doctorApi } from '../../api/endpoints';
import { Avatar } from '../../components/ui/Avatar';
import { DoctorStatusBadge } from '../../components/ui/DoctorStatusBadge';
import { StarRating } from '../../components/ui/StarRating';
import { Spinner } from '../../components/ui/Spinner';
import { formatCurrency, getDayName, formatRelativeTime } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import type { Review } from '../../types';

export const DoctorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'availability' | 'reviews'>('overview');

  const { data, isLoading } = useQuery({ queryKey: ['doctor', id], queryFn: () => doctorApi.getById(id!), enabled: !!id });
  const doctor = data?.data?.data;

  if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>;
  if (!doctor) return (
    <div className="page-container py-20 text-center">
      <AlertTriangle size={48} className="text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-700">Doctor not found</h2>
      <Link to="/doctors" className="btn-primary mt-4 inline-flex">Back to Search</Link>
    </div>
  );

  const primarySpecialty = doctor.specialties?.find(s => s.isPrimary) ?? doctor.specialties?.[0];
  const canBook = !['OFFLINE', 'ON_LEAVE'].includes(doctor.status);

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-3">
          <Link to="/doctors" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft size={16} />Back to search
          </Link>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-shrink-0">
              <Avatar firstName={doctor.firstName} lastName={doctor.lastName} image={doctor.profileImage} size="xl" />
              {doctor.isVerified && (
                <span className="absolute bottom-1 right-1 w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center shadow-md">
                  <CheckCircle size={15} className="text-white" />
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dr. {doctor.firstName} {doctor.lastName}</h1>
                  {primarySpecialty && <p className="text-primary-600 font-semibold mt-1">{primarySpecialty.specialty.name}</p>}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                    <span>{doctor.experience} years experience</span>
                    {doctor.clinicCity && <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" />{doctor.clinicCity}</span>}
                    <StarRating rating={Number(doctor.rating)} reviewCount={doctor.totalReviews} />
                  </div>
                </div>
                <DoctorStatusBadge status={doctor.status} />
              </div>

              {doctor.status === 'DELAYED' && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-orange-50 rounded-xl text-sm text-orange-700">
                  <Clock size={16} />Running {doctor.delayMinutes} minutes behind schedule.
                </div>
              )}
              {doctor.status === 'ON_LEAVE' && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-gray-100 rounded-xl text-sm text-gray-600">
                  <AlertTriangle size={16} />{doctor.statusMessage ?? 'Doctor is currently on leave.'}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                {doctor.isAvailableForVideo && <span className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full"><Video size={12} />Video</span>}
                {doctor.isAvailableForPhone && <span className="flex items-center gap-1.5 text-xs text-teal-700 bg-teal-50 px-3 py-1.5 rounded-full"><Phone size={12} />Phone</span>}
                <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full"><Users size={12} />{doctor.totalPatients.toLocaleString()} patients</span>
              </div>
            </div>

            <div className="md:w-64 flex-shrink-0">
              <div className="card p-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Consultation Fee</p>
                  <p className="text-2xl font-bold text-gray-900 mt-0.5">{formatCurrency(doctor.consultationFee)}</p>
                  <p className="text-xs text-gray-400">per in-person visit</p>
                </div>
                {canBook ? (
                  <button onClick={() => { if (!isAuthenticated) navigate('/login'); else navigate(`/book/${doctor.id}`); }} className="btn-primary w-full">
                    <Calendar size={16} />Book Appointment
                  </button>
                ) : (
                  <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">Not Available</button>
                )}
                {doctor.queue && (
                  <div className="p-3 bg-blue-50 rounded-xl text-sm">
                    <p className="font-medium text-blue-800">Live Queue Today</p>
                    <div className="mt-1.5 flex gap-4 text-blue-600 text-xs">
                      <span>#{doctor.queue.currentToken}/{doctor.queue.totalTokens} served</span>
                      <span>~{doctor.queue.avgWaitMinutes}min/patient</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="page-container">
          <div className="flex gap-1 border-b border-gray-200 -mb-px">
            {(['overview', 'availability', 'reviews'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab}{tab === 'reviews' ? ` (${doctor.reviews?.length ?? 0})` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {doctor.bio && (
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{doctor.bio}</p>
                </div>
              )}
              {doctor.qualifications?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><GraduationCap size={18} className="text-primary-600" />Qualifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {doctor.qualifications.map((q) => <span key={q} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700">{q}</span>)}
                  </div>
                </div>
              )}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.specialties?.map((ds) => (
                    <span key={ds.id} className={`px-3 py-1.5 rounded-full text-sm font-medium ${ds.isPrimary ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'}`}>
                      {ds.specialty.name}{ds.isPrimary ? ' ★' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Clinic Info</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  {doctor.clinicName && <p className="font-medium text-gray-800">{doctor.clinicName}</p>}
                  {doctor.clinicAddress && <p>{doctor.clinicAddress}</p>}
                  {doctor.clinicCity && <p>{doctor.clinicCity}{doctor.clinicState ? `, ${doctor.clinicState}` : ''}</p>}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Globe size={16} className="text-primary-600" />Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.languages?.map((l) => <span key={l} className="px-2.5 py-1 bg-gray-100 rounded-full text-sm text-gray-700">{l}</span>)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="card p-6 max-w-lg">
            <h3 className="font-semibold text-gray-900 mb-4">Weekly Availability</h3>
            {doctor.availabilities?.length === 0 ? <p className="text-gray-500 text-sm">No availability set</p> : (
              <div className="space-y-2">
                {doctor.availabilities?.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="font-medium text-gray-700 text-sm w-28">{getDayName(a.dayOfWeek)}</span>
                    <span className="text-sm text-gray-600">{a.startTime} – {a.endTime}</span>
                    <span className="text-xs text-gray-400">{a.slotDuration}min</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {a.isActive ? 'Active' : 'Off'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-2xl space-y-4">
            {(!doctor.reviews || doctor.reviews.length === 0) ? (
              <div className="card p-8 text-center text-gray-500">No reviews yet</div>
            ) : (doctor.reviews as Review[]).map((r: Review) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{r.patient?.firstName} {r.patient?.lastName}</p>
                    <StarRating rating={r.rating} showValue={false} size={12} />
                  </div>
                  <span className="text-xs text-gray-400">{formatRelativeTime(r.createdAt)}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
