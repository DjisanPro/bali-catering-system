import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || appletConfig.apiKey || '',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || '',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || '',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || '',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || '',
  appId: metaEnv.VITE_FIREBASE_APP_ID || appletConfig.appId || '',
};

const databaseId = appletConfig.firestoreDatabaseId || '(default)';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  if (!isFirebaseConfigured()) return null;

  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return app;
  } catch (err) {
    console.warn('Firebase initialization skipped: credentials pending configuration', err);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  const currentApp = getFirebaseApp();
  if (!currentApp) return null;
  auth = getAuth(currentApp);
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  if (db) return db;
  const currentApp = getFirebaseApp();
  if (!currentApp) return null;

  try {
    if (databaseId && databaseId !== '(default)') {
      db = getFirestore(currentApp, databaseId);
    } else {
      db = getFirestore(currentApp);
    }
    return db;
  } catch (e) {
    console.warn('Fallback to default firestore database', e);
    db = getFirestore(currentApp);
    return db;
  }
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (storage) return storage;
  const currentApp = getFirebaseApp();
  if (!currentApp) return null;
  storage = getStorage(currentApp);
  return storage;
}

// Connectivity test as required by Firebase integration guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  const firestore = getFirebaseFirestore();
  if (!firestore) return false;

  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client is currently offline.');
      return false;
    }
    // Document not found is fine, it proves connection was established
    return true;
  }
}
