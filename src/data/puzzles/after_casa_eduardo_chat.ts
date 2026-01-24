// src/data/puzzles/after_casa_eduardo_chat.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows";

/**
 * Chat: after-casa-eduardo
 * Objetivo:
 * - Empujar al jugador a decidir “ir a la casa de la madre” (María Noelia Córdoba)
 * - Sin releer el post-it (ya lo vio).
 * - Dejar que el jugador conecte o no el nombre; si no lo conecta, lo ayudamos con choices.
 *
 * Avanza a: casa-maria-cordoba
 */
export const AFTER_CASA_EDUARDO_CHAT_FLOW: PuzzleFlow = {
  packId: "after-casa-eduardo",
  puzzleId: "after-casa-eduardo",

  requires: { type: "story", node: "after-casa-eduardo" },

  onSuccess: { storyNode: "casa-maria-cordoba" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",

  steps: [
    {
      prompt: [
        "Volvés a mirar lo que tenes como si los papeles se fueran a acomodar solos.",
        "El post-it ya no sorprende… pero pesa.",
        "Nueva dirección.",
        "Nuevo punto en el mapa.",
        "",
        "Lo que te inquieta no es la dirección.",
        "Es el nombre.",
        "",
        "Si esa nota estaba en la casa de Eduardo… no era decoración.",
        "",
        "¿Qué hacemos con esto?",
      ],
      choices: [
        { id: "go_now", label: "Ir a esa dirección" },
        { id: "think", label: "Parar un segundo y razonar por qué ir" },
        { id: "who", label: "¿Quién era María Noelia?" },
        { id: "ignore", label: "Ignorarlo por ahora y seguir con otra cosa" },
      ],
      choiceReplies: {
        go_now: {
          messages: [
            "Te suena drástico… Capaz tendriamos que hacer otra cosa primero"
          ],
          advance: false,
        },

        think: {
          messages: [
            "Si Eduardo es el hilo más ruidoso… la madre puede ser el hilo más silencioso.",
            "A veces el que no aparece en los titulares es el que sostiene todo por abajo.",
            "Y esa nota no dice 'cualquier persona': dice un nombre con nueva dirección.",
            "Eso es reciente. Eso es movimiento.",
            "Si querés entender qué pasó, necesitás hablar con el lugar al que se fue.",
          ],
          advance: true,
        },

        who: {
          messages: [
            "María Noelia Córdoba.",
            "El nombre no es nuevo: ya estaba antes, pero tal vez no lo conectaste.",
            "No es un tercero cualquiera.",
            "Es la madre.",
            "Y si el dato de su dirección estaba guardado en la casa de Eduardo… es porque Eduardo la tenía en el radar.",
            "O porque alguien quería que él la tuviera en el radar.",
          ],
          advance: true,
        },

        ignore: {
          messages: [
            "Lo intentás… pero no te sale.",
            "Porque esta es la primera pista que no es un archivo ni un rumor: es un lugar.",
            "Y un lugar te obliga a decidir.",
            "Si lo dejás pasar, volvés a quedarte girando en círculos.",
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
        "Te queda una certeza incómoda:",
        "si hay alguien que puede confirmar una vida cotidiana, rutinas, vínculos… es ella.",
        "Eduardo puede gritar versiones.",
        "La madre puede tener hechos.",
        "",
        "No te entusiasma ir.",
        "Pero te entusiasma menos quedarte quieto.",
        "",
        "¿Confirmamos el próximo paso?",
      ],
      choices: [{ id: "confirm", label: "Ir a lo de María Noelia Córdoba (Saavedra)" }],
      choiceReplies: {
        confirm: {
          messages: [
            "Anotás la dirección en grande.",
            "Te guardás la foto y salís con la sensación de que, por primera vez, el caso te está llevando a una puerta concreta.",
          ],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
  ],
};
