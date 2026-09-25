import { getApp, getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCAQGA1kp_GAYIIDZODwCzw9zLU6psL1IU',
  authDomain: 'controlefinanceiro-5c8a1.firebaseapp.com',
  projectId: 'controlefinanceiro-5c8a1',
  storageBucket: 'controlefinanceiro-5c8a1.firebasestorage.app',
  messagingSenderId: '1086106048819',
  appId: '1:1086106048819:web:5643147987615a7ef74646',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export async function configureAuthPersistence(): Promise<void> {
  await setPersistence(auth, browserLocalPersistence);
}

export function userDataPath(uid: string): string {
  return `usuarios/${uid}/dados/principal`;
}
