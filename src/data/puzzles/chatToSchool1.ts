// src/data/puzzles/qr3_eduardo_house_chat.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows";

export const CHAT_TO_SCHOOL_1_CHAT_FLOW: PuzzleFlow = {
  packId: "chat-to-school-1",
  puzzleId: "chat-to-school-1",

  requires: { type: "story", node: "chat-to-school-1" },

  onSuccess: { storyNode: "chat-to-school-2" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",
  steps: [
    {
      prompt: [
        "Martín baja las escaleras del edificio de Héctor sin mirar atrás.",
        "En la mano tiene la foto de Sofía.",
        "Atrás de la foto, un recorte de diario está sujeto con un clip.",
        "",
        "No parece un “souvenir”. Parece una orden.",
      ],
      choices: [
        { id: "separate_clip", label: "Separar el recorte del clip" },
        { id: "hesitate", label: "Dudar un segundo… y separarlo igual" },
      ],
      choiceReplies: {
        separate_clip: {
          messages: [
            "Con el pulgar levantás el clip con cuidado.",
            "El metal hace un *clic* seco.",
            "Separás el recorte sin romper el papel.",
          ],
          advance: true,
        },
        hesitate: {
          messages: [
            "Te quedás un segundo quieto, como si el papel pesara más de lo que debería.",
            "Después: lo mismo. El clip cede con un *clic*.",
            "Separás el recorte.",
          ],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
    {
      prompt: [{ type: "packFile", fileId: "act3/recorte_diario_sofia_page.jpg" }],
      choices: [{ id: "see_newspaper", label: "Ver el recorte de diario" }],
      choiceReplies: {
        see_newspaper: {
          messages: [
            "Lo abrís del todo.",
            "La tinta vieja deja ese olor a papel guardado.",
            "Hay una dirección. Clara. Impresa.",
          ],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
      effectsOnDone: {
        saveField: "chatToSchool1.see_newspaper",
        openFiles: { packId: "chat-to-school-2", title: "Recapitulación" },
      },
    },
  ],
};
