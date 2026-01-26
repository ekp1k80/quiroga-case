// src/data/puzzles/qr2_return_chats.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows";

/**
 * BEFORE_SCAN_QR2:
 * - Es continuación de la escena en la escuela.
 * - Objetivo: que el jugador “entienda” que hay otra pista física (sin decir “escaneá”),
 *   y que eso lo lleve a VOLVER a la casa (por storyNode que se avanza vía QR claim externo).
 *
 * Importante:
 * - Este chat NO puede “resolver” por input.
 * - El avance real a "qr2-chat" lo hacés desde tu handler de /api/qr/claim (advanced).
 */
export const BEFORE_SCAN_QR2_CHAT_FLOW: PuzzleFlow = {
  packId: "before-scan-qr2-chat",
  puzzleId: "before-scan-qr2-chat",

  requires: { type: "story", node: "before-scan-qr2-chat" },

  // ⚠️ No se dispara desde acá: avanzás por QR claim (afuera del chat)
  onSuccess: { storyNode: "before-scan-qr2-chat" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",

  steps: [
    {
      prompt: [
        "Salís del hall con la cabeza llena de ruido.",
        "La palabra “desaparecida” te sigue colgando del cuello como un peso.",
        "En la vereda, el mundo sigue normal: autos, chicos, un kiosco, alguien barriendo.",
        "Pero vos no estás normal.",
        "Tenés un nombre: Eduardo R.",
        "Y un dato: contador.",
        "",
        "¿Qué hacés con eso ahora?",
      ],
      choices: [
        { id: "leave_now", label: "Irte ya" },
        { id: "look_back", label: "Mirar una vez más el portón lateral" },
        { id: "check_phone", label: "Sacar el celular" },
      ],
      choiceReplies: {
        leave_now: {
          messages: [
            "Te alejás unos pasos…",
            "y te cae algo obvio: en la calle no vas a ordenar nada.",
            "Si querés cruzar hechos, necesitás estar en un lugar donde puedas trabajar.",
            "Un escritorio. Tiempo. Silencio.",
            "La casa.",
          ],
          advance: false,
        },
        look_back: {
          messages: [
            "Mirás el portón lateral otra vez.",
            "Entre avisos viejos y papeles superpuestos hay una marca rara, prolija.",
            "No parece un cartel para personas. Parece… para ser leído por otra cosa.",
            "Te queda esa sensación: no te vas a llevar esta pista mirando fijo.",
          ],
          advance: false,
        },
        check_phone: {
          messages: [
            "Sacás el celular.",
            "Tenés mil cosas para hacer con él… pero no acá parado.",
            "Acá solo juntás miradas.",
            "Necesitás volver y sentarte.",
            "Y aun así… hay algo en este lugar que no se lee a simple vista.",
          ],
          advance: false,
        },
      },
      check: () => false,
      okMessages: [],
      badMessages: [
        "No hay nada que contestar todavía.",
        "Esto no se destraba escribiendo: se destraba encontrando la pista correcta.",
      ],
    },
  ],
};

/**
 * QR2_CHAT:
 * - Ya “en la casa” (o en tu centro de investigación) se hace la búsqueda tipo Google.
 * - Varias opciones para que el jugador “elija” qué investigar.
 * - Al final, se abre el FileViewer (packId "qr2") y se avanza al siguiente nodo/puzzle.
 *
 * Ajustá packId del FileViewer si tu pack real no se llama "qr2".
 */
export const QR2_CHAT_FLOW: PuzzleFlow = {
  packId: "qr2-chat",
  puzzleId: "qr2-chat",

  requires: { type: "story", node: "qr2-chat" },

  // ✅ Al terminar, pasamos al nodo del puzzle/etapa siguiente
  onSuccess: { storyNode: "qr2-puzzle" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",

  steps: [
    {
      prompt: [
        "Volvés a la casa.",
        "Cerrás la puerta con llave.",
        "El silencio te cae encima como una manta pesada, pero por lo menos es silencio.",
        "",
        "Ponés la foto sobre la mesa.",
        "Anotás lo que tenés:",
        "— Sofía R.",
        "— Eduardo R. (contador)",
        "— Maria C.",
        "",
        "No sabés qué significa todo… pero ahora sí podés hacer algo.",
        "¿Por dónde arrancás?",
      ],
      choices: [
        { id: "q1", label: "Buscar: “Eduardo R. contador”" },
        { id: "q2", label: "Buscar: “Sofía R desaparecida”" },
        { id: "q3", label: "Buscar: “Eduardo R Sofía R”" },
        { id: "q4", label: "Buscar: “Maria C Sofía R”" },
      ],
      choiceReplies: {
        q1: {
          messages: [
            "Escribís despacio, como si te diera miedo que el resultado exista.",
            "Aparecen perfiles sueltos, menciones en comentarios, algún dato viejo en una nota local.",
            "Nada definitivo… pero sí un patrón: el nombre ya circuló antes. Y fuerte.",
            "Guardás pestañas. Marcás capturas.",
          ],
          advance: true,
        },
        q2: {
          messages: [
            "Los resultados te pegan de frente.",
            "Titulares repetidos con fechas distintas.",
            "Un par de notas con frases calcadas.",
            "Y comentarios. Muchos comentarios.",
            "Eso te asusta más que la nota en sí.",
            "Guardás todo. Aunque te dé asco.",
          ],
          advance: true,
        },
        q3: {
          messages: [
            "Sumás nombres para achicar el mundo.",
            "Aparece la escuela, aparecen referencias cruzadas, aparece el eco de “tribunales”.",
            "Hay algo judicial, pero todavía no entendés qué tan grande.",
            "Te quedás con esa palabra como un gancho: 'causa'.",
          ],
          advance: true,
        },
        q4: {
          messages: [
            "Probás con el nombre de la madre.",
            "Los resultados son menos… ruidosos.",
            "Pero no por eso menos inquietantes: hay huecos.",
            "Como si alguien hubiera vivido años evitando dejar rastros.",
            "O como si los rastros se hubieran borrado.",
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
        "Seguís. Una búsqueda lleva a otra.",
        "Abrís pestañas. Cerrás. Volvés. Contrastás fechas.",
        "Anotás términos que se repiten.",
        "",
        "Te das cuenta de algo:",
        "si querés avanzar, necesitás ordenar la información por tema, no por impulso.",
        "",
        "¿Qué línea seguís ahora?",
      ],
      choices: [
        { id: "line_legal", label: "Ir por lo judicial (causa / tribunales)" },
        { id: "line_media", label: "Ir por la prensa (notas / recortes / cronología)" },
        { id: "line_people", label: "Ir por personas (familia / vínculos / entorno)" },
        { id: "line_address", label: "Ir por datos duros (direcciones / registros)" },
      ],
      choiceReplies: {
        line_legal: {
          messages: [
            "Te metés en lo judicial.",
            "Encontrás referencias a declaraciones, a un expediente, a 'fallo'.",
            "No tenés todo, pero sí lo suficiente para entender que esto no fue un rumor de barrio.",
            "Esto llegó a un lugar donde queda papel.",
          ],
          advance: true,
        },
        line_media: {
          messages: [
            "Te enfocás en prensa.",
            "Armas una mini cronología: qué se publicó primero, qué se repitió, qué cambió.",
            "Descubrís que algunos medios repiten texto como plantilla.",
            "Otros agregan detalles… y esos detalles no siempre coinciden.",
          ],
          advance: true,
        },
        line_people: {
          messages: [
            "Buscás personas: nombres, apellidos, menciones cruzadas.",
            "Te sorprende cuánta gente opina sin saber.",
            "Y cuánta gente sabe algo, pero escribe como si no quisiera dejar huella.",
            "Guardás esos nombres: los que hablan raro suelen importar.",
          ],
          advance: true,
        },
        line_address: {
          messages: [
            "Vas por datos duros.",
            "Encontrás direcciones asociadas, alguna referencia a propiedades, registros sueltos.",
            "No confirmás nada todavía… pero sí entendés una cosa:",
            "con una dirección en mano, el caso se vuelve físico.",
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
        "El reloj te pasa por arriba sin pedir permiso.",
        "Cuando levantás la vista, ya pasó más de una hora.",
        "",
        "Tenés demasiadas pestañas abiertas.",
        "Demasiadas capturas.",
        "Demasiados nombres que se repiten.",
        "",
        "Necesitás ordenar todo esto de una forma que no te explote en la cabeza.",
        "¿Cómo seguimos?",
      ],
      choices: [
        { id: "open_files", label: "Ordenar todo en los archivos" },
        { id: "double_check", label: "Revisar una última vez que no me esté perdiendo algo" },
      ],
      choiceReplies: {
        double_check: {
          messages: [
            "Revisás otra vez.",
            "Como si el dato clave fuese a aparecer por cansancio.",
            "No aparece.",
            "Pero sí confirmás algo importante:",
            "esto no se resuelve con una búsqueda más.",
            "Se resuelve con evidencia ordenada.",
          ],
          advance: true,
        },
        open_files: {
          messages: [
            "Juntás todo.",
            "Capturas, notas, links, nombres.",
            "Lo bajás a tierra: archivo por archivo.",
            "Si hay un patrón, va a estar ahí.",
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
