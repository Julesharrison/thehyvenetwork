import React from 'react';

interface ParentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ParentContainer({ children, className }: ParentContainerProps) {
  return (
    <div className={`h-full bg-background flex items-center justify-center border border-debug1 p-4 ${className || ''}`}>
      {children}
    </div>
  );
}