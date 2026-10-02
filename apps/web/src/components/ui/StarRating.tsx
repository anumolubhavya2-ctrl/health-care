import React from 'react';
import { Star } from 'lucide-react';

interface Props {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

export const StarRating: React.FC<Props> = ({
  rating,
  maxRating = 5,
  size = 14,
  showValue = true,
  reviewCount,
}) => {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700">{Number(rating).toFixed(1)}</span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-500">({reviewCount})</span>
      )}
    </div>
  );
};
