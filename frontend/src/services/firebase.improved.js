import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChNSHOnz_qZlkFCL6YjnjGcoF7jYn5sR0",
  authDomain: "agroconnect-6f606.firebaseapp.com",
  projectId: "agroconnect-6f606",
  storageBucket: "agroconnect-6f606.appspot.com", // Corrigido para o formato padrão
  messagingSenderId: "263678045055",
  appId: "1:263678045055:web:4b54a1e8a9411e6cee484a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Configure Firestore
const db = getFirestore(app);

// Configure cache size
try {
  db.settings({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  });
  
  // Enable offline persistence
  enableIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Offline persistence can only be enabled in one tab at a time');
      } else if (err.code === 'unimplemented') {
        console.warn('Current browser does not support offline persistence');
      } else {
        console.error('Error enabling offline persistence:', err);
      }
    });
} catch (error) {
  console.error('Error configuring Firestore settings:', error);
}

// Initialize Auth
const auth = getAuth(app);

// Export initialized services
export { db, auth };
