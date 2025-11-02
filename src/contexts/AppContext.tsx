import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type TabType =
  | 'clothing'
  | 'inventory'
  | 'sales'
  | 'history'
  | 'reports'
  | 'investments'
  | 'cashflow'
  | 'notes'
  | 'account';

interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  refreshData: () => void;
  lastRefresh: Date;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Inicializar com 'account' como padrão para garantir que usuários não logados vejam a tela de login
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('JEACLOSET_active_tab');
    const isValidTab = saved && ['clothing', 'inventory', 'sales', 'history', 'reports', 'investments', 'cashflow', 'notes', 'account'].includes(saved);
    return (isValidTab ? saved : 'account') as TabType;
  });
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refreshData = () => {
    setLastRefresh(new Date());
  };

  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab);
    // Persistir a aba ativa no localStorage
    try {
      localStorage.setItem('JEACLOSET_active_tab', tab);
    } catch (error) {
      // Ignorar erros de localStorage
    }
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab: handleSetActiveTab,
      refreshData,
      lastRefresh
    }}>
      {children}
    </AppContext.Provider>
  );
};
