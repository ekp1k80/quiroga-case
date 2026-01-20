import { PuzzleFlow } from "./puzzleFlows"

export const EXAMPLE_FLOW: PuzzleFlow = {
  packId: "ACT2_FINAL",
  puzzleId: "router-flow",

  // Antes:
  // requiredLevel: 3
  // successLevel: 4

  // ✅ Ahora: gate declarativo (ajustá el story node/flag a lo que corresponda en tu historia)
  requires: {
    all: [
      { type: "story", node: "act2-the-camera" }, // ejemplo
      { type: "flag", flag: "qr-pending-resolved" }, // ejemplo
    ],
  },

  // ✅ Al completarlo, podés avanzar historia y/o setear flags/tags
  onSuccess: {
    storyNode: "chat-to-school", // ejemplo (poné el node real al que querés saltar)
    addFlags: ["router-flow-completed"],
  },

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
      check: (input) =>
        input.includes("pasillo") && input.includes("3") && input.includes("piso"),
      okMessages: ["Ok. Cámara encontrada.", "Acción habilitada: ver grabaciones guardadas."],
      badMessages: ["Casi. Escribí el nombre completo."],
      effectsOnDone: { open: "router" },
    },
  ],
}
