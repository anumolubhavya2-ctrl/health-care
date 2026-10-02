import React from 'react';
import { getInitials } from '../../utils/helpers';

interface AvatarProps {
  firstName: string;
  lastName: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
};

export const Avatar: React.FC<AvatarProps> = ({ firstName, lastName, image, size = 'md', className = '' }) => {
  const initials = getInitials(firstName, lastName);
  const sizeClass = sizes[size];

  if (image) {
    return (
      <img
        src={image}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  // Consistent color from name
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-teal-100 text-teal-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
    'bg-orange-100 text-orange-700',
    'bg-green-100 text-green-700',
  ];
  const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length;

  return (
    <div
      className={`${sizeClass} ${colors[colorIndex]} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </div>
  );
};
