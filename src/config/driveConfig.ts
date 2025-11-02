// Configuração do Google Drive API
// IMPORTANTE: Mantenha este arquivo seguro e não compartilhe o client_secret publicamente

export const driveConfig = {
  clientId: '366840202972-8bqjiiavdjaisn7oqmpkl0csi93eqjp3.apps.googleusercontent.com',
  clientSecret: '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',
  redirectUri: window.location.origin + '/drive-auth-callback.html', // Usa a origem atual
  scopes: ['https://www.googleapis.com/auth/drive.file'], // Permissão para criar/editar arquivos
  folderName: 'JEACLOSET-Backups', // Nome da pasta no Drive
  defaultBackupIntervalDays: 3 // Frequência padrão de backup em dias
};

// Função para obter a frequência de backup configurada pelo admin
export const getBackupIntervalDays = (): number => {
  try {
    const savedFrequency = localStorage.getItem('JEACLOSET_backup_frequency');
    if (savedFrequency) {
      const frequency = parseInt(savedFrequency, 10);
      // Validar que é um número válido entre 1 e 365
      if (frequency >= 1 && frequency <= 365) {
        return frequency;
      }
    }
  } catch (error) {
    console.error('Erro ao ler frequência de backup:', error);
  }
  // Retornar padrão se não houver configuração ou erro
  return driveConfig.defaultBackupIntervalDays;
};

