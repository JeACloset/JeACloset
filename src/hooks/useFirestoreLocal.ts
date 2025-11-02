import { useState, useEffect } from 'react';

// Hook alternativo que usa localStorage para desenvolvimento
// Use este hook temporariamente se houver problemas com o Firebase
export function useFirestoreLocal<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`firestore_${collectionName}`);
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch (err) {
      setError('Erro ao carregar dados locais');
    }
  }, [collectionName]);

  // Adicionar documento
  const add = async (item: Omit<T, 'id'>): Promise<string | null> => {
    try {
      const newItem = {
        id: Date.now().toString(),
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      } as T;
      
      const newData = [...data, newItem];
      setData(newData);
      localStorage.setItem(`firestore_${collectionName}`, JSON.stringify(newData));
      return (newItem as any).id;
    } catch (err) {
      setError('Erro ao adicionar documento');
      return null;
    }
  };

  // Atualizar documento
  const update = async (id: string, updates: Partial<T>): Promise<boolean> => {
    try {
      const newData = data.map(item => 
        (item as any).id === id 
          ? { ...item, ...updates, updatedAt: new Date() }
          : item
      );
      setData(newData);
      localStorage.setItem(`firestore_${collectionName}`, JSON.stringify(newData));
      return true;
    } catch (err) {
      setError('Erro ao atualizar documento');
      return false;
    }
  };

  // Deletar documento
  const remove = async (id: string): Promise<boolean> => {
    try {
      const newData = data.filter(item => (item as any).id !== id);
      setData(newData);
      localStorage.setItem(`firestore_${collectionName}`, JSON.stringify(newData));
      return true;
    } catch (err) {
      setError('Erro ao deletar documento');
      return false;
    }
  };

  return {
    data,
    loading,
    error,
    add,
    update,
    remove
  };
}
