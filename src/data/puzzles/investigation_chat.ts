// src/data/puzzles/qr3_eduardo_house_chat.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows";

export const INVESTIGATION_CHAT_FLOW: PuzzleFlow = {
  packId: "investigation",
  puzzleId: "investigation",

  // deps: ['qr2']
  requires: { type: "story", node: "investigation" },

  // ✅ Fin Chat 1 → storyNode = "eduardo-house-board"
  onSuccess: { storyNode: "credits" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",
  steps: [
    // 1) Preguntas que no cierran (meta, incómodo)
    {
      prompt: ["..."],
      choices: [{ id: "q1", label: "Y si Martin fue abatido, como llego esta historia nosotros?" }],
      choiceReplies: { q1: { messages: [], advance: true } },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
    {
      prompt: ["..."],
      choices: [{ id: "q2", label: "El USB tenia informacion de la computadora de Amaru Lagos, como llego a la casa de Hector?" }],
      choiceReplies: { q2: { messages: [], advance: true } },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    // 2) Puerta a lo real
    {
      prompt: ['Sabias que esta historia esta basada en un caso real ocurrido en Argentina?'],
      choices: [{ id: "more", label: "Saber mas" }],
      choiceReplies: { more: { messages: [], advance: true } },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    // 3) Bloque factual duro (todo junto, sin “vos” ni chistes en el medio)
    {
      prompt: [
        'El 12 de agosto de 2023 en la operacion "Operación Secta Sociedad Anónima" se realizaron 50 allanamientos simultaneos, se arrestaron 20 personas',
        "de los cuales 17 de ellos fueron procesados, durante los procedimientos se incautaron más de un millón y medio de dólares, joyas y monedas de oro.",
        "De acuerdo a lo estimado en la investigación, contaría con un patrimonio de, al menos, 50 millones de dólares, con cuentas radicadas en Estados Unidos.",
        'La Secta "La Escuela de Yoga de Buenos Aires" (EYBA) era una organizacion una de múltiples caras de una organización que incluye inmobiliarias, consultoras, financieras paralelas y que generaba ingresos de hasta 500 mil dólares al mes',
        "Una victima que logro escapar dice que su familia fue captada desde los 80, (40 años operando).",
        '"El Maestro" comandaba la organizacion con mas de 1500 miembros',
        "Explotación sexual (incluso de menores)",
        "Mecanismos de persuación y coerción psicólogica",
        "Contrabando",
        "Lavado de activos",
        "Secuestro",
        "Privacion de libertad",
        "Sumision quimica",
        "y si... tambien asesinatos",
        "...",
        "...",
        "Esta organizacion era internacional, llego a tener tanto poder que hizo que el congreso de USA presione a Argentina para cerrar la primera investigacion contra ellos",
        "Todo bajo suelo Argentino, por decadas, a la plena vista...",
        "...",
        "...",
      ],
      choices: [{ id: "next_fact", label: "..." }],
      choiceReplies: { next_fact: { messages: [], advance: true } },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    // 4) Bisagra moral + activista
    {
      prompt: [
        "La maldad a veces esta en frente de nuestras narices, no hace falta ver peliculas de Hollywood",
        "Lo unico que se necesita para que el mal triunfe es que los buenos no hagan nada",
        "...",
        "...",
        'Si quieres saber mas sobre la historia puedes buscar a "Pablo Salum" el principal activista y victima de esta organización',
        "...",
        "...",
      ],
      choices: [{ id: "next_bridge", label: "..." }],
      choiceReplies: { next_bridge: { messages: [], advance: true } },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    // 5) Vos (agradecimiento + vulnerabilidad)
    {
      prompt: [
        "Gracias por participar, si son mi grupo de amigos la verdad que los quiero mucho.",
        "Empece a hacer esta novela/juego pensando que iba a tomar poco tiempo y que iba a estar preparado para mi cumpleaños y me tomo mucho mas tiempo de lo que pense",
        "Al terminar de hacer todo me llego el pensamiento si es que solamente perdi mi tiempo organizando esto y la verdad que me dio una mini crisis existencial, no estudie nada de Anato, ni sali a caminar de nuevo, ni estudie Aleman todo lo que queria",
        "Pero si despues de que hayan terminado este juego logre darles una linda experiencia la verdad valio la pena. Gracias a todos los que participaron en el proceso de creacion",
        "",
        "Celebremos por un 2026 que empezo excelente y hermoso. Feliz cumple atrasado para mi, para la veggie y para la Trump (Tami)",
        'No se que mas decir, podria escribirles una biblia aparentemente con mi universo interior y las palabras Te quiero no hace justicia al aprecio que les tengo',
        "...",
        "...",
      ],
      choices: [{ id: "next_you", label: "..." }],
      choiceReplies: { next_you: { messages: [], advance: true } },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
    {
      prompt: [
        "Aunque nos juntamos cada muerte de obispo...",
      ],
      choices: [{ id: "next_you", label: "..." }],
      choiceReplies: { next_you: { messages: [], advance: true } },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    // 6) Catarsis identitaria (se queda)
    {
      prompt: ["Hijos de la chingada"],
      choices: [{ id: "next_catharsis", label: "..." }],
      choiceReplies: { next_catharsis: { messages: [], advance: true } },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    // 7) Texto cósmico + guiño final
    {
      prompt: [
        "Que la causalidad nos haya juntado, en un mundo con más de 8.000.000.000 personas, con un 0,46% de nacer en Argentina y menos de la mitad de haber nacido en AMBA.",
        "En años precisos",
        "Que nos hayan unido hoy aquí, por sangre, por haber estado en un mismo curso hace más de 10 años, por cursar la misma carrera",
        "Que en un universo lleno de galaxias, con miles de millones de estrellas y planetas, justo en este rincón haya existido una Tierra capaz de sostener vida",
        "Que durante miles de millones de años la evolución haya sobrevivido a catástrofes, extinciones y caos, hasta llegar a nosotros, capaces de hablar, recordar y sentir",
        "Que haya existido una cadena imposible de descendencias, una línea ininterrumpida de encuentros, decisiones, nacimientos, errores y coincidencias, sin cortarse jamás",
        "Que Europa haya tenido guerras, que haya habido huídas, migraciones, barcos, despedidas, gente que se animó a empezar de cero… y que por eso hoy estemos en Argentina",
        "Que toda esa historia inmensa —cosmológica, biológica, humana— haya terminado en algo tan simple y tan gigante como esto: nosotros, hoy, acá, juntos",
        "...",
        "Les agradezco de todo corazón",
        "...",
        "Recemosle a Diosito para que si se estrene el GTA 6 este año",
        "...",
        "Bay",
      ],
      choices: [{ id: "final", label: "Omg" }],
      choiceReplies: { final: { messages: [], advance: true } },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
    {
      prompt: [
        "CRÉDITOS",
        "...",

        "Idea original:",
        "Federico Fernández",
        "...",

        "Guion:",
        "El mismo guapetón Federico Fernández",
        "...",

        "Desarrollo y producción:",
        "Don Federico Fernández",
        "...",
        "...",

        "PERSONAJES",
        "...",

        "Recepcionista del Centragolo:",
        "Annabella Gayoso",
        "(Annie pa’ los compas)",
        "...",

        "Periodista extranjera:",
        "Evelin Barbosa de Almeida",
        "...",

        "Beatriz:",
        "Annabella Gayoso",
        "(Annie pa’ los compas, otra vez)",
        "...",

        "María Córdoba:",
        "María de los Ángeles",
        "(no sé tu apellido bro)",
        "...",

        "Eduardo:",
        "Sergio Fernández",
        "...",
        "...",

        "VARIOS PERSONAJES (MULTICLASE)",
        "...",

        "Atención de emergencias:",
        "Paola Paz",
        "...",

        "Abogada de defensa del colegio:",
        "Paola Paz",
        "...",

        "Recepcionista del Juzgado de Familia:",
        "Paola Paz",
        "...",

        "Directora del colegio:",
        "Paola Paz",
        "...",

        "Preceptora:",
        "Paola Paz",
        "...",

        "Capaz… como que te equivocaste de profesión.",
        "Hubieras sido actriz.",
        "...",
        "...",

        "Anuncio de empanadas:",
        "Delfina Ramírez",
        "...",
        "...",

        "PROTAGÓNICOS",
        "...",

        "Héctor:",
        "Watashi (yo)",
        "...",

        "Mami de Héctor:",
        "Watashi mo (yo también)",
        "...",

        "Martín:",
        "Also me",
        "...",
        "...",

        "Gracias por llegar hasta acá.",
        "Gracias por bancar esta historia.",
        "Gracias por estar.",
        "...",

        "Algunas historias no se cierran.",
        "Se cargan.",
        "...",

        "Bay"
      ],
      choices: [{ id: "final", label: "..." }],
      choiceReplies: {
        final: {
          messages: [],
          advance: false,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    }
  ],
};
