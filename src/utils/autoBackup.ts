import { exportAllCollections, shouldCreateBackup, setLastBackupDate } from './backupService';
import { saveBackupToDrive } from './driveService';

// Função principal para verificar e fazer backup automático
export const checkAndCreateBackup = async (): Promise<void> => {
  try {
    // Verificar se precisa fazer backup
    if (!shouldCreateBackup()) {
      console.log('ℹ️ Backup ainda não necessário');
      return;
    }

    console.log('🔄 Iniciando backup automático...');

    // Exportar todas as coleções
    const backupData = await exportAllCollections();

    // Salvar no Google Drive (sem precisar inicializar gapi)
    const success = await saveBackupToDrive(backupData);

    if (success) {
      // Salvar data do último backup
      setLastBackupDate();
      console.log('✅ Backup automático concluído com sucesso!');
    } else {
      console.error('❌ Falha ao salvar backup no Google Drive');
    }
  } catch (error) {
    console.error('❌ Erro no processo de backup automático:', error);
  }
};

