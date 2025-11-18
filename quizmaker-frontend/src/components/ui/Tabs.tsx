// src/components/ui/Tabs.tsx
// ---------------------------------------------------------------------------
// Simple tabs component for organizing content into sections
// ---------------------------------------------------------------------------

import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ defaultValue, value, onValueChange, children, className = '' }) => {
  const [internalTab, setInternalTab] = useState(defaultValue || value || '');
  
  // Use controlled value if provided, otherwise use internal state
  const activeTab = value !== undefined ? value : internalTab;
  const setActiveTab = (newTab: string) => {
    if (onValueChange) {
      onValueChange(newTab);
    } else {
      setInternalTab(newTab);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <nav 
      className={`flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide ${className}`}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex space-x-4 sm:space-x-8 min-w-max">
        {children}
      </div>
    </nav>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, icon, className = '' }) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`
        inline-flex items-center py-4 px-0.5 sm:px-1 border-b-2 rounded-none text-sm font-medium transition-colors flex-shrink-0
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-theme-bg-primary
        ${isActive 
          ? 'border-theme-interactive-primary text-theme-interactive-primary' 
          : 'border-transparent text-theme-text-secondary hover:text-theme-text-primary hover:border-theme-border-secondary'
        }
        ${className}
      `}
    >
      {icon && <span className="mr-1 sm:mr-2 flex-shrink-0">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '' }) => {
  const { activeTab } = useTabsContext();
  
  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
};
