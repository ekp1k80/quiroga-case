// src/data/puzzles/qr3_eduardo_house_chat.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows";

export const CHAT_TO_SCHOOL_2_CHAT_FLOW: PuzzleFlow = {
  packId: "chat-to-school-2",
  puzzleId: "chat-to-school-2",

  requires: { type: "story", node: "chat-to-school-2" },

  onSuccess: { storyNode: "the-radio-chat" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",
  steps: [
    {
      prompt: [
        "Antes de movernos: mirá el recorte en los archivos.",
        "No sirve “creer que lo entendiste”. Sirve leerlo.",
      ],
      choices: [{ id: "already_seen", label: "Ya lo vi completo" }],
      choiceReplies: {
        already_seen: {
          messages: [
            "Bien.",
            "Ahora pensá: Héctor no te dejó un ensayo. Te dejó un dato accionable.",
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
        "Del recorte se puede sacar mucha cosa…",
        "pero si tenés que elegir UNA que te permita moverte ya:",
        "",
        "¿qué dato estás buscando?",
        "",
        "Pista: no es “la historia”. Es algo que podés poner en un mapa.",
      ],
      check: (input) => {
        const n = (input ?? "").trim().toLowerCase();
        // aceptamos varias formas sin regalar la palabra exacta
        return (
          n.includes("direccion") ||
          n.includes("dirección") ||
          n.includes("ubicacion") ||
          n.includes("ubicación") ||
          n.includes("domicilio") ||
          n.includes("calle") ||
          n.includes("dónde") ||
          n.includes("donde")
        );
      },
      okMessages: [
        "Exacto.",
        "Un lugar concreto.",
        "Si no te movés, todo lo demás es ruido.",
      ],
      badMessages: [
        "Eso no te mueve a ningún lado.",
        "Pensá en algo que puedas usar para ir físicamente a un punto.",
      ],
    },

    {
      prompt: [
        "Bien. Tenés una dirección.",
        "",
        "Ahora: ¿qué representa ese lugar en el contexto de Sofía?",
        "",
        "Elegí la opción que más encaja con lo que viste en la foto + el recorte.",
      ],
      choices: [
        { id: "place_school", label: "La escuela (es el único punto lógico de arranque)" },
        { id: "place_police", label: "Una comisaría (para denunciar)" },
        { id: "place_house", label: "Una casa cualquiera (la de Sofía)" },
      ],
      choiceReplies: {
        place_school: {
          messages: [
            "Sí.",
            "Foto con uniforme + recorte con dirección.",
            "Eso no te manda a “hablar con alguien”, te manda a un lugar donde hay registros, horarios, testigos.",
          ],
          advance: true,
        },
        place_police: {
          messages: [
            "No cierra.",
            "El recorte no está armado como para una denuncia: está armado como para un recorrido.",
            "Probá de nuevo.",
          ],
          advance: false,
        },
        place_house: {
          messages: [
            "Podría ser… pero no es lo más probable.",
            "La foto apunta a institución, no a domicilio personal.",
            "Probá de nuevo.",
          ],
          advance: false,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "Entonces hacelo bien:",
        "copiá la dirección EXACTA tal como figura en el recorte.",
        "",
        "Formato esperado:",
        "Calle y número, Localidad",
      ],
      check: (input) => {
        const n = (input ?? "")
          .trim()
          .toLowerCase()
          .replace(/\./g, "")
          .replace(/,/g, " ")
          .replace(/\s+/g, " ");

        // Dirección real que me diste:
        // J. M. Campos 1918, San Andres
        const expected1 = "j m campos 1918 san andres";
        const expected2 = "jm campos 1918 san andres";

        return n.includes(expected1) || n.includes(expected2);
      },
      okMessages: [
        "J. M. Campos 1918, San Andrés.",
        "La repetís una vez más, como un mantra.",
        "Listo. Ya no es intuición. Es un destino.",
      ],
      badMessages: [
        "No coincide.",
        "Volvé al recorte y copiá la dirección exacta (calle + número + localidad).",
      ],
    },

    {
      prompt: ["Vamos."],
      choices: [{ id: "go_to_school", label: "Ir a la escuela" }],
      choiceReplies: {
        go_to_school: {
          messages: ["Salís con la foto guardada y el recorte doblado en el bolsillo."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
  ],
};
