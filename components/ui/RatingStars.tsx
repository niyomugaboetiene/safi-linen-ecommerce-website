'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export default function RatingStars({
  rating,
  onRatingChange,
  size = 'md',
  showValue = false,
  className,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const stars = [1, 2, 3, 4, 5];

  if (onRatingChange) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {stars.map((star) => (
          <button
            key={star}
            onClick={() => onRatingChange(star)}
            className="focus:outline-none"
            aria-label={`Rate ${star} stars`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                star <= rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-neutral-300 hover:text-amber-400 transition-colors'
              )}
            />
          </button>
        ))}
        {showValue && (
          <span className="ml-2 text-sm font-medium text-neutral-700">
            {rating} / 5
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {stars.map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'text-neutral-300'
          )}
        />
      ))}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-neutral-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}