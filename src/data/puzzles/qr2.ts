// src/data/puzzles/qr2.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows"

function nonEmpty(s: string) {
  return s.trim().length > 0
}

export const QR2_FLOW: PuzzleFlow = {
  packId: "qr2-puzzle",
  puzzleId: "qr2-puzzle",

  // Antes: requiredLevel: 1
  // Si querés que SIEMPRE esté accesible, podés directamente omitir `requires`.
  requires: { type: "story", node: "before-scan-qr2-chat" },

  // Antes: successLevel: 1
  // Si no avanza historia, dejalo vacío o usá flags/tags.
  onSuccess: { addFlags: ["qr2-completed"], storyNode: "eduardo-house-chat" },

  blockedMessage: "Todavía no podés completar este QR.",
  steps: [
    {
      prompt: [
        "Bueno, es momento de revisar todo lo que tenemos, vuelve aqui cuanto estes lindo digo listo..."
      ],
      choices: [
        { id: "ready", label: "Estoy listo" },
        { id: "whatIsReady", label: "Que es estar listo?" },
      ],
      choiceReplies: {
        ready: {
          messages: [
            "Okay, continuemos... Tenemos que rellenar la informacion",
          ],
          advance: true,
        },
        whatIsReady: {
          messages: [
            "Capo o capa, podes leer los archivos por favor...",
          ],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
    {
      prompt: "I. DATOS DEL HECHO\nFecha del hecho denunciado:",
      check: nonEmpty,
      okMessages: ["Ok. Anotado."],
      badMessages: ["Escribí una fecha (aunque sea aproximada)."],
      effectsOnDone: { saveField: "qr2.fecha_hecho" },
    },
    {
      prompt: "Franja horaria en la que se pierde contacto con la menor:",
      check: nonEmpty,
      okMessages: ["Recibido."],
      badMessages: ["Necesito una franja horaria (aprox también sirve)."],
      effectsOnDone: { saveField: "qr2.franja_contacto" },
    },
    {
      prompt: "Lugar donde fue vista por última vez:",
      check: nonEmpty,
      okMessages: ["Ok."],
      badMessages: ["Necesito un lugar (aunque sea general)."],
      effectsOnDone: { saveField: "qr2.ultimo_lugar" },
    },

    {
      prompt: "II. PERSONA BUSCADA\nNombre completo de la persona desaparecida:",
      check: nonEmpty,
      okMessages: ["Anotado."],
      badMessages: ["Escribí el nombre completo."],
      effectsOnDone: { saveField: "qr2.persona.nombre" },
    },
    {
      prompt: "Edad al momento del hecho:",
      check: nonEmpty,
      okMessages: ["Ok."],
      badMessages: ["Escribí una edad."],
      effectsOnDone: { saveField: "qr2.persona.edad" },
    },
    {
      prompt: "Establecimiento educativo al que asistía:",
      check: nonEmpty,
      okMessages: ["Ok."],
      badMessages: ["Escribí el establecimiento."],
      effectsOnDone: { saveField: "qr2.persona.escuela" },
    },

    {
      prompt: "III. DENUNCIANTE\nNombre del denunciante:",
      check: nonEmpty,
      okMessages: ["Anotado."],
      badMessages: ["Escribí el nombre del denunciante."],
      effectsOnDone: { saveField: "qr2.denunciante.nombre" },
    },
    {
      prompt: "Vínculo con la persona buscada:",
      check: nonEmpty,
      okMessages: ["Ok."],
      badMessages: ["Necesito el vínculo."],
      effectsOnDone: { saveField: "qr2.denunciante.vinculo" },
    },
    {
      prompt: "Profesión declarada del denunciante:",
      check: nonEmpty,
      okMessages: ["Ok."],
      badMessages: ["Escribí una profesión o 'no consta'."],
      effectsOnDone: { saveField: "qr2.denunciante.profesion" },
    },

    {
      prompt: "IV. DESCRIPCIÓN\n¿Identificación fehaciente de un tercero? (SI/NO)",
      check: (input) => ["si", "no"].includes(input.trim().toLowerCase()),
      okMessages: ["Registrado."],
      badMessages: ["Respondé SI o NO."],
      effectsOnDone: { saveField: "qr2.tercero.identificacion" },
    },
    {
      prompt: "Forma en que se describe al tercero (o N/A):",
      check: nonEmpty,
      okMessages: ["Ok."],
      badMessages: ["Escribí algo o N/A."],
      effectsOnDone: { saveField: "qr2.tercero.forma" },
    },
    {
      prompt: "Elementos distintivos mencionados:",
      check: nonEmpty,
      okMessages: ["Ok."],
      badMessages: ["Escribí algo o 'no consta'."],
      effectsOnDone: { saveField: "qr2.tercero.distintivos" },
    },

    {
      prompt: "V. ACTUACIONES\nFigura legal:",
      check: nonEmpty,
      okMessages: ["Ok."],
      badMessages: ["Escribí la figura legal."],
      effectsOnDone: { saveField: "qr2.judicial.figura" },
    },
    {
      prompt: "Organismo que recibe la denuncia:",
      check: nonEmpty,
      okMessages: ["Ok."],
      badMessages: ["Escribí el organismo."],
      effectsOnDone: { saveField: "qr2.judicial.organismo" },
    },
    {
      prompt: "Medidas iniciales solicitadas:",
      check: nonEmpty,
      okMessages: ["Ok."],
      badMessages: ["Escribí al menos una medida."],
      effectsOnDone: { saveField: "qr2.judicial.medidas" },
    },

    {
      prompt: "VI. OBSERVACIONES\n¿Registros institucionales del egreso? (SI/NO/PARCIAL)",
      check: (input) => ["si", "no", "parcial"].includes(input.trim().toLowerCase()),
      okMessages: ["Formulario completado."],
      badMessages: ["Respondé SI, NO o PARCIAL."],
      effectsOnDone: { saveField: "qr2.obs.egreso_registros" },
    },
    {
      prompt: "Bueno, ya analizamos bastante informacion? Y ahora que hacemos? Con quien hablamos? De que hilo tiramos?",
      check: (input) => ["si", "no", "parcial"].includes(input.trim().toLowerCase()),
      okMessages: ["Formulario completado."],
      badMessages: ["Respondé SI, NO o PARCIAL."],
      effectsOnDone: { saveField: "qr2.obs.egreso_registros" },
    },
    {
      prompt: "Bueno, ya analizamos bastante informacion? Y ahora que hacemos? Con quien hablamos? De que hilo tiramos?",
      choices: [
        { id: "mother", label: "Ir a la casa de la madre" },
        { id: "grandparents", label: "Ir a lo de los abuelos" },
        { id: "father", label: "Buscar al padre" },
      ],

      // ⬇️ todo el branching vive acá
      choiceReplies: {
        mother: {
          messages: [
            "No podemos ir a la casa de la madre.",
            "Solo sabemos que vive en Saavedra, nada más.",
          ],
          advance: false,
        },

        grandparents: {
          messages: [
            "No creo que los abuelos sean la mejor opción.",
            "No tenían contacto reciente con Sofía.",
          ],
          advance: false,
        },

        father: {
          messages: [
            "El padre sí.",
            "Tenemos datos suficientes para empezar por ahí.",
          ],
          advance: true,
        },
      },

      // check no se usa acá, pero lo dejamos por compatibilidad
      check: () => true,

      okMessages: [],
      badMessages: ["Elegí una de las opciones."],

      effectsOnDone: {
        saveField: "qr2.next_destination",
      },
    }
  ],
}
