// Configuração do Google Drive API - ARQUIVO DE EXEMPLO
// Copie este arquivo para driveConfig.ts e preencha com suas credenciais

export const driveConfig = {
  clientId: 'SEU_CLIENT_ID_AQUI.apps.googleusercontent.com',
  clientSecret: 'SEU_CLIENT_SECRET_AQUI',
  redirectUri: 'https://jeacloset.netlify.app',
  scopes: ['https://www.googleapis.com/auth/drive.file'], // Permissão para criar/editar arquivos
  folderName: 'JEACLOSET-Backups', // Nome da pasta no Drive
  backupIntervalDays: 3 // Frequência de backup em dias
};

