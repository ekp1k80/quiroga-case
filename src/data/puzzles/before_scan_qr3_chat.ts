// src/data/puzzles/chatFlows/before-scan-qr3-chat.ts
import type { PuzzleFlow } from "@/data/puzzles/puzzleFlows";

export const BEFORE_SCAN_QR3_CHAT_FLOW: PuzzleFlow = {
  packId: "before-scan-qr3-chat",
  puzzleId: "before-scan-qr3-chat",

  requires: { type: "story", node: "before-scan-qr3-chat" },

  // ⚠️ No avanza nada “nuevo” desde acá.
  // El avance real a la siguiente instancia pasa por afuera (como ya venís haciendo).
  onSuccess: { storyNode: "before-scan-qr3-chat" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",

  steps: [
    {
      prompt: [
        "Salís de lo de Beatriz con la garganta seca.",
        "El aire de la calle pega distinto: más liviano, pero también más frío.",
        "La carpeta de Héctor te pesa en el brazo como si tuviera plomo adentro.",
        "No es por el papel. Es por lo que sugiere.",
        "Volvemos a casa.",
        "A la tuya. A la mesa. A esa luz de techo que siempre parpadea un poco.",
        "Si hay algo que ordenar, se ordena ahí. Con tiempo. Y con las cosas abiertas.",
        "¿Qué hacés apenas llegás?",
      ],
      choices: [
        { id: "lock_door", label: "Cerrar todo y bajar un cambio" },
        { id: "spread_folder", label: "Abrir la carpeta de Héctor sobre la mesa" },
        { id: "make_note", label: "Anotar lo mínimo para no olvidarte" },
      ],
      choiceReplies: {
        lock_door: {
          messages: [
            "Entrás y cerrás con doble vuelta.",
            "El silencio te cae encima como una manta pesada.",
            "Te quedás un segundo quieto, respirando… sin sacar la vista de la carpeta.",
            "No es descanso. Es apenas el punto de partida.",
            "Ok. Ahora sí: la mesa.",
          ],
          advance: false,
        },
        spread_folder: {
          messages: [
            "Apoyás la carpeta de Héctor y la abrís.",
            "Papel, marcas, pedazos de historia que no están pensados para convivir… pero conviven igual.",
            "La sensación es clara: lo de Beatriz no cerró nada. Solo te empujó hacia atrás.",
            "Como si el camino fuera: volver a la casa, volver al origen, volver a mirar lo que ya miraste… distinto.",
            "Te quedás con la carpeta abierta. La casa, muda alrededor.",
          ],
          advance: false,
        },
        make_note: {
          messages: [
            "Agarrás lo primero que encontrás: una hoja, una birome.",
            "No escribís un ensayo. Es una línea.",
            "‘Volver a casa. Carpeta de Héctor. Reordenar todo.’",
            "Lo dejás a la vista como si eso pudiera frenarte de dispersarte.",
            "Después mirás la mesa. Ya sabés lo que sigue.",
          ],
          advance: false,
        },
      },
      check: () => false,
      okMessages: [],
      badMessages: [
        "No hay nada que responder todavía.",
        "Esto no se resuelve escribiendo: se resuelve volviendo y mirando de nuevo.",
      ],
    },
  ],
};
