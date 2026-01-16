// src/lib/firebaseAdmin.ts
import admin from "firebase-admin";

function getAdminCreds() {
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) throw new Error("Missing FIREBASE_ADMIN_CREDENTIALS env var");
  const parsed = JSON.parse(raw);

  // Firebase espera newlines reales en private_key
  parsed.private_key = parsed.private_key?.replace(/\\n/g, "\n");
  return parsed;
}

export function getAdminApp() {
  if (admin.apps.length > 0) return admin.app();


	admin.initializeApp({
    credential: admin.credential.cert(getAdminCreds()),
  });

  return admin.app();
}

export function db() {
  getAdminApp();
  return admin.firestore();
}

export const FieldValue = admin.firestore.FieldValue;