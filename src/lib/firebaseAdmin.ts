// src/lib/firebaseAdmin.ts
import admin from "firebase-admin";

const ServiceAccount = require("@/firebase-admin-sdk.json");

export function getAdminApp() {
  if (admin.apps.length > 0) return admin.app();

  const projectId =
    process.env.FIREBASE_CONFIG_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;

  admin.initializeApp({
    credential: admin.credential.cert(ServiceAccount),
    projectId,
  });

  return admin.app();
}

export function db() {
  getAdminApp();
  return admin.firestore();
}

export const FieldValue = admin.firestore.FieldValue;