// src/data/puzzleFlows.ts
export type PuzzleFlow = {
  packId: string;
  puzzleId: string;

  requiredLevel: number;
  successLevel: number;

  blockedMessage: string;

  steps: Array<{
    prompt: string;
    check: (input: string) => boolean;
    okMessages: string[];
    badMessages: string[];
    effectsOnDone?: Record<string, any>;
  }>;
};

export function puzzleKey(packId: string, puzzleId: string) {
  return `${packId}:${puzzleId}`;
}

export const PUZZLE_FLOWS: Record<string, PuzzleFlow> = {
  // ✅ OJO: estos strings tienen que coincidir con lo que mandás desde el hook
  [puzzleKey("ACT2_FINAL", "router-flow")]: {
    packId: "ACT2_FINAL",
    puzzleId: "router-flow",
    requiredLevel: 3,
    successLevel: 4,
    blockedMessage:
      "Todavía no podés hacer esto. Te falta completar un paso anterior (pista: hay un QR pendiente).",
    steps: [
      {
        prompt: "Ingresá la contraseña de la red ADMINISTRACIÓN_EDIFICIO.",
        check: (input) => input === "admin1234",
        okMessages: ["Correcto. Conectado."],
        badMessages: ["Incorrecto. Probá de nuevo."],
      },
      {
        prompt: "Ahora: ¿qué IP abre el panel del router?",
        check: (input) => input === "192.168.0.1",
        okMessages: ["Bien. Panel accesible."],
        badMessages: ["No. Necesito la IP exacta."],
      },
      {
        prompt: "¿Nombre exacto de la cámara del pasillo?",
        check: (input) => input.includes("pasillo") && input.includes("3") && input.includes("piso"),
        okMessages: ["Ok. Cámara encontrada.", "Acción habilitada: ver grabaciones guardadas."],
        badMessages: ["Casi. Escribí el nombre completo."],
        effectsOnDone: { open: "router" },
      },
    ],
  },
};
