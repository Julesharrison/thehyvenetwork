import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[375px] mx-auto">
        {children}
      </main>
    </div>
  );
}