import { driveConfig } from '../config/driveConfig';

// Interface para resposta do Google Drive API
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

// Armazenar token de acesso
let accessToken: string | null = null;

// Obter token do localStorage se existir
const getStoredToken = (): string | null => {
  try {
    const stored = localStorage.getItem('JEACLOSET_drive_token');
    if (stored) {
      const tokenData = JSON.parse(stored);
      // Verificar se token ainda é válido (não expirou)
      if (tokenData.expiresAt && new Date(tokenData.expiresAt) > new Date()) {
        return tokenData.accessToken;
      }
    }
  } catch (error) {
    console.error('Erro ao ler token armazenado:', error);
  }
  return null;
};

// Salvar token no localStorage
const saveToken = (token: string, expiresIn: number = 3600): void => {
  try {
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    localStorage.setItem('JEACLOSET_drive_token', JSON.stringify({
      accessToken: token,
      expiresAt: expiresAt.toISOString()
    }));
  } catch (error) {
    console.error('Erro ao salvar token:', error);
  }
};

// Autenticar usuário via OAuth 2.0 (sem iframe)
export const authenticateUser = async (): Promise<string | null> => {
  try {
    // Verificar se já tem token válido
    const storedToken = getStoredToken();
    if (storedToken) {
      console.log('✅ Usando token armazenado');
      return storedToken;
    }

    // Solicitar novo token via popup
    console.log('🔐 Solicitando autenticação do Google Drive...');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(driveConfig.clientId)}` +
      `&redirect_uri=${encodeURIComponent(driveConfig.redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(driveConfig.scopes.join(' '))}` +
      `&include_granted_scopes=true`;

    // Abrir popup para autenticação
    const width = 500;
    const height = 600;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;

    return new Promise((resolve) => {
      const popup = window.open(
        authUrl,
        'Google Drive Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        console.error('❌ Popup bloqueado. Por favor, permita popups para este site.');
        resolve(null);
        return;
      }

      // Monitorar quando popup fecha ou recebe token
      const checkInterval = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkInterval);
            if (!accessToken) {
              console.warn('⚠️ Autenticação cancelada pelo usuário');
              resolve(null);
            }
            return;
          }

          // Tentar ler token da URL do popup (se redirecionou)
          // Nota: Isso requer que o popup redirecione para nossa página
        } catch (error) {
          // Ignorar erros de cross-origin
        }
      }, 500);

      // Listener para mensagens do popup
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_DRIVE_TOKEN') {
          accessToken = event.data.token;
          const expiresIn = event.data.expiresIn || 3600;
          saveToken(accessToken, expiresIn);
          clearInterval(checkInterval);
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve(accessToken);
        }
      };

      window.addEventListener('message', messageListener);

      // Timeout após 5 minutos
      setTimeout(() => {
        if (!accessToken) {
          clearInterval(checkInterval);
          window.removeEventListener('message', messageListener);
          popup.close();
          console.error('❌ Timeout na autenticação');
          resolve(null);
        }
      }, 300000);
    });
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return null;
  }
};

// Inicializar (não precisa mais)
export const initializeGapi = async (): Promise<boolean> => {
  // Método simplificado - apenas verifica token
  const token = getStoredToken();
  return token !== null;
};

// Salvar backup no Google Drive
export const saveBackupToDrive = async (backupData: any): Promise<boolean> => {
  try {
    console.log('☁️ Iniciando salvamento no Google Drive...');

    // Autenticar e obter token (sem depender do gapi)
    const accessToken = await authenticateUser();
    if (!accessToken) {
      console.error('❌ Falha na autenticação do Google Drive');
      return false;
    }

    // Criar nome do arquivo com data/hora
    const now = new Date();
    const fileName = `JEACLOSET-backup-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.json`;

    // Converter dados para JSON
    const jsonContent = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });

    // Encontrar ou criar pasta usando a API REST
    let folderId = null;
    try {
      // Buscar pasta existente
      const folderSearchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(driveConfig.folderName)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (folderSearchResponse.ok) {
        const folderData = await folderSearchResponse.json();
        if (folderData.files && folderData.files.length > 0) {
          folderId = folderData.files[0].id;
        } else {
          // Criar pasta
          const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: driveConfig.folderName,
              mimeType: 'application/vnd.google-apps.folder'
            })
          });

          if (createFolderResponse.ok) {
            const folder = await createFolderResponse.json();
            folderId = folder.id;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro ao criar/buscar pasta, continuando sem pasta:', error);
    }

    // Upload do arquivo
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      ...(folderId && { parents: [folderId] })
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: form
    });

    if (uploadResponse.ok) {
      const file = await uploadResponse.json();
      console.log('✅ Backup salvo no Google Drive:', file.name);
      return true;
    } else {
      const errorText = await uploadResponse.text();
      console.error('❌ Erro ao fazer upload:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao salvar backup no Drive:', error);
    return false;
  }
};

// Declaração global do gapi
declare global {
  interface Window {
    gapi: any;
  }
}

