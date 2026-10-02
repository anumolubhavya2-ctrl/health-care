import React from 'react';
import type { DoctorStatus } from '../../types';
import { getDoctorStatusLabel, getDoctorStatusClass } from '../../utils/helpers';

interface Props {
  status: DoctorStatus;
  showDot?: boolean;
  className?: string;
}

export const DoctorStatusBadge: React.FC<Props> = ({ status, showDot = true, className = '' }) => {
  const label = getDoctorStatusLabel(status);
  const cls = getDoctorStatusClass(status);

  const dotColors: Record<string, string> = {
    AVAILABLE: 'bg-emerald-500 animate-pulse',
    BUSY: 'bg-amber-500',
    DELAYED: 'bg-orange-500 animate-pulse',
    ON_LEAVE: 'bg-gray-400',
    IN_CONSULTATION: 'bg-blue-500 animate-pulse',
    OFFLINE: 'bg-gray-400',
  };

  return (
    <span className={`badge ${cls} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] ?? 'bg-gray-400'}`} />}
      {label}
    </span>
  );
};
