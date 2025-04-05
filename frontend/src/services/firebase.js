import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyChNSHOnz_qZlkFCL6YjnjGcoF7jYn5sR0",
  authDomain: "agroconnect-6f606.firebaseapp.com",
  projectId: "agroconnect-6f606",
  storageBucket: "agroconnect-6f606.appspot.com",
  messagingSenderId: "263678045055",
  appId: "1:263678045055:web:4b54a1e8a9411e6cee484a"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Configurar Firestore com cache ilimitado
const db = getFirestore(app);

// Configurar cache size
try {
  db.settings({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  });
} catch (error) {
  console.error('Erro ao configurar Firestore settings:', error);
}

// Habilitar persistência offline para Firestore
try {
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('A persistência offline só pode ser habilitada em uma aba por vez');
      } else if (err.code === 'unimplemented') {
        console.warn('O navegador atual não suporta persistência offline');
      } else {
        console.error('Erro ao habilitar persistência offline:', err);
      }
    });
} catch (error) {
  console.error('Erro ao configurar persistência offline:', error);
}

// Inicializar Auth com persistência AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Exportar serviços inicializados
export { db, auth };
