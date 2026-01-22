// src/data/qrRewards.ts
import type { AccessRule } from "@/data/levels";
import type { ProgressPatch } from "@/data/puzzles/puzzleFlows";

export type QrRewardUrl = {
  type: "image" | "audio" | "page";
  url: string;
  label?: string;
};

export type QrReward = {
  code: string;

  // ✅ gating real (story/flag/tag)
  requires?: AccessRule;

  // ✅ progreso real (server aplica)
  onClaim?: ProgressPatch;

  message?: string;
  urls?: QrRewardUrl[];

  // UI hints opcionales
  effects?: Record<string, any>;

  oneTime?: boolean;
};

export function normCode(code: string) {
  return (code ?? "").trim();
}

export const QR_REWARDS: Record<string, QrReward> = {
  "SV-QR-INTRO": {
    code: "SV-QR-INTRO",
    requires: { type: "story", node: "prologue-1" },
    oneTime: true,
    message: "OK. Marcado. Empezás oficialmente.",
    urls: [{ type: "page", url: "/bonus/bienvenida", label: "Bienvenida" }],
    effects: { open: "files", packId: "ACT1" },
    onClaim: { addFlags: ["scanned-qr-intro"] },
  },

  "SV-QR-COLEGIO": {
    code: "SV-QR-COLEGIO",
    requires: { type: "story", node: "the-radio" },
    oneTime: true,
    message: "Encontraste el rastro del colegio.",
    urls: [
      { type: "image", url: "/bonus/recorte-santa-veronica.jpg", label: "Recorte del diario" },
      { type: "audio", url: "/api/r2-proxy?key=bonus%2Faudio%2Fguino01.mp3", label: "Audio oculto" },
    ],
    effects: { open: "chat", packId: "ACT2_FINAL", puzzleId: "router-flow" },
    onClaim: { addFlags: ["scanned-qr1"] },
  },

  "SV-QR-EASTER-001": {
    code: "SV-QR-EASTER-001",
    oneTime: true,
    message: "Easter egg desbloqueado 😈",
    urls: [{ type: "page", url: "/bonus/easter-001", label: "Abrir" }],
    onClaim: { addTags: ["easter-001"] },
  },
};
