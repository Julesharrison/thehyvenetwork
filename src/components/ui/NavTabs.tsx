import React from 'react';

export interface NavTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface NavTabsProps {
  tabs: NavTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const NavTabs: React.FC<NavTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`flex bg-muted rounded-lg p-1 ${className}`}>
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2 px-2 rounded-md font-medium transition-all flex items-center justify-center min-w-0 ${
            activeTab === tab.id 
              ? 'bg-card text-primary shadow-sm' 
              : 'text-muted-foreground'
          } ${index !== 0 ? 'ml-1' : ''}`}
        >
          {tab.icon && (
            <span className="mr-2">
              {tab.icon}
            </span>
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default NavTabs;