import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getBackupIntervalDays } from '../config/driveConfig';

// Tipos para o backup
interface BackupData {
  exportDate: string;
  version: string;
  collections: {
    users: any[];
    clothing: any[];
    sales: any[];
    fluxo: any[];
    notes: any[];
    investments: any[];
  };
}

// Converter Timestamp do Firebase para Date (serializável)
const convertTimestamps = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj && typeof obj === 'object' && obj.toDate) {
    return obj.toDate().toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertTimestamps);
  }
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertTimestamps(obj[key]);
    }
    return converted;
  }
  return obj;
};

// Função para exportar todas as coleções do Firebase
export const exportAllCollections = async (): Promise<BackupData> => {
  console.log('📦 Iniciando exportação de dados...');

  const collections = {
    users: [],
    clothing: [],
    sales: [],
    fluxo: [],
    notes: [],
    investments: []
  };

  // Exportar cada coleção
  for (const collectionName of Object.keys(collections) as Array<keyof typeof collections>) {
    try {
      console.log(`📥 Exportando coleção: ${collectionName}`);
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data: any[] = [];
      
      querySnapshot.forEach((doc) => {
        const docData = convertTimestamps(doc.data());
        data.push({
          id: doc.id,
          ...docData
        });
      });

      collections[collectionName] = data;
      console.log(`✅ ${collectionName}: ${data.length} documentos exportados`);
    } catch (error) {
      console.error(`❌ Erro ao exportar ${collectionName}:`, error);
      collections[collectionName] = [];
    }
  }

  const backupData: BackupData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    collections
  };

  console.log('✅ Exportação completa!');
  return backupData;
};

// Verificar última data de backup
export const getLastBackupDate = (): Date | null => {
  try {
    const lastBackup = localStorage.getItem('JEACLOSET_last_backup_date');
    if (lastBackup) {
      return new Date(lastBackup);
    }
  } catch (error) {
    console.error('Erro ao ler última data de backup:', error);
  }
  return null;
};

// Salvar data do último backup
export const setLastBackupDate = (): void => {
  try {
    localStorage.setItem('JEACLOSET_last_backup_date', new Date().toISOString());
  } catch (error) {
    console.error('Erro ao salvar data de backup:', error);
  }
};

// Verificar se precisa fazer backup (passou X dias conforme configuração)
export const shouldCreateBackup = (): boolean => {
  const lastBackup = getLastBackupDate();
  if (!lastBackup) {
    return true; // Nunca fez backup
  }

  // Obter frequência configurada pelo admin (ou padrão)
  const backupIntervalDays = getBackupIntervalDays();

  const daysSinceLastBackup = Math.floor(
    (new Date().getTime() - lastBackup.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceLastBackup >= backupIntervalDays;
};

// Converter strings ISO de volta para Date
const convertISOToDate = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
    // É uma data ISO string
    return new Date(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertISOToDate);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertISOToDate(obj[key]);
    }
    return converted;
  }
  
  return obj;
};

// Função para restaurar backup no Firebase
export const restoreBackup = async (backupData: BackupData): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    console.log('🔄 Iniciando restauração de backup...');
    
    // Validar estrutura do backup
    if (!backupData || !backupData.collections) {
      throw new Error('Arquivo de backup inválido: estrutura incorreta');
    }
    
    const { db } = await import('../config/firebase');
    const { collection, doc, setDoc, deleteDoc, getDocs } = await import('firebase/firestore');
    
    const results: any = {
      users: { restored: 0, errors: 0 },
      clothing: { restored: 0, errors: 0 },
      sales: { restored: 0, errors: 0 },
      fluxo: { restored: 0, errors: 0 },
      notes: { restored: 0, errors: 0 },
      investments: { restored: 0, errors: 0 }
    };
    
    // Restaurar cada coleção
    for (const collectionName of Object.keys(backupData.collections) as Array<keyof typeof backupData.collections>) {
      try {
        const data = backupData.collections[collectionName];
        
        if (!Array.isArray(data)) {
          console.warn(`⚠️ ${collectionName}: dados não são um array, pulando...`);
          continue;
        }
        
        console.log(`📥 Restaurando coleção: ${collectionName} (${data.length} documentos)`);
        
        // Para cada documento na coleção
        for (const item of data) {
          try {
            // Extrair ID do documento
            const itemId = item.id;
            if (!itemId) {
              console.warn(`⚠️ ${collectionName}: item sem ID, pulando...`);
              continue;
            }
            
            // Remover ID dos dados (será usado como ID do documento)
            const { id, ...itemData } = item;
            
            // Converter datas ISO de volta para Date
            const convertedData = convertISOToDate(itemData);
            
            // Restaurar documento no Firebase preservando ID original
            await setDoc(doc(db, collectionName, itemId), convertedData, { merge: false });
            
            results[collectionName].restored++;
          } catch (error) {
            console.error(`❌ Erro ao restaurar item em ${collectionName}:`, error);
            results[collectionName].errors++;
          }
        }
        
        console.log(`✅ ${collectionName}: ${results[collectionName].restored} documentos restaurados`);
      } catch (error) {
        console.error(`❌ Erro ao restaurar coleção ${collectionName}:`, error);
        results[collectionName].errors = data?.length || 0;
      }
    }
    
    // Calcular total
    const totalRestored = Object.values(results).reduce((sum: number, r: any) => sum + r.restored, 0);
    const totalErrors = Object.values(results).reduce((sum: number, r: any) => sum + r.errors, 0);
    
    console.log(`✅ Restauração completa! ${totalRestored} documentos restaurados, ${totalErrors} erros`);
    
    return {
      success: totalErrors === 0,
      message: totalErrors === 0 
        ? `✅ Backup restaurado com sucesso! ${totalRestored} documentos recuperados.`
        : `⚠️ Restauração concluída com avisos. ${totalRestored} documentos restaurados, ${totalErrors} erros.`,
      details: results
    };
  } catch (error) {
    console.error('❌ Erro na restauração:', error);
    return {
      success: false,
      message: `❌ Erro ao restaurar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
};

