// src/data/puzzles/the_radio_chat.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows";

export const THE_RADIO_CHAT_FLOW: PuzzleFlow = {
  packId: "the-radio-chat",
  puzzleId: "the-radio-chat",

  requires: { type: "story", node: "the-radio-chat" },

  // ✅ Al finalizar el chat → storyteller con audio
  onSuccess: { storyNode: "the-radio-audio" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",

  steps: [
    {
      prompt: [
        "Caminás.",
        "La dirección ya no es una idea, es un trayecto.",
        "",
        "El ruido de la calle se mezcla con pensamientos sueltos.",
        "Un kiosco tiene una radio prendida.",
      ],
      choices: [
        { id: "keep_walking", label: "Seguir caminando" },
        { id: "slow_down", label: "Bajar un poco el paso" },
      ],
      choiceReplies: {
        keep_walking: {
          messages: [
            "No frenás.",
            "La radio queda atrás, pero el sonido te acompaña unos metros.",
          ],
          advance: true,
        },
        slow_down: {
          messages: [
            "Bajás apenas el paso.",
            "La radio suena más clara por un momento.",
          ],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
    {
      prompt: [
        "Te paras unos momentos...",
      ],
      choices: [
        { id: "listen", label: "Escuchar la radio" },
      ],
      choiceReplies: {
        listen: {
          messages: [
            "...",
          ],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    }
  ],
};
