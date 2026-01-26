// src/data/puzzles/qr3_eduardo_house_chat.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows";

export const EDUARDO_HOUSE_BOARD_CHAT_FLOW: PuzzleFlow = {
  packId: "eduardo-house-board-chat",
  puzzleId: "eduardo-house-board-chat",

  // deps: ['qr2']
  requires: { type: "story", node: "eduardo-house-chat" },

  // ✅ Fin Chat 1 → storyNode = "eduardo-house-board"
  onSuccess: { storyNode: "eduardo-house-next-chat" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",
  steps: [
    {
      prompt: [
        "Cuando veas lo que encontraste en la pared Eduardo puedes continuar...",
      ],
      choices: [{ id: "continue", label: "Continuar" }],
      choiceReplies: {
        continue: {
          messages: [],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
  ],
};
