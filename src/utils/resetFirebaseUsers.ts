/**
 * Script para resetar completamente os usuários no Firebase
 * Remove todos os usuários antigos e cria novos com credenciais atualizadas
 * 
 * Para usar: Importe e chame resetAllUsers() no console do navegador ou adicione um botão
 */

import { resetUsers } from './initializeUsers';

/**
 * Função para resetar todos os usuários no Firebase
 * Remove usuários antigos (incluindo "kayla") e cria novos
 */
export const resetAllUsers = async () => {
  try {
    console.log('🔄 Iniciando reset completo de usuários...');
    await resetUsers();
    console.log('✅ Reset completo! Agora você pode fazer login com:');
    console.log('   Admin: admin@JEACLOSET.com / admin2024');
    console.log('   User: user@JEACLOSET.com / user2024');
    alert('Usuários resetados com sucesso!\n\nAdmin: admin2024\nUser: user2024');
    return true;
  } catch (error) {
    console.error('❌ Erro ao resetar usuários:', error);
    alert('Erro ao resetar usuários. Verifique o console.');
    return false;
  }
};

// Expor globalmente para facilitar chamada no console
if (typeof window !== 'undefined') {
  (window as any).resetFirebaseUsers = resetAllUsers;
  console.log('💡 Para resetar usuários manualmente, execute: resetFirebaseUsers()');
}

