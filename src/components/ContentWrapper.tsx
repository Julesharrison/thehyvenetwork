import React from 'react';

interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function ContentWrapper({ children, className }: ContentWrapperProps) {
  return (
    <div className={`w-full max-w-md border border-debug2 ${className || ''}`}>
      {children}
    </div>
  );
}