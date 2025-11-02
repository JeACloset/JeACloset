export async function prefetchFirestoreCollections(collectionNames: string[]) {
  try {
    const [{ collection, getDocs }, { db }] = await Promise.all([
      import('firebase/firestore'),
      import('../config/firebase')
    ]);

    const tasks = collectionNames.map(async (name) => {
      try {
        const snap = await getDocs(collection(db, name));
        const data: any[] = [];
        snap.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        try {
          localStorage.setItem(`JEACLOSET_cache_${name}`, JSON.stringify(data));
          localStorage.setItem(`JEACLOSET_cache_time_${name}`, Date.now().toString());
        } catch {}
      } catch {}
    });

    await Promise.allSettled(tasks);
  } catch {
    // silencioso: prefetch é melhor-esforço
  }
}


