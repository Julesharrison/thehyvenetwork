import React from 'react';
import { Heart } from 'lucide-react';

interface HexagonHeartProps {
  isLiked: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
}

const HexagonHeart: React.FC<HexagonHeartProps> = ({
  isLiked,
  onClick,
  className = '',
  disabled = false
}) => {
  const handleClick = (e?: React.MouseEvent) => {
    if (disabled || !onClick) return;
    e?.stopPropagation();
    onClick(e);
  };

  return (
    <div
      onClick={handleClick}
      className={`w-12 h-12 flex items-center justify-center transition-all relative ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <svg viewBox="0 0 48 48" className="w-12 h-12">
        <path 
          d="M1.24 23.46C0.67 22.43 0.67 21.17 1.24 20.14L10.46 3.95C11.08 2.79 12.39 2.09 13.8 2.09H32.2C33.61 2.09 34.92 2.79 35.54 3.95L44.76 20.14C45.33 21.17 45.33 22.43 44.76 23.46L35.54 39.65C34.92 40.81 33.61 41.51 32.2 41.51H13.8C12.39 41.51 11.08 40.81 10.46 39.65L1.24 23.46Z"
          fill="none"
          stroke={isLiked ? 'rgb(234 179 8)' : 'rgb(156 163 175)'}
          strokeWidth="2"
          className="transition-colors"
        />
        <foreignObject
          x="11"
          y="10"
          width="24"
          height="24"
        >
          <div className="w-full h-full flex items-center justify-center">
            <Heart 
              className={`w-6 h-6 transition-colors ${
                isLiked ? 'fill-current text-yellow-500' : 'text-gray-400'
              }`}
            />
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};

export default HexagonHeart;