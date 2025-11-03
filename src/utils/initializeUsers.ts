import { collection, addDoc, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Novas credenciais do sistema (sem referências a kayla)
const DEFAULT_USERS = [
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

// Função para limpar e recriar usuários (remove antigos e cria novos)
export const resetUsers = async () => {
  try {
    console.log('🔄 Resetando usuários no Firebase...');
    
    // Buscar todos os usuários existentes
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    // Remover todos os usuários existentes (incluindo os antigos com "kayla")
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      // Remover especialmente usuários com nome "kayla" ou emails antigos
      if (userData.name === 'kayla' || userData.email === 'user@JEACLOSET.com' || userData.email === 'admin@JEACLOSET.com') {
        console.log(`🗑️ Removendo usuário antigo: ${userData.name} (${userData.email})`);
        await deleteDoc(doc(db, 'users', userDoc.id));
      }
    }
    
    console.log('✅ Usuários antigos removidos');
    
    // Criar novos usuários
    for (const user of DEFAULT_USERS) {
      console.log(`➕ Criando novo usuário: ${user.name}`);
      await addDoc(collection(db, 'users'), {
        ...user,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log('✅ Novos usuários criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao resetar usuários:', error);
    throw error;
  }
};

// Função para inicializar usuários no Firebase (cria se não existir, atualiza se existir)
export const initializeUsers = async () => {
  try {
    console.log('Inicializando usuários no Firebase...');
    
    // Verificar se já existem usuários
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const existingUsers = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        name: data.name as string | undefined,
        email: data.email as string | undefined,
        ...data 
      };
    });
    
    console.log('Usuários existentes no Firebase:', existingUsers.length, 'usuários');
    
    // Verificar se há usuários com nome "kayla" e remover
    const kaylaUsers = existingUsers.filter((u) => u.name === 'kayla' || u.name?.toLowerCase() === 'kayla');
    if (kaylaUsers.length > 0) {
      console.log(`🗑️ Removendo ${kaylaUsers.length} usuário(s) com nome "kayla"...`);
      for (const kaylaUser of kaylaUsers) {
        await deleteDoc(doc(db, 'users', kaylaUser.id));
        console.log(`   Removido: ${kaylaUser.name || 'N/A'} (${kaylaUser.email || 'N/A'})`);
      }
    }
    
    // IMPORTANTE: Apenas criar usuários padrão se NÃO existirem
    // NÃO atualizar/sobrescrever usuários existentes (respeitar alterações do usuário)
    for (const user of DEFAULT_USERS) {
      // Buscar por email (case-insensitive) ou por nome se email corresponder
      const existingUser = existingUsers.find((u) => {
        const emailMatch = u.email?.toLowerCase() === user.email.toLowerCase();
        const isKayla = u.name === 'kayla' || u.name?.toLowerCase() === 'kayla';
        return emailMatch && !isKayla;
      });
      
      if (!existingUser) {
        // Apenas criar se não existir - NUNCA sobrescrever
        console.log(`➕ Criando usuário padrão: ${user.name} (${user.email})`);
        await addDoc(collection(db, 'users'), {
          ...user,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Usuário já existe - NÃO atualizar para respeitar alterações do usuário
        console.log(`ℹ️ Usuário ${existingUser.name || user.name} já existe - mantendo dados atuais (não sobrescrevendo)`);
        console.log(`   Email: ${existingUser.email || user.email}`);
      }
    }
    
    console.log('✅ Usuários inicializados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar usuários:', error);
  }
};

// Função para verificar se um usuário existe
export const checkUserExists = async (email: string) => {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return false;
  }
};
