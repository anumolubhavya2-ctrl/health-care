import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Video, Phone, Users } from 'lucide-react';
import type { Doctor } from '../types';
import { Avatar } from './ui/Avatar';
import { DoctorStatusBadge } from './ui/DoctorStatusBadge';
import { StarRating } from './ui/StarRating';
import { formatCurrency } from '../utils/helpers';

interface Props {
  doctor: Doctor;
  onBook?: () => void;
}

export const DoctorCard: React.FC<Props> = ({ doctor }) => {
  const primarySpecialty = doctor.specialties?.find((s) => s.isPrimary) ?? doctor.specialties?.[0];

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <Avatar firstName={doctor.firstName} lastName={doctor.lastName} image={doctor.profileImage} size="lg" />
          {doctor.isVerified && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center" title="Verified">
              <svg viewBox="0 0 20 20" fill="white" className="w-3 h-3">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/doctors/${doctor.id}`} className="hover:text-primary-600 transition-colors">
            <h3 className="font-semibold text-gray-900 text-base truncate">Dr. {doctor.firstName} {doctor.lastName}</h3>
          </Link>
          {primarySpecialty && (
            <p className="text-sm text-primary-600 font-medium mt-0.5">{primarySpecialty.specialty.name}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">{doctor.experience} years experience</p>
        </div>
        <DoctorStatusBadge status={doctor.status} />
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm text-gray-600">
        {doctor.clinicName && (
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{doctor.clinicName}{doctor.clinicCity ? `, ${doctor.clinicCity}` : ''}</span>
          </div>
        )}
        <div className="flex items-center gap-4">
          {doctor.isAvailableForVideo && (
            <span className="flex items-center gap-1 text-teal-600"><Video size={13} />Video</span>
          )}
          {doctor.isAvailableForPhone && (
            <span className="flex items-center gap-1 text-teal-600"><Phone size={13} />Phone</span>
          )}
          <span className="flex items-center gap-1 text-gray-500">
            <Users size={13} />{doctor.totalPatients.toLocaleString()} patients
          </span>
        </div>
      </div>

      {/* Status notices */}
      {doctor.status === 'DELAYED' && doctor.delayMinutes && (
        <div className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg text-sm text-orange-700">
          <Clock size={14} className="flex-shrink-0" />
          <span>Running {doctor.delayMinutes} min behind schedule</span>
        </div>
      )}
      {doctor.status === 'ON_LEAVE' && doctor.statusMessage && (
        <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg text-sm text-gray-600">
          <Clock size={14} className="flex-shrink-0" />
          <span>{doctor.statusMessage}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <div>
          <StarRating rating={Number(doctor.rating)} reviewCount={doctor.totalReviews} size={13} />
          <p className="text-xs text-gray-500 mt-0.5">{doctor.languages?.slice(0, 2).join(', ')}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{formatCurrency(doctor.consultationFee)}</p>
          <p className="text-xs text-gray-500">per visit</p>
        </div>
      </div>

      <Link
        to={`/doctors/${doctor.id}`}
        className={`btn-primary w-full text-sm py-2 ${
          doctor.status === 'OFFLINE' || doctor.status === 'ON_LEAVE' ? 'opacity-60 pointer-events-none' : ''
        }`}
      >
        {doctor.status === 'AVAILABLE' ? 'Book Appointment' :
          doctor.status === 'ON_LEAVE' ? 'Not Available' :
          doctor.status === 'OFFLINE' ? 'Currently Offline' : 'View & Book'}
      </Link>
    </div>
  );
};
