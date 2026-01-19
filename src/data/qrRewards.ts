// src/data/qrRewards.ts

export type QrRewardUrl = {
  type: "image" | "audio" | "page";
  url: string; // puede ser ruta interna (/bonus/...) o /api/r2-proxy?key=...
  label?: string;
};

export type QrReward = {
  code: string;

  // gating opcional
  requiredLevel?: number;

  // progreso (idempotente)
  setLevelTo?: number; // si current < setLevelTo => levelUp

  // contenido/GUIÑOS
  message?: string;
  urls?: QrRewardUrl[];

  // para que el cliente reaccione (abrir viewer, iniciar puzzle, etc)
  effects?: Record<string, any>;

  // si true: se puede reclamar 1 vez por usuario
  oneTime?: boolean;
};

// Helper para no pifiar keys
export function normCode(code: string) {
  return (code ?? "").trim();
}

/**
 * ✅ Hardcode acá. Importante: el "code" debe coincidir EXACTO con lo que imprimís en el QR.
 */
export const QR_REWARDS: Record<string, QrReward> = {
  // Ejemplo: QR de “inicio real” tras escanear (sube a nivel 1/2/3)
  "SV-QR-INTRO": {
    code: "SV-QR-INTRO",
    requiredLevel: 0,
    setLevelTo: 1,
    oneTime: true,
    message: "OK. Marcado. Empezás oficialmente.",
    urls: [{ type: "page", url: "/bonus/bienvenida", label: "Bienvenida" }],
    effects: { open: "files", packId: "ACT1" },
  },

  // Ejemplo: QR del colegio Santa Verónica (guiño + subir nivel)
  "SV-QR-COLEGIO": {
    code: "SV-QR-COLEGIO",
    requiredLevel: 1,
    setLevelTo: 3,
    oneTime: true,
    message: "Encontraste el rastro del colegio.",
    urls: [
      { type: "image", url: "/bonus/recorte-santa-veronica.jpg", label: "Recorte del diario" },
      // ejemplo r2-proxy
      { type: "audio", url: "/api/r2-proxy?key=bonus%2Faudio%2Fgui%C3%B1o01.mp3", label: "Audio oculto" },
    ],
    effects: { open: "chat", packId: "ACT2_FINAL", puzzleId: "router-flow" },
  },

  // Ejemplo: QR que solo devuelve link (sin level)
  "SV-QR-EASTER-001": {
    code: "SV-QR-EASTER-001",
    requiredLevel: 0,
    oneTime: true,
    message: "Easter egg desbloqueado 😈",
    urls: [{ type: "page", url: "/bonus/easter-001", label: "Abrir" }],
  },
};
