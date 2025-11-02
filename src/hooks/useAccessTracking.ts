import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AccessData {
  lastUserAccess: Date | null;
  lastViewerAccess: Date | null;
  userDevice: string | null;
  viewerDevice: string | null;
  userLocation: string | null;
  viewerLocation: string | null;
}

interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  userAgent: string;
  platform: string;
}

export const useAccessTracking = () => {
  const [accessData, setAccessData] = useState<AccessData>({
    lastUserAccess: null,
    lastViewerAccess: null,
    userDevice: null,
    viewerDevice: null,
    userLocation: null,
    viewerLocation: null
  });

  // Detectar tipo de dispositivo
  const getDeviceInfo = (): DeviceInfo => {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Tablet)|Windows(?=.*Touch)/i.test(userAgent);
    
    let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (isTablet) type = 'tablet';
    else if (isMobile) type = 'mobile';

    // Detectar sistema operacional
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return {
      type,
      userAgent: `${os} • ${navigator.platform}`,
      platform: navigator.platform
    };
  };

  // Obter localização aproximada (sem precisão exata por privacidade)
  const getLocationInfo = (): string => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const country = Intl.DateTimeFormat().resolvedOptions().locale;
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const offsetHours = Math.abs(offset) / 60;
      const offsetSign = offset <= 0 ? '+' : '-';
      
      return `${timezone} (UTC${offsetSign}${offsetHours}) • ${country}`;
    } catch {
      return 'Localização não disponível';
    }
  };

  // Registrar acesso no Firebase
  const trackAccess = async (userRole: 'user' | 'viewer' | 'admin') => {
    try {
      const deviceInfo = getDeviceInfo();
      const locationInfo = getLocationInfo();
      const timestamp = new Date();

      // Atualizar no Firebase - usando coleção users para evitar problemas de permissão
      const accessRef = doc(db, 'users', 'accessTracking');
      
      if (userRole === 'user') {
        await setDoc(accessRef, {
          lastUserAccess: serverTimestamp(),
          userDevice: deviceInfo.type,
          userLocation: locationInfo,
          userPlatform: deviceInfo.platform,
          userTimestamp: timestamp.toISOString()
        }, { merge: true });
      } else if (userRole === 'viewer') {
        await setDoc(accessRef, {
          lastViewerAccess: serverTimestamp(),
          viewerDevice: deviceInfo.type,
          viewerLocation: locationInfo,
          viewerPlatform: deviceInfo.platform,
          viewerTimestamp: timestamp.toISOString()
        }, { merge: true });
      } else if (userRole === 'admin') {
        await setDoc(accessRef, {
          lastAdminAccess: serverTimestamp(),
          adminDevice: deviceInfo.type,
          adminLocation: locationInfo,
          adminPlatform: deviceInfo.platform,
          adminTimestamp: timestamp.toISOString()
        }, { merge: true });
      }

      console.log('✅ Acesso registrado no Firebase:', {
        role: userRole,
        device: deviceInfo.type,
        location: locationInfo
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao registrar acesso no Firebase:', error);
      return false;
    }
  };

  // Buscar dados de acesso do Firebase
  const fetchAccessData = async () => {
    try {
      const accessRef = doc(db, 'users', 'accessTracking');
      const docSnap = await getDoc(accessRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        setAccessData({
          lastUserAccess: data.userTimestamp ? new Date(data.userTimestamp) : null,
          lastViewerAccess: data.viewerTimestamp ? new Date(data.viewerTimestamp) : null,
          userDevice: data.userDevice || null,
          viewerDevice: data.viewerDevice || null,
          userLocation: data.userLocation || null,
          viewerLocation: data.viewerLocation || null
        });

        console.log('✅ Dados de acesso carregados do Firebase:', {
          userAccess: data.userTimestamp ? new Date(data.userTimestamp).toLocaleString('pt-BR') : 'Nunca',
          viewerAccess: data.viewerTimestamp ? new Date(data.viewerTimestamp).toLocaleString('pt-BR') : 'Nunca',
          userDevice: data.userDevice || 'N/A',
          viewerDevice: data.viewerDevice || 'N/A'
        });

        return true;
      } else {
        console.log('⚠️ Nenhum dado de acesso encontrado no Firebase');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados de acesso:', error);
      return false;
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    fetchAccessData();
  }, []);

  return {
    accessData,
    trackAccess,
    fetchAccessData,
    getDeviceInfo
  };
};
