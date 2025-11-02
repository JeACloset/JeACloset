import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Configuração do Firebase
// IMPORTANTE: Substitua estas configurações pelas suas próprias do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAb4W3SdcbHVagLMGlQyGXZxQjaU1qzvoM",
  authDomain: "jeacloset-c0ab8.firebaseapp.com",
  projectId: "jeacloset-c0ab8",
  storageBucket: "jeacloset-c0ab8.firebasestorage.app",
  messagingSenderId: "552103677385",
  appId: "1:552103677385:web:e869064fe3301815576c18"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
