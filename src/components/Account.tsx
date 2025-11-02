import { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut, Settings, Shield, Mail, X, Eye, EyeOff, Edit3, KeyRound, Upload, AlertTriangle } from 'lucide-react';
import { useUsers } from '../hooks/useFirestore';
import { useAccessTracking } from '../hooks/useAccessTracking';
import type { User } from '../types';
import { restoreBackup } from '../utils/backupService';

interface UserCredentials {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

// NOTA: Este array NÃO é mais usado - apenas para referência histórica
// Todas as credenciais agora vêm do Firebase
// Usuários padrão são criados automaticamente em initializeUsers()
const USERS: UserCredentials[] = [
  {
    email: 'admin@JEACLOSET.com',
    password: 'admin2024',
    name: 'Administrador',
    role: 'admin'
  },
  {
    email: 'user@JEACLOSET.com',
    password: 'user2024',
    name: 'Usuário',
    role: 'user'
  }
];

interface AccountProps {
  onLogin?: (user: User) => void;
  onLogout?: () => void;
  isLoggedIn?: boolean;
  currentUser?: User | null;
}

export default function Account({ onLogin, onLogout, isLoggedIn: propIsLoggedIn, currentUser: propCurrentUser }: AccountProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(propIsLoggedIn || false);
  const [currentUser, setCurrentUser] = useState<User | null>(propCurrentUser || null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showEditSelf, setShowEditSelf] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [userEditForm, setUserEditForm] = useState({
    name: '',
    email: '',
    password: '',
    newPassword: ''
  });
  const [selfEditForm, setSelfEditForm] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loginError, setLoginError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState<number>(3); // Frequência padrão: 3 dias
  
  // Estados para feedback de sucesso
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'name' | 'password' | 'user_updated' | 'backup_restored'>('name');
  
  // Estados para feedback de erro
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState<'password_incorrect' | 'passwords_dont_match' | 'password_mismatch' | 'user_save_error' | 'user_fields_required' | 'backup_restore_error'>('password_incorrect');
  
  // Estados para restauração de backup
  const [showRestoreBackup, setShowRestoreBackup] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupFileData, setBackupFileData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook para gerenciar usuários no Firebase
  const { updateUser, createUser, getUserByEmail, getUserByLogin } = useUsers();
  
  // Hook para rastreamento de acessos
  const { accessData, trackAccess, fetchAccessData } = useAccessTracking();

  // Sistema de login - FIREBASE ONLY (sem fallback para array local)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      // Permitir login por nome de usuário ou email completo
      const rawLogin = (loginForm.email || '').trim();
      
      console.log('🔍 Tentando login com:', rawLogin);
      
      // IMPORTANTE: Invalidar cache antes de buscar para garantir dados atualizados
      try {
        localStorage.removeItem('JEACLOSET_cache_users');
        localStorage.removeItem('JEACLOSET_cache_time_users');
      } catch (e) {
        // Ignorar erros
      }
      
      // BUSCAR NO FIREBASE por nome OU email (getUserByLogin busca ambos)
      // Sempre busca diretamente do Firebase, nunca do cache
      const firebaseUser = await getUserByLogin(rawLogin);
      
      // Verificar se usuário existe e senha está correta
      // Usar mensagem genérica para ambos os casos por segurança (não revelar se usuário existe)
      if (!firebaseUser) {
        setLoginError('Nome de usuário ou senha incorretos.');
        return;
      }
      
      // Verificar senha
      const isValid = firebaseUser.password === loginForm.password;
      
      if (!isValid) {
        setLoginError('Nome de usuário ou senha incorretos.');
        return;
      }
      
      // Login válido
      const baseUser = {
          email: firebaseUser.email,
          name: firebaseUser.name,
          role: firebaseUser.role,
          password: firebaseUser.password
        };
      
      // Logs de segurança - sem expor dados sensíveis
      console.log('🔐 Verificação de login:', {
        usuario: rawLogin,
        encontrado: !!baseUser,
        valido: isValid
      });
      
      if (isValid && baseUser) {
        const userProfile: User = {
          id: baseUser.email,
          name: baseUser.name,
          email: baseUser.email,
          role: baseUser.role,
          createdAt: new Date('2025-09-06'), // Data corrigida
          lastLogin: new Date()
        };
        
        setCurrentUser(userProfile);
      setIsLoggedIn(true);
      setLoginForm({ email: '', password: '' });
        
        // Salvar no localStorage (apenas para cache local)
        localStorage.setItem('JEACLOSET_user', JSON.stringify(userProfile));
        
        // Limpar credenciais antigas do USEKAYLLA se existirem
        try {
          localStorage.removeItem('usekaylla_user');
          localStorage.removeItem('usekaylla_credentials');
          localStorage.removeItem('usekaylla_user_data');
        } catch (e) {
          // Ignorar erros
        }
        
        // 🔥 REGISTRAR ACESSO NO FIREBASE (DADOS REAIS)
        trackAccess(baseUser.role as 'user' | 'admin');
        
        // Atualizar dados de acesso para o admin
        fetchAccessData();
        
        // Notificar componente pai
        if (onLogin) {
          onLogin(userProfile);
        }
      } else {
        setLoginError('Nome de usuário ou senha incorretos.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setLoginError('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('JEACLOSET_user');
    
    // Notificar componente pai
    if (onLogout) {
      onLogout();
    }
  };

  // Recuperação de senha removida por solicitação

  // Função para verificar senha atual - FIREBASE ONLY
  const verifyCurrentPassword = async (password: string): Promise<boolean> => {
    try {
      // Buscar usuário no Firebase
      const firebaseUser = await getUserByEmail(currentUser?.email || '');
      
      if (!firebaseUser) {
        return false;
      }
      
        // Verificar senha do Firebase
        return firebaseUser.password === password;
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      return false;
    }
  };

  // Funções para editar próprias informações
  const handleEditSelf = () => {
    if (currentUser) {
      // Se for usuário, só permite alterar senha; admin pode alterar nome e senha
      setSelfEditForm({
        name: currentUser.name,
        email: '', // Não usar email no formulário
        role: currentUser.role, // Mantém role original (admin sempre admin, user sempre user)
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowEditSelf(true);
    }
  };

  const handleSaveSelfEdit = async () => {
    const isUser = currentUser?.role === 'user';
    const isAdmin = currentUser?.role === 'admin';
    
    // USUÁRIO: Só pode alterar senha (nome não pode ser alterado por ele mesmo)
    if (isUser) {
      // Validar se forneceu nova senha
      if (!selfEditForm.newPassword) {
        alert('Informe uma nova senha para alterar!');
        return;
      }
      
      // Confirmar senha é obrigatório
      if (selfEditForm.newPassword !== selfEditForm.confirmPassword) {
        setErrorType('password_mismatch');
        setShowError(true);
        return;
      }
      
      // Senha atual é OBRIGATÓRIA para usuário
      if (!selfEditForm.currentPassword) {
        setErrorType('password_incorrect');
        setShowError(true);
        alert('Para alterar a senha, é necessário informar a senha atual!');
        return;
      }
      
      // Verificar senha atual do usuário
      const isCurrentPasswordValid = await verifyCurrentPassword(selfEditForm.currentPassword);
      if (!isCurrentPasswordValid) {
        setErrorType('password_incorrect');
        setShowError(true);
        return;
      }
      
      // Buscar usuário no Firebase
      const firebaseUser = await getUserByEmail(currentUser?.email || '');
      
      if (firebaseUser) {
        // Atualizar apenas a senha (nome não pode ser alterado pelo usuário)
        await updateUser(firebaseUser.id, {
          password: selfEditForm.newPassword,
          updatedAt: new Date()
        });
        
        // Limpar localStorage do usuário atual para forçar novo login com senha atualizada
        localStorage.removeItem('JEACLOSET_user');
      }
      
      // Mostrar feedback de sucesso
      setSuccessType('password');
      setShowSuccess(true);
      setShowEditSelf(false);
      setSelfEditForm({ name: '', email: '', role: 'user', currentPassword: '', newPassword: '', confirmPassword: '' });
      return;
    }
    
    // ADMIN: Pode alterar nome e senha (role sempre mantém 'admin')
    if (isAdmin) {
      if (!selfEditForm.name) {
        alert('Preencha o nome!');
        return;
      }
      
      try {
        // Verificar se senha foi fornecida e validar
        if (selfEditForm.newPassword) {
          // Se forneceu nova senha, confirmar senha é obrigatório
          if (selfEditForm.newPassword !== selfEditForm.confirmPassword) {
            setErrorType('password_mismatch');
            setShowError(true);
            return;
          }
          
          // ADMIN: Se informou senha atual, validar; se não informou, pode alterar mesmo assim (poder total)
          if (selfEditForm.currentPassword) {
          const isCurrentPasswordValid = await verifyCurrentPassword(selfEditForm.currentPassword);
          if (!isCurrentPasswordValid) {
            setErrorType('password_incorrect');
            setShowError(true);
            return;
            }
          }
        }
        
        const newEmail = currentUser?.email || ''; // Admin mantém seu email
        
        // Buscar usuário no Firebase
        const firebaseUser = await getUserByEmail(currentUser?.email || '');
        
        const updateData: any = {
            name: selfEditForm.name,
            email: newEmail,
            role: currentUser?.role || 'admin' // Admin sempre mantém role 'admin'
        };
        
        // Se nova senha foi fornecida, incluir na atualização
        if (selfEditForm.newPassword) {
          updateData.password = selfEditForm.newPassword;
        }
        
        if (firebaseUser) {
          // Atualizar no Firebase
          await updateUser(firebaseUser.id, updateData);
        } else {
          // Criar usuário no Firebase se não existir
          // Buscar senha atual do Firebase antes de criar novo
          const currentFirebaseUser = await getUserByEmail(currentUser?.email || '');
          await createUser({
            name: selfEditForm.name,
            email: newEmail,
            role: currentUser?.role || 'admin', // Admin sempre mantém role 'admin'
            password: selfEditForm.newPassword || currentFirebaseUser?.password || '',
            createdAt: new Date()
          });
        }
        
        // Se senha foi alterada, limpar localStorage para forçar novo login
        if (selfEditForm.newPassword) {
          localStorage.removeItem('JEACLOSET_user');
        }
        
        // Atualizar usuário atual
        const updatedUser: User = {
          ...currentUser!,
          name: selfEditForm.name,
          email: newEmail,
          role: currentUser?.role || 'admin' // Admin sempre mantém role 'admin'
        };
        setCurrentUser(updatedUser);
        
        // Salvar no localStorage apenas se senha não foi alterada (para manter sessão)
        if (!selfEditForm.newPassword) {
        localStorage.setItem('JEACLOSET_user', JSON.stringify(updatedUser));
        }
        
        // Limpar dados antigos do localStorage
        try {
          localStorage.removeItem('JEACLOSET_user_data');
          localStorage.removeItem('usekaylla_user_data');
        } catch (e) {
          // Ignorar erros
        }
        
        // Mostrar feedback de sucesso
        setSuccessType(selfEditForm.newPassword ? 'password' : 'name');
        setShowSuccess(true);
        
        // Fechar modal de edição
        setShowEditSelf(false);
        setSelfEditForm({ name: '', email: '', role: currentUser?.role || 'admin', currentPassword: '', newPassword: '', confirmPassword: '' });
      } catch (error) {
        console.error('Erro ao salvar alterações:', error);
        alert('Erro ao salvar alterações. Tente novamente.');
      }
    } else {
      alert('Preencha todos os campos!');
    }
  };

  // Funções para Admin editar usuário - ADMIN TEM PRIORIDADE ABSOLUTA
  const handleEditUser = async () => {
    try {
      // ADMIN SEMPRE BUSCA DADOS ATUALIZADOS DO FIREBASE
      const userEmail = 'user@JEACLOSET.com';
      const firebaseUser = await getUserByEmail(userEmail);
      
      console.log('🔍 Admin buscando dados do user no Firebase...');
      
      if (firebaseUser) {
        setUserEditForm({
          name: firebaseUser.name,
          email: firebaseUser.email,
          password: firebaseUser.password || '',
          newPassword: ''
        });
        console.log('✅ Admin vendo dados atualizados do user no Firebase:', {
          name: firebaseUser.name,
          hasPassword: !!firebaseUser.password
        });
      } else {
        // Se não encontrou no Firebase, criar usuário padrão
        console.log('⚠️ Usuário não encontrado no Firebase, criando padrão');
          setUserEditForm({
          name: 'Usuário',
          email: 'user@JEACLOSET.com',
          password: '',
            newPassword: ''
          });
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      // Em caso de erro, usar valores padrão
        setUserEditForm({
        name: 'Usuário',
        email: 'user@JEACLOSET.com',
        password: '',
          newPassword: ''
        });
    }
    setShowEditUser(true);
  };



  const handleSaveUserEdit = async () => {
    if (userEditForm.name && userEditForm.password) {
      try {
        // Determinar qual senha usar (nova senha se fornecida, senão manter a atual)
        const finalPassword = userEditForm.newPassword || userEditForm.password;
        
        // Usuário padrão - manter email original ou criar novo baseado no nome
        const userEmail = userEditForm.email || 'user@JEACLOSET.com';
        const userRole = 'user';
        
        console.log('💾 ADMIN SALVANDO E SINCRONIZANDO:', { name: userEditForm.name, email: userEmail });
        
        // 1. ATUALIZAR FIREBASE PRIMEIRO (PRIORIDADE ABSOLUTA)
        // Buscar por email OU por nome (caso o email tenha mudado)
        let firebaseUser = await getUserByEmail(userEmail);
        
        // Se não encontrou por email, tentar buscar pelo nome atual
        if (!firebaseUser) {
          firebaseUser = await getUserByLogin(userEditForm.name);
        }
        
        if (firebaseUser) {
          await updateUser(firebaseUser.id, {
            name: userEditForm.name, // Nome atualizado - agora pode ser usado para login
            email: userEmail, // Manter email original
            password: finalPassword
          });
          console.log('✅ FIREBASE ATUALIZADO - Usuário pode fazer login com nome:', userEditForm.name);
        } else {
          await createUser({
            name: userEditForm.name,
            email: userEmail,
            password: finalPassword,
            role: userRole,
            createdAt: new Date()
          });
          console.log('✅ FIREBASE CRIADO - Usuário pode fazer login com nome:', userEditForm.name);
        }
        
        // 2. Limpar localStorage antigo (dados agora estão no Firebase)
        try {
          localStorage.removeItem('JEACLOSET_user_data');
          localStorage.removeItem('JEACLOSET_credentials');
          localStorage.removeItem('JEACLOSET_cache_users');
          localStorage.removeItem('JEACLOSET_cache_time_users');
          localStorage.removeItem('usekaylla_user_data');
          localStorage.removeItem('usekaylla_credentials');
        } catch (e) {
          // Ignorar erros
        }
        
        console.log('✅ SINCRONIZAÇÃO COMPLETA - Usuário pode fazer login com nome:', userEditForm.name);
        
        // Mostrar feedback de sucesso
        setSuccessType('user_updated');
        setShowSuccess(true);
        
        setShowEditUser(false);
        setUserEditForm({ name: '', email: '', password: '', newPassword: '' });
      } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        setErrorType('user_save_error');
        setShowError(true);
      }
    } else {
      setErrorType('user_fields_required');
      setShowError(true);
    }
  };

  // Funções para ações rápidas
  const handleChangePassword = async () => {
    // Validar campos obrigatórios
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Preencha todos os campos!');
      return;
    }

    // Validar se as senhas coincidem
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorType('password_mismatch');
      setShowError(true);
      return;
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await verifyCurrentPassword(passwordForm.currentPassword);
    if (!isCurrentPasswordValid) {
        setErrorType('password_incorrect');
        setShowError(true);
        return;
      }

    // Buscar usuário no Firebase
    const firebaseUser = await getUserByEmail(currentUser?.email || '');
    
      if (firebaseUser) {
          // Atualizar apenas a senha (nome não pode ser alterado pelo usuário)
          await updateUser(firebaseUser.id, {
            password: passwordForm.newPassword,
            updatedAt: new Date()
          });
          
          // Limpar localStorage do usuário atual para forçar novo login com senha atualizada
          // Isso garante que na próxima vez que abrir a aplicação, use as credenciais corretas do Firebase
          localStorage.removeItem('JEACLOSET_user');

      // Mostrar feedback de sucesso
      setSuccessType('password');
      setShowSuccess(true);
      setShowChangePassword(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } else {
          alert('Erro ao encontrar usuário. Tente novamente.');
        }
  };

  // Função para ler e validar arquivo de backup
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Verificar se é admin
    if (currentUser?.role !== 'admin') {
      setErrorType('backup_restore_error');
      setShowError(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      // Ler arquivo JSON
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Validar estrutura básica
      if (!backupData.collections) {
        throw new Error('Arquivo de backup inválido: não contém coleções');
      }

      // Salvar dados do backup e mostrar modal de confirmação
      setBackupFileData(backupData);
      setShowConfirmRestore(true);
    } catch (error) {
      console.error('Erro ao ler arquivo de backup:', error);
      setErrorType('backup_restore_error');
      setShowError(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Função para confirmar e executar restauração
  const handleConfirmRestore = async () => {
    if (!backupFileData) {
      return;
    }

    setShowConfirmRestore(false);
    setRestoreLoading(true);

    try {
      // Restaurar backup
      const result = await restoreBackup(backupFileData);

      if (result.success) {
        setSuccessType('backup_restored');
        setShowSuccess(true);
        
        // Recarregar página após 2 segundos para ver dados restaurados
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setErrorType('backup_restore_error');
        setShowError(true);
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      setErrorType('backup_restore_error');
      setShowError(true);
    } finally {
      setRestoreLoading(false);
      setBackupFileData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowRestoreBackup(false);
    }
  };

  // Função para cancelar confirmação
  const handleCancelRestore = () => {
    setShowConfirmRestore(false);
    setBackupFileData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Sincronizar com props do componente pai
  useEffect(() => {
    if (propIsLoggedIn !== undefined) {
      setIsLoggedIn(propIsLoggedIn);
    }
    if (propCurrentUser !== undefined) {
      setCurrentUser(propCurrentUser);
    }
    // Carregar preferência de som
    try {
      const pref = localStorage.getItem('JEACLOSET_sound_enabled');
      if (pref !== null) {
        setSoundEnabled(pref === 'true');
      }
    } catch {}
    // Carregar frequência de backup configurada
    try {
      const savedFrequency = localStorage.getItem('JEACLOSET_backup_frequency');
      if (savedFrequency) {
        setBackupFrequency(parseInt(savedFrequency, 10));
      }
    } catch {}
  }, [propIsLoggedIn, propCurrentUser]);

  // Carregar usuário do localStorage (apenas se não vier via props)
  useEffect(() => {
    if (!propIsLoggedIn && !propCurrentUser) {
      const savedUser = localStorage.getItem('JEACLOSET_user');
      if (savedUser) {
        try {
          const userProfile = JSON.parse(savedUser);
          // Converter strings de data de volta para Date
          userProfile.createdAt = new Date(userProfile.createdAt);
          userProfile.lastLogin = new Date(userProfile.lastLogin);
          setCurrentUser(userProfile);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Erro ao carregar usuário:', error);
          localStorage.removeItem('JEACLOSET_user');
        }
      }
    }
  }, [propIsLoggedIn, propCurrentUser]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Conta</h2>
                  <p className="text-sm text-gray-600">Faça login para acessar sua conta</p>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <LogIn className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bem-vindo de volta!</h3>
                <p className="text-gray-600">Faça login para acessar sua conta</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Login</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Nome ou Email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-10 pr-12 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar
                </button>
              </form>

              {/* Link "Esqueci minha senha" removido por solicitação */}

              {loginError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{loginError}</p>
              </div>
              )}

              
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Conta</h2>
                <p className="text-sm text-gray-600">Gerenciar perfil e configurações</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </button>
          </div>
        </div>

        {/* Account Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Stats */}
          <div className="space-y-6">
            {/* Account Status */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-2 rounded-lg mr-3">
                  <Shield className="h-5 w-5 text-white" />
                  </div>
                <h3 className="text-lg font-semibold text-gray-900">Status da Conta</h3>
                </div>
              <div className="space-y-3">
                {currentUser?.role === 'admin' ? (
                  // Interface para Administrador
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Usuário Atual</span>
                      <span className="text-sm font-medium text-gray-900">
                        {currentUser?.name}
                      </span>
              </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tipo de Acesso</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        Administrador
                      </span>
                    </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Ativa
                  </span>
                    </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Último Login</span>
                  <span className="text-sm font-medium text-gray-900">
                        {currentUser?.lastLogin?.toLocaleDateString('pt-BR')} às {currentUser?.lastLogin?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Membro desde</span>
                  <span className="text-sm font-medium text-gray-900">
                        {currentUser?.createdAt.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Usuário do Sistema</span>
                        <span className="text-sm font-medium text-gray-900">
                          {(() => {
                            const userData = localStorage.getItem('JEACLOSET_user_data');
                            if (userData) {
                              const parsed = JSON.parse(userData);
                              return parsed.name;
                            }
                            // Buscar nome do Firebase (será atualizado dinamicamente)
                            return 'Usuário';
                          })()}
                        </span>
                    </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Último Acesso do Usuário</span>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {accessData.lastUserAccess 
                              ? `${accessData.lastUserAccess.toLocaleDateString('pt-BR')} às ${accessData.lastUserAccess.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                              : 'Nunca acessou'
                            }
                          </span>
                          {accessData.userDevice && (
                            <div className="text-xs text-blue-600">
                              📱 {accessData.userDevice} • {accessData.userLocation || 'Localização não disponível'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Interface para Usuário
                  <>
                <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Usuário</span>
                      <span className="text-sm font-medium text-gray-900">
                        {currentUser?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tipo de Acesso</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Usuário
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Ativa
                  </span>
                </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 p-2 rounded-lg mr-3">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
              </div>
              <div className="space-y-3">
                {/* Preferência: Ativar som */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Ativar som</p>
                    <p className="text-xs text-gray-500">Tocar sons em ações do sistema</p>
                  </div>
                  <button
                    aria-pressed={soundEnabled}
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      localStorage.setItem('JEACLOSET_sound_enabled', String(next));
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${soundEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    type="button"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
                {currentUser?.role === 'user' ? (
                  <button 
                    onClick={() => setShowChangePassword(true)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                  >
                    <KeyRound className="h-4 w-4 mr-2 text-gray-500" />
                    Alterar Senha
                  </button>
                ) : (
                  <button 
                    onClick={handleEditSelf}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                  >
                    <Edit3 className="h-4 w-4 mr-2 text-gray-500" />
                    Editar Minhas Informações
                  </button>
                )}
                {currentUser?.role === 'admin' && (
                <>
                <button 
                    onClick={handleEditUser}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                >
                    <Edit3 className="h-4 w-4 mr-2 text-gray-500" />
                    Editar Usuário
                </button>
                </>
                )}
                {currentUser?.role === 'admin' && (
                  <button 
                    onClick={() => setShowRestoreBackup(true)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2 text-gray-500" />
                    Restaurar Backup
                  </button>
                )}
                <button 
                  onClick={() => setShowPrivacy(true)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2 text-gray-500" />
                  Privacidade e Segurança
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Alterar Senha */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Alterar Senha</h3>
                  <button 
                    onClick={() => setShowChangePassword(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                <button 
                    onClick={() => setShowChangePassword(false)}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                  >
                    Alterar Senha
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Modal Alterar Senha (apenas para Usuário) */}
        {showChangePassword && currentUser?.role === 'user' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Alterar Senha</h3>
                  <button
                    onClick={() => setShowChangePassword(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    ℹ️ <strong>Informação:</strong> Para alterar seu nome de login, entre em contato com o administrador.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Digite sua senha atual"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Digite a nova senha"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Confirme a nova senha"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowChangePassword(false)}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                  >
                    Alterar Senha
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Próprias Informações (apenas para Admin) */}
        {showEditSelf && currentUser?.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">
                    Editar Minhas Informações
                  </h3>
                  <button
                    onClick={() => setShowEditSelf(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* USUÁRIO: Só pode alterar senha (nome não pode ser alterado) */}
                {currentUser?.role === 'user' ? (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-800">
                        ℹ️ <strong>Informação:</strong> Para alterar seu nome de login, entre em contato com o administrador.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Senha Atual <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={selfEditForm.currentPassword}
                        onChange={(e) => setSelfEditForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Digite sua senha atual"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        ⚠️ Obrigatório para alterar sua senha
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nova Senha <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={selfEditForm.newPassword}
                        onChange={(e) => setSelfEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Digite a nova senha"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Nova Senha <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={selfEditForm.confirmPassword}
                        onChange={(e) => setSelfEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Confirme a nova senha"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* ADMIN: Pode alterar nome e senha */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                  <input
                    type="text"
                    value={selfEditForm.name}
                    onChange={(e) => setSelfEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Nome do usuário"
                  />
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                      <input
                        type="password"
                        value={selfEditForm.currentPassword}
                        onChange={(e) => setSelfEditForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Opcional - apenas se quiser validar"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        👑 <strong>ADMIN:</strong> Pode alterar senha sem informar a atual (sua vontade prevalece)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                      <input
                        type="password"
                        value={selfEditForm.newPassword}
                        onChange={(e) => setSelfEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Deixe em branco se não quiser alterar"
                      />
                    </div>
                    {selfEditForm.newPassword && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        value={selfEditForm.confirmPassword}
                        onChange={(e) => setSelfEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Confirme a nova senha"
                      />
                    </div>
                    )}
                  </>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowEditSelf(false)}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveSelfEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Editar Usuário (apenas para Admin) */}
        {showEditUser && currentUser?.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">
                    Editar Usuário
                  </h3>
                  <button
                    onClick={() => setShowEditUser(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome (Login)</label>
                  <input
                    type="text"
                    value={userEditForm.name}
                    onChange={(e) => setUserEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Nome do usuário"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual (Vista pelo Admin)</label>
                  <input
                    type="text"
                    value={userEditForm.password}
                    onChange={(e) => setUserEditForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Senha atual do usuário"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    👑 <strong>ADMIN:</strong> Senha atual do usuário (mesmo que ele tenha mudado)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha (Controle Total do Admin)</label>
                  <input
                    type="password"
                    value={userEditForm.newPassword}
                    onChange={(e) => setUserEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Digite nova senha para FORÇAR alteração"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    👑 <strong>ADMIN:</strong> Sua vontade prevalece! Deixe em branco para manter a senha atual
                  </p>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowEditUser(false)}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveUserEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Notificações removido - não necessário para uso pessoal */}

        {/* Modal Privacidade e Segurança */}
        {showPrivacy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Privacidade e Segurança</h3>
                  <button
                    onClick={() => setShowPrivacy(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">✅ Sistema Seguro</h4>
                  <p className="text-sm text-green-700">Dados armazenados localmente no navegador com Firebase Firestore. Acesso protegido por login.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">🔒 Dados Privados</h4>
                  <p className="text-sm text-blue-700">Seus dados de negócio são mantidos privados. Apenas você tem acesso com suas credenciais.</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h4 className="font-medium text-emerald-900 mb-2">🔄 Backup Automático</h4>
                  <p className="text-sm text-emerald-700 mb-3">
                    Seus dados são automaticamente salvos no Google Drive. O backup ocorre periodicamente para garantir a segurança dos seus dados.
                  </p>
                  {currentUser?.role === 'admin' && (
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <label className="block text-sm font-medium text-emerald-900 mb-2">
                        Frequência de Backup
                      </label>
                      <select
                        value={backupFrequency}
                        onChange={(e) => {
                          const newFrequency = parseInt(e.target.value, 10);
                          setBackupFrequency(newFrequency);
                          localStorage.setItem('JEACLOSET_backup_frequency', newFrequency.toString());
                        }}
                        className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900"
                      >
                        <option value={1}>A cada 1 dia</option>
                        <option value={2}>A cada 2 dias</option>
                        <option value={3}>A cada 3 dias</option>
                        <option value={7}>A cada 7 dias</option>
                        <option value={14}>A cada 14 dias</option>
                        <option value={30}>A cada 30 dias</option>
                      </select>
                      <p className="text-xs text-emerald-600 mt-2">
                        O backup será executado automaticamente conforme a frequência escolhida ao abrir a aplicação.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowPrivacy(false)}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Feedback de Sucesso */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 text-center">
              <div className="text-6xl mb-4">
                {successType === 'name' ? '🎉' : 
                 successType === 'password' ? '🔐' : 
                 successType === 'user_updated' ? '👤' : 
                 successType === 'backup_restored' ? '🔄' : '✅'}
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                {successType === 'name' ? 'Nome Atualizado!' : 
                 successType === 'password' ? 'Senha Alterada!' :
                 successType === 'user_updated' ? 'Usuário Atualizado!' :
                 successType === 'backup_restored' ? 'Backup Restaurado!' : 'Sucesso!'}
              </h3>
              <p className="text-gray-600 mb-6">
                {successType === 'name' 
                  ? 'Seu nome de usuário foi atualizado com sucesso!' 
                  : successType === 'password'
                  ? 'Sua senha foi alterada com sucesso!'
                  : successType === 'user_updated'
                  ? 'Os dados do usuário foram atualizados com sucesso!'
                  : successType === 'backup_restored'
                  ? 'Backup restaurado com sucesso! A página será recarregada automaticamente...'
                  : 'Operação realizada com sucesso!'
                }
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => {
                    setShowSuccess(false);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-all duration-200"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Restaurar Backup (apenas Admin) */}
        {showRestoreBackup && currentUser?.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Restaurar Backup</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowRestoreBackup(false);
                      handleCancelRestore();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>📥 Selecione o arquivo JSON do backup</strong> para restaurar seus dados.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arquivo de Backup (JSON)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    disabled={restoreLoading || showConfirmRestore}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Arquivo deve ser um JSON exportado do sistema JEACLOSET
                  </p>
                </div>

                {restoreLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-sm text-gray-600">Restaurando backup...</span>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRestoreBackup(false);
                      handleCancelRestore();
                    }}
                    disabled={restoreLoading}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Restauração */}
        {showConfirmRestore && currentUser?.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b-2 border-red-200">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-xl mr-4">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Confirmação Necessária</h3>
                    <p className="text-sm text-gray-600 mt-1">Operação irreversível</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                  <div className="flex items-start">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-red-900 text-lg mb-2">
                        ⚠️ ATENÇÃO: Esta ação vai SOBRESCREVER todos os dados atuais!
                      </p>
                      <p className="text-red-800 text-sm mb-3">
                        Todos os dados existentes no Firebase serão <strong>perdidos permanentemente</strong> e substituídos pelos dados do backup.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">O que será restaurado:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {backupFileData && (
                      <>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          <strong>Usuários:</strong> {backupFileData.collections?.users?.length || 0} documento(s)
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <strong>Peças:</strong> {backupFileData.collections?.clothing?.length || 0} documento(s)
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          <strong>Vendas:</strong> {backupFileData.collections?.sales?.length || 0} documento(s)
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                          <strong>Fluxo de Caixa:</strong> {backupFileData.collections?.fluxo?.length || 0} documento(s)
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                          <strong>Anotações:</strong> {backupFileData.collections?.notes?.length || 0} documento(s)
                        </li>
                        <li className="flex items-center">
                          <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                          <strong>Investimentos:</strong> {backupFileData.collections?.investments?.length || 0} documento(s)
                        </li>
                      </>
                    )}
                  </ul>
                  {backupFileData?.exportDate && (
                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
                      📅 Backup criado em: {new Date(backupFileData.exportDate).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>🔒 Esta ação não pode ser desfeita.</strong> Certifique-se de que este é o backup correto antes de continuar.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={handleCancelRestore}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmRestore}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-200 font-bold shadow-lg"
                  >
                    Confirmar Restauração
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Feedback de Erro */}
        {showError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 text-center">
              <div className="text-6xl mb-4">
                {errorType === 'password_incorrect' ? '🔒' : 
                 errorType === 'password_mismatch' ? '⚠️' :
                 errorType === 'user_save_error' ? '❌' :
                 errorType === 'user_fields_required' ? '📝' :
                 errorType === 'backup_restore_error' ? '🔄' : '⚠️'}
              </div>
              <h3 className="text-2xl font-bold text-red-600 mb-2">
                {errorType === 'password_incorrect' ? 'Senha Incorreta!' : 
                 errorType === 'password_mismatch' ? 'Senhas Não Coincidem!' :
                 errorType === 'user_save_error' ? 'Erro ao Salvar!' :
                 errorType === 'user_fields_required' ? 'Campos Obrigatórios!' :
                 errorType === 'backup_restore_error' ? 'Erro ao Restaurar Backup!' : 'Erro!'}
              </h3>
              <p className="text-gray-600 mb-6">
                {errorType === 'password_incorrect' 
                  ? 'A senha atual informada está incorreta. Verifique e tente novamente.' 
                  : errorType === 'password_mismatch'
                  ? 'As senhas digitadas não são iguais. Verifique e tente novamente.'
                  : errorType === 'user_save_error'
                  ? 'Erro ao salvar dados do usuário. Verifique sua conexão e tente novamente.'
                  : errorType === 'user_fields_required'
                  ? 'Preencha todos os campos obrigatórios para continuar.'
                  : errorType === 'backup_restore_error'
                  ? 'Erro ao restaurar backup. Verifique se o arquivo é válido e tente novamente.'
                  : 'Ocorreu um erro inesperado. Tente novamente.'
                }
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={() => {
                    setShowError(false);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-all duration-200"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}