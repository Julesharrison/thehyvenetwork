import React from 'react';
import { Heart } from 'lucide-react';

interface FavoriteHeartProps {
  isFavorited: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'button' | 'icon' | 'full-button' | 'hexagon';
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
  showText?: boolean;
  disabled?: boolean;
}

const FavoriteHeart: React.FC<FavoriteHeartProps> = ({
  isFavorited,
  size = 'md',
  variant = 'button',
  onClick,
  className = '',
  showText = false,
  disabled = false
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { icon: 'w-4 h-4', padding: 'p-1.5' },
    md: { icon: 'w-5 h-5', padding: 'p-2' },
    lg: { icon: 'w-6 h-6', padding: 'p-3' },
    xl: { icon: 'w-12 h-12', padding: 'p-4' }
  };

  // Base heart styling
  const heartClasses = `${sizeConfig[size].icon} ${isFavorited ? 'fill-current' : ''}`;
  
  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'button':
        return `${sizeConfig[size].padding} rounded-full transition-colors ${
          isFavorited 
            ? 'bg-yellow-500/20 text-yellow-500' 
            : 'bg-muted text-muted-foreground hover:bg-yellow-500/20 hover:text-yellow-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
      
      case 'full-button':
        return `flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
          isFavorited 
            ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
      
      case 'hexagon':
        return `w-12 h-12 flex items-center justify-center transition-all relative ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`;
      
      case 'icon':
      default:
        return `transition-colors ${
          isFavorited ? 'text-yellow-500' : 'text-muted-foreground'
        } ${disabled ? 'opacity-50' : ''}`;
    }
  };

  const handleClick = (e?: React.MouseEvent) => {
    if (disabled || !onClick) return;
    e?.stopPropagation();
    onClick(e);
  };

  const containerClasses = `${getVariantClasses()} ${className}`.trim();

  if (variant === 'hexagon') {
    return (
      <div
        onClick={handleClick}
        className={containerClasses}
      >
        <svg viewBox="0 0 48 48" className="w-12 h-12">
          <path 
            d="M1.24 23.46C0.67 22.43 0.67 21.17 1.24 20.14L10.46 3.95C11.08 2.79 12.39 2.09 13.8 2.09H32.2C33.61 2.09 34.92 2.79 35.54 3.95L44.76 20.14C45.33 21.17 45.33 22.43 44.76 23.46L35.54 39.65C34.92 40.81 33.61 41.51 32.2 41.51H13.8C12.39 41.51 11.08 40.81 10.46 39.65L1.24 23.46Z"
            fill="none"
            stroke={isFavorited ? 'rgb(234 179 8)' : 'rgb(156 163 175)'}
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
                  isFavorited ? 'fill-current text-yellow-500' : 'text-gray-400'
                }`}
              />
            </div>
          </foreignObject>
        </svg>
      </div>
    );
  }

  if (variant === 'full-button') {
    return (
      <button
        onClick={handleClick}
        className={containerClasses}
        disabled={disabled}
      >
        <Heart className={heartClasses} />
        {showText && (isFavorited ? 'Liked' : 'Like')}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={containerClasses}
        disabled={disabled}
      >
        <Heart className={heartClasses} />
      </button>
    );
  }

  // Icon variant - just the heart icon
  return (
    <Heart 
      className={`${heartClasses} ${containerClasses} ${onClick && !disabled ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    />
  );
};

export default FavoriteHeart;