import React from 'react';
import { useHeader } from '../contexts/HeaderContext';
import Header from './Header';


interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isHeaderVisible } = useHeader();

  return (
    <div className="min-h-screen bg-background">
      {isHeaderVisible && <Header />}
      <main className={`w-full mx-auto sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl sm:px-6 lg:px-8 border border-debug3 ${
        isHeaderVisible ? 'h-[calc(100vh-88px)]' : 'h-screen'
      }`}>
        {children}
      </main>
    </div>
  );
}