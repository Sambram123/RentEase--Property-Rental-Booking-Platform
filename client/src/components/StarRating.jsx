import { useState } from 'react';
import { FiStar } from 'react-icons/fi';

/**
 * StarRating — reusable star rating component
 *
 * Props:
 *   value      — current rating value (0–5)
 *   onChange   — callback(newValue) for interactive mode (omit for read-only)
 *   size       — 'sm' | 'md' | 'lg' (default 'md')
 *   count      — number of stars (default 5)
 *   showLabel  — show numeric label next to stars
 */
const SIZES = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const StarRating = ({
  value = 0,
  onChange,
  size = 'md',
  count = 5,
  showLabel = false,
}) => {
  const [hover, setHover] = useState(0);
  const isInteractive = typeof onChange === 'function';
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: count }, (_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= (hover || value);

        return (
          <button
            key={starIndex}
            type="button"
            disabled={!isInteractive}
            onClick={() => isInteractive && onChange(starIndex)}
            onMouseEnter={() => isInteractive && setHover(starIndex)}
            onMouseLeave={() => isInteractive && setHover(0)}
            className={`transition-colors ${
              isInteractive ? 'cursor-pointer' : 'cursor-default'
            } ${isFilled ? 'text-amber-400' : 'text-gray-300'}`}
            aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
          >
            <FiStar
              className={`${sizeClass} ${isFilled ? 'fill-amber-400' : ''}`}
            />
          </button>
        );
      })}
      {showLabel && value > 0 && (
        <span className="ml-1 text-sm font-medium text-secondary">
          {Number(value).toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
