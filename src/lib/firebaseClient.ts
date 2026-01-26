// src/lib/firebaseClient.ts
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!, // ✅ RTDB
};

export function getClientApp() {
  if (getApps().length) return getApps()[0]!;
  return initializeApp(firebaseConfig);
}

export function rtdbClient() {
  return getDatabase(getClientApp());
}
