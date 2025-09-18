import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderContextType {
  isHeaderVisible: boolean;
  showHeader: () => void;
  hideHeader: () => void;
  toggleHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

interface HeaderProviderProps {
  children: ReactNode;
}

export const HeaderProvider: React.FC<HeaderProviderProps> = ({ children }) => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  const showHeader = () => setIsHeaderVisible(true);
  const hideHeader = () => setIsHeaderVisible(false);
  const toggleHeader = () => setIsHeaderVisible(!isHeaderVisible);

  const value = {
    isHeaderVisible,
    showHeader,
    hideHeader,
    toggleHeader,
  };

  return (
    <HeaderContext.Provider value={value}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeader = (): HeaderContextType => {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
};