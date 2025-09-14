import React from 'react';

interface HexagonContainerProps {
  children: React.ReactNode;
  pathD: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  viewBox?: string;
  className?: string;
}

const HexagonContainer: React.FC<HexagonContainerProps> = ({
  children,
  pathD,
  fillColor = 'transparent',
  strokeColor = 'hsl(var(--primary))',
  strokeWidth = 3,
  viewBox = '0 0 400 400',
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <svg 
        viewBox={viewBox} 
        className="w-full h-full"
        style={{ maxWidth: '300px', maxHeight: '300px' }}
      >
        <path
          d={pathD}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

export default HexagonContainer;