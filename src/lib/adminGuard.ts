// src/lib/adminGuard.ts
import { headers } from "next/headers";

export async function  assertLocalAdmin() {
  // 1) Solo en dev/local (recomendado)
  const mustBeLocal = process.env.ADMIN_LOCAL_ONLY === "1";

  if (process.env.NODE_ENV === "production") {
    // En prod, solo dejalo si explícitamente querés y además exigís local.
    if (!mustBeLocal) {
      throw new Error("Admin endpoints disabled in production");
    }
  }

  if (!mustBeLocal) return; // en dev lo dejamos pasar

  // 2) Chequeo simple de host/origin (no perfecto, pero suficiente para tu caso)
  const h = await headers();
  const host = (h.get("host") ?? "").toLowerCase();
  const origin = (h.get("origin") ?? "").toLowerCase();

  const isLocal =
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1");

  if (!isLocal) {
    throw new Error("Forbidden: local admin only");
  }
}
