import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { 
  ShoppingBag, 
  Package, 
  ShoppingCart, 
  History, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FileText,
  User,
  Menu,
  X,
  Lock,
  LogOut
} from 'lucide-react';

// Lazy loading dos componentes das abas para melhor performance
const ClothingForm = lazy(() => import('./components/ClothingForm'));
const InventoryManager = lazy(() => import('./components/InventoryManager'));
const SalesRegister = lazy(() => import('./components/SalesRegister'));
const SalesHistory = lazy(() => import('./components/SalesHistory'));
const Reports = lazy(() => import('./components/Reports'));
const Investments = lazy(() => import('./components/Investments'));
const CashFlow = lazy(() => import('./components/CashFlow'));
const Notes = lazy(() => import('./components/Notes'));
const Account = lazy(() => import('./components/Account'));

import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider, useApp } from './contexts/AppContext';
import { prefetchFirestoreCollections } from './utils/prefetch';
import { initializeUsers } from './utils/initializeUsers';
import { checkAndCreateBackup } from './utils/autoBackup';
import './utils/resetFirebaseUsers'; // Importar para expor função global

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

const tabs = [
  { id: 'clothing' as TabType, name: 'Cadastrar Peças', icon: ShoppingBag },
  { id: 'inventory' as TabType, name: 'Gerenciar Estoque', icon: Package },
  { id: 'sales' as TabType, name: 'Registrar Vendas', icon: ShoppingCart },
  { id: 'history' as TabType, name: 'Histórico', icon: History },
  { id: 'reports' as TabType, name: 'Relatórios', icon: BarChart3 },
  { id: 'investments' as TabType, name: 'Investimentos', icon: TrendingUp },
  { id: 'cashflow' as TabType, name: 'Fluxo de Caixa', icon: DollarSign },
  { id: 'notes' as TabType, name: 'Anotações', icon: FileText },
  { id: 'account' as TabType, name: 'Conta', icon: User },
];

function AppContent() {
  const { activeTab, setActiveTab } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Inicializar usuários e verificar se usuário está logado
  useEffect(() => {
    // Inicializar usuários padrão no Firebase (remove "kayla" e cria novos)
    initializeUsers().catch(err => {
      console.error('Erro ao inicializar usuários:', err);
    });
    
    // IMPORTANTE: Ao abrir aplicação, sempre verificar se localStorage tem usuário
    // mas não confiar apenas nele - o login sempre buscará do Firebase
    // O localStorage aqui é apenas para manter a sessão aberta se não houver alterações de senha
    const savedUser = localStorage.getItem('JEACLOSET_user');
    if (savedUser) {
      try {
        const userProfile = JSON.parse(savedUser);
        userProfile.createdAt = new Date(userProfile.createdAt);
        userProfile.lastLogin = new Date(userProfile.lastLogin);
        // Manter sessão apenas se o usuário não tiver alterado a senha recentemente
        // Se a senha foi alterada, o localStorage foi limpo e o usuário precisa fazer login novamente
        setCurrentUser(userProfile);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('JEACLOSET_user');
      }
    }
  }, []);

  // Prefetch em segundo plano após login (ou se já estiver logado ao abrir)
  useEffect(() => {
    if (isLoggedIn) {
      prefetchFirestoreCollections(['clothing', 'sales']);
      
      // Verificar e fazer backup automático em segundo plano (se necessário)
      // Delay de 5 segundos para não interferir no carregamento inicial
      setTimeout(() => {
        checkAndCreateBackup().catch(err => {
          console.error('Erro ao verificar backup automático:', err);
        });
      }, 5000);
    }
  }, [isLoggedIn]);

  // Sempre começar na aba Conta se não estiver logado
  useEffect(() => {
    if (!isLoggedIn) {
      setActiveTab('account');
    }
  }, [isLoggedIn, setActiveTab]);

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setActiveTab('account');
    localStorage.removeItem('JEACLOSET_user');
    localStorage.removeItem('JEACLOSET_active_tab');
  };

  // Componente de loading simples
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
    </div>
  );

  const renderTabContent = useMemo(() => {
    // Se não estiver logado, só permite acessar a aba Conta
    if (!isLoggedIn && activeTab !== 'account') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <Account />
        </Suspense>
      );
    }
    
    switch (activeTab) {
      case 'clothing':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ClothingForm />
          </Suspense>
        );
      case 'inventory':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <InventoryManager />
          </Suspense>
        );
      case 'sales':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SalesRegister />
          </Suspense>
        );
      case 'history':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SalesHistory />
          </Suspense>
        );
      case 'reports':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Reports />
          </Suspense>
        );
      case 'investments':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Investments />
          </Suspense>
        );
      case 'cashflow':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <CashFlow />
          </Suspense>
        );
      case 'notes':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Notes />
          </Suspense>
        );
      case 'account':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Account 
              onLogin={(user) => {
                setCurrentUser(user);
                setIsLoggedIn(true);
                // Admin e usuário vão para estoque
                try {
                  localStorage.setItem('JEACLOSET_active_tab', 'inventory');
                } catch {}
                setActiveTab('inventory');
              }}
              onLogout={() => {
                setCurrentUser(null);
                setIsLoggedIn(false);
              }}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
            />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <Account />
          </Suspense>
        );
    }
  }, [activeTab, isLoggedIn, currentUser, setActiveTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-orange-50/20 to-pink-50/30">
      {/* Header */}
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-50 via-orange-50 to-pink-50 px-8 py-6 border-b-2 border-rose-200/30">
            <div className="flex justify-between items-center">
              <div className="flex items-center justify-center flex-1">
                <button
                  className="lg:hidden absolute left-8 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                <div className="text-center">
                  <h1 
                    className="text-3xl md:text-4xl font-bold text-gray-800 drop-shadow-sm" 
                    style={{ 
                      fontFamily: 'Playfair Display, serif', 
                      letterSpacing: '0.05em',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    J&A CLOSET
                  </h1>
                  <p 
                    className="text-base md:text-lg text-gray-600 mt-2" 
                    style={{ 
                      fontFamily: 'Playfair Display, serif', 
                      fontWeight: '400',
                      letterSpacing: '0.02em'
                    }}
                  >
                    Vestir-se bem é um ato de amor!
                  </p>
                </div>
              </div>
              
              {/* Botão de Logout */}
              {isLoggedIn && (
                <div className="absolute right-8 top-6">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    title="Sair da aplicação"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Sair</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex px-6 pb-6">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 h-full overflow-hidden">
            <div className="flex flex-col h-full pt-16 lg:pt-0">
              <nav className="flex-1 px-3 py-6 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isAccountTab = tab.id === 'account';
                const isBlocked = !isLoggedIn && !isAccountTab;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (!isBlocked) {
                        setActiveTab(tab.id);
                        setSidebarOpen(false);
                      }
                    }}
                    disabled={isBlocked}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group ${
                      isBlocked
                        ? 'text-gray-400 cursor-not-allowed opacity-50'
                        : activeTab === tab.id
                        ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:text-gray-900 hover:shadow-md hover:transform hover:scale-102'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mr-3 transition-all duration-300 ${
                      isBlocked
                        ? 'bg-gray-200'
                        : activeTab === tab.id
                        ? 'bg-white bg-opacity-20'
                        : 'bg-gray-100 group-hover:bg-white'
                    }`}>
                      {isBlocked ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Icon className={`h-5 w-5 transition-colors duration-300 ${
                          activeTab === tab.id
                            ? 'text-white'
                            : 'text-gray-600 group-hover:text-gray-900'
                        }`} />
                      )}
                    </div>
                    <span className="font-semibold">
                      {isBlocked ? `${tab.name} (Bloqueado)` : tab.name}
                    </span>
                  </button>
                );
              })}
              </nav>
            </div>
          </div>
        </div>

        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-6">
          <div className="py-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {renderTabContent}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;