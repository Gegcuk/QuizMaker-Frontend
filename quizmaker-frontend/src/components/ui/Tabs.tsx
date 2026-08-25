// src/components/ui/Tabs.tsx
// ---------------------------------------------------------------------------
// Simple tabs component for organizing content into sections
// ---------------------------------------------------------------------------

import React, { createContext, useContext, useId, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  getTabId: (value: string) => string;
  getPanelId: (value: string) => string;
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
  const tabsId = useId();
  
  // Use controlled value if provided, otherwise use internal state
  const activeTab = value !== undefined ? value : internalTab;
  const setActiveTab = (newTab: string) => {
    if (value === undefined) setInternalTab(newTab);
    onValueChange?.(newTab);
  };
  const getValueId = (tabValue: string) => encodeURIComponent(tabValue).replace(/%/g, '');
  const getTabId = (tabValue: string) => `${tabsId}-tab-${getValueId(tabValue)}`;
  const getPanelId = (tabValue: string) => `${tabsId}-panel-${getValueId(tabValue)}`;

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, getTabId, getPanelId }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export const TabsList: React.FC<TabsListProps> = ({
  children,
  className = '',
  ariaLabel = 'Sections',
}) => {
  return (
    <nav 
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
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
  disabled?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  icon,
  className = '',
  disabled = false,
}) => {
  const { activeTab, setActiveTab, getTabId, getPanelId } = useTabsContext();
  const isActive = activeTab === value;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    const tabs = Array.from(
      event.currentTarget.closest('[role="tablist"]')?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ) ?? [],
    );
    if (tabs.length === 0) return;

    event.preventDefault();
    const currentIndex = tabs.indexOf(event.currentTarget);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    nextTab.focus();
    nextTab.click();
  };

  return (
    <button
      id={getTabId(value)}
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={getPanelId(value)}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      onKeyDown={handleKeyDown}
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
  const { activeTab, getTabId, getPanelId } = useTabsContext();
  
  if (activeTab !== value) {
    return null;
  }

  return (
    <div
      id={getPanelId(value)}
      role="tabpanel"
      aria-labelledby={getTabId(value)}
      tabIndex={0}
      className={className}
    >
      {children}
    </div>
  );
};
