// src/data/puzzles/qr3_eduardo_house_next_chat.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows";

export const EDUARDO_HOUSE_NEXT_CHAT_FLOW: PuzzleFlow = {
  packId: "eduardo-house-next-chat",
  puzzleId: "eduardo-house-next-chat",

  // deps: ['eduardo-house-chat'] (y vos después lo vas a condicionar a "vio el board")
  requires: { type: "story", node: "eduardo-house-board-chat" },

  // No invento storyNode siguiente (orquestador después)
  onSuccess: { storyNode: "casa-maria-cordoba" },

  blockedMessage: "Todavía no podés continuar desde acá.",
  steps: [
    {
      prompt: [
        "Volvés a mirar el living.",
        "",
        "Lo que antes era “desorden” ahora tiene sentido.",
        "O por lo menos intención.",
      ],
      choices: [{ id: "continue", label: "Seguir" }],
      choiceReplies: {
        continue: {
          messages: ["Cerca del tablero hay papeles sueltos.", "Algunos más nuevos que el resto."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "Hay bastantes papeles tirados, uno te llama la atencion...",
        "",
        "Un ticket de farmacia",
      ],
      choices: [{ id: "read", label: "Leer" }],
      choiceReplies: {
        read: {
          messages: ["Farmacia \"La Bella\" - 04:07", "Ibuprofeno 400 x10", "Rivotril 2mg"],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
    {
      prompt: [
        "Seguis buscando y...",
        "",
        "Encontrás un papel doblado.",
        "",
        "Una línea escrita rápido:",
        "",
        "MARÍA NOELIA — nueva dirección:",
        "Pico 3078, Saavedra (CABA).",
      ],
      choices: [{ id: "go_maria", label: "Ir a lo de María Córdoba" }],
      choiceReplies: {
        go_maria: {
          messages: ["Guardás el papel.", "Salís."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
      effectsOnDone: { saveField: "qr3.maria_noelia.new_address" }, // guarda go_maria
    },
  ],
};
