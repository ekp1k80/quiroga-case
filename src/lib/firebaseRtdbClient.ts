// src/lib/firebaseRtdbClient.ts
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

function getFirebaseApp() {
  if (getApps().length) return getApps()[0];

  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  });
}

export const rtdbClient = getDatabase(getFirebaseApp());
