// lib/firebaseConfig.ts
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyByfuJnn1JH2Aza-RcKbyQlaiosC8RsxYM",
  authDomain:        "electricitymonitor-cacc8.firebaseapp.com",
  projectId:         "electricitymonitor-cacc8",
  storageBucket:     "electricitymonitor-cacc8.firebasestorage.app",
  messagingSenderId: "896699393259",
  appId:             "1:896699393209:web:f86827d93620782a722768",
  databaseURL:       "https://electricitymonitor-cacc8-default-rtdb.firebaseio.com",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db   = getDatabase(app);