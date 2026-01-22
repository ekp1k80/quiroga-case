// src/data/puzzles/qr1_school_chats.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows";

/**
 * BEFORE: guía a que abran el scanner, sin decirlo explícito.
 * Este chat NO debe “resolver” por input. La salida real es por QR claim externo.
 *
 * Story: viene de the-radio-audio (storyteller) y cae acá.
 * Cuando el jugador claim-ea el QR físico, tu backend/orquestador avanza a "chat-qr1".
 */
export const BEFORE_SCAN_QR1_CHAT_FLOW: PuzzleFlow = {
  packId: "before-scan-qr1-chat",
  puzzleId: "before-scan-qr1-chat",

  requires: { type: "story", node: "before-scan-qr1-chat" },

  // ⚠️ no va a ejecutarse “solo” desde el chat.
  // El avance real a "chat-qr1" ocurre por QR claim (afuera del chat).
  onSuccess: { storyNode: "chat-qr1" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",

  steps: [
    {
      prompt: [
        "Llegamos a la escuela.",
        "Desde adentro se escucha un murmullo constante: risas, pasos apurados, mochilas chocando contra las piernas.",
        "En el portón lateral hay carteles viejos, avisos pegados unos sobre otros… y algo que no encaja con el resto.",
        "No es un papel suelto. Es más… intencional.",
        "¿Qué hacemos?",
      ],
      choices: [
        { id: "look_around", label: "Mirar alrededor" },
        { id: "check_signs", label: "Revisar los carteles del portón" },
        { id: "use_phone", label: "Sacar el celular" },
      ],
      choiceReplies: {
        look_around: {
          messages: [
            "Mirás a ambos lados. Calle tranquila, movimiento de chicos entrando y saliendo.",
            "El portón lateral tiene una esquina donde todos apoyan la mano al empujar.",
            "Ahí está lo raro: algo pequeño, cuadrado, prolijo. No está puesto al azar.",
          ],
          advance: false,
        },
        check_signs: {
          messages: [
            "Te acercás a los carteles. Son avisos escolares comunes… salvo uno.",
            "Ese no tiene texto. No tiene firma. Solo un patrón geométrico que parece hecho para ser leído por… otra cosa.",
            "Si no lo mirás con la herramienta correcta, es solo “un cuadradito”.",
          ],
          advance: false,
        },
        use_phone: {
          messages: [
            "Sacás el celular.",
            "La cámara te enfoca la escena, pero el cuadradito ese parece… estar esperando algo.",
            "No es para leerlo con los ojos.",
          ],
          advance: false,
        },
      },
      check: () => false,
      okMessages: [],
      badMessages: [
        "No hay nada que “contestar” todavía.",
        "Si esto es una pista, no va a saltar escribiendo.",
      ],
    },
  ],
};

/**
 * CHAT QR1: ya adentro, secretaria + confirmación de Sofía + datos padres.
 * Termina avanzando a storyNode siguiente (definilo según tu flujo; por ahora placeholder).
 */
export const CHAT_QR1_CHAT_FLOW: PuzzleFlow = {
  packId: "chat-qr1",
  puzzleId: "chat-qr1",

  requires: { type: "story", node: "chat-qr1" },

  // Ajustá este storyNode al que siga en tu STORY_FLOW real
  onSuccess: { storyNode: "before-scan-qr2-chat" as any },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",

  steps: [
    {
      prompt: [
        "Entramos.",
        "El hall huele a marcador de pizarra, detergente barato y merienda.",
        "Detrás de un vidrio sucio, la secretaria acomoda carpetas sin levantar la vista.",
        "Mientras buscas el camino a la secretaria una pareja joven con su hijo/a caminando y hablando...",
      ],
      choices: [
        { id: "listen", label: "Escuchar conversación" },
      ],
      choiceReplies: {
        listen: {
          messages: [
            "La pareja pasa camindo lentamente, se ven bastante felices en comparacion a tu lugubre situacion",
            "La conversacion decia:",
            "Ella: Llegamos justo pero llegamos",
            "El: Si, justo, justo. A vos sola se te ocurre que es mejor un colegio de capital viviendo en San Justo",
            "Ella: Es que estaba lindo",
            "El: Si la verdad que si...",
            "El: Che Kira se esta quedando sin comida... Tendriamos que comprar",
            "Ella: Tranqui ya encargue ayer",
            "El: La verdad que Kira sola no gastaba tanto como el crio - Se rie",
            "Ella: Amor, Kira nos cagaba en todo el departamento, a parte ya puede ir al baño sin ayuda y encima se re parece a vos",
            "Ella: Es re hermoso <3"
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
        "Llegas a la secretaria",
        "Tragás saliva. Te aclarás la garganta.",
        "—Perdón… ¿puedo hacer una consulta sobre una alumna?",
        "La mujer alza la vista con fastidio profesional.",
        "—¿Nombre de la alumna?",
      ],
      choices: [
        { id: "name_sofia", label: "Sofía R." },
        { id: "name_angeles", label: "Ángeles R." },
        { id: "name_candela", label: "Candela Fernández" },
      ],
      choiceReplies: {
        name_sofia: {
          messages: [
            "Sacás la foto con cuidado, como si se pudiera romper.",
            "—Sofía… —leés atrás— Sofía R.",
            "La secretaria se queda inmóvil medio segundo.",
            "Después frunce el ceño.",
            "—¿Sofía R…? ¿La desaparecida?",
            "La palabra te pega como un cachetazo.",
            "“Desaparecida.”",
            "—Sí… —decís, sin saber dónde apoyar el aire—. Sí, ella.",
          ],
          advance: true,
        },
        name_angeles: {
          messages: [
            "—Ángeles R.",
            "La secretaria parpadea una vez. Dos.",
            "—Mirá… si viene a hacerse el chistoso, no me da gracia hablar de la pobre señorita Rawson.",
            "—Es horrible lo que está diciendo.",
            "Te queda claro que no podés jugar con eso.",
            "Mejor… volvés a lo concreto.",
          ],
          advance: false,
        },
        name_candela: {
          messages: [
            "—Candela Fernández.",
            "La secretaria te mira como si le hubieras hablado en otro idioma.",
            "—¿…Cómo dice?",
            "¿Y Candela?",
            "-Y la moto?",
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
        "La secretaria suspira, resignada.",
        "—El padre fue alumno acá. Y la madre también. Y la abuela.",
        "—Tuvieron problemas… judiciales, creo.",
        "Sentís una descarga fría en la nuca.",
        "—¿Apellido? —preguntás, con la garganta cerrada.",
        "La mujer gira la pantalla apenas, tecleando lento.",
        "Aparece un registro.",
        "Sofía Rivas. — hija de Eduardo Rivas. y Maria C.",
      ],
      choices: [
        { id: "google", label: "Buscar en el celular: “Eduardo Rivas” + desaparición hija" },
        { id: "ask_more", label: "Preguntar si hay algún dato más" },
      ],
      choiceReplies: {
        google: {
          messages: [
            "Bajás la mirada, ocultando el celular cerca del cuerpo.",
            "Tecleás lo mínimo.",
            "Y explota.",
            "Titulares. Acusaciones. Una foto del padre entrando a tribunales.",
            "Comentarios violentos.",
            "Unos dicen “fue él”. Otros dicen “encubrimiento”.",
            "Y una palabra que no podés ignorar:",
            "“contador.”",
            "No hay conclusiones.",
            "Solo hechos sueltos que, juntos, pesan.",
          ],
          advance: true,
        },
        ask_more: {
          messages: [
            "—¿Hay algún dato más… que me pueda decir?",
            "La secretaria duda.",
            "—Mire… yo no puedo darle información privada.",
            "—Pero esto… sí, lo recuerdo. Fue un lío.",
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
        "La secretaria vuelve a mirarte.",
        "—¿Y usted quién es?",
        "El silencio dura lo justo para que te tiemble la voz.",
        "Necesitás decir algo que suene real.",
        "Algo que no te rompa por dentro, pero que tampoco sea una mentira torpe.",
      ],
      choices: [
        { id: "truth", label: "Decir la verdad" },
        { id: "half", label: "Decir algo vago" },
        { id: "leave", label: "Cortar la charla e irte" },
      ],
      choiceReplies: {
        truth: {
          messages: [
            "Respirás hondo.",
            "—Soy amigo de la única persona que estaba investigando esto.",
          ],
          advance: true,
        },
        half: {
          messages: [
            "—Un… conocido. Estoy tratando de entender qué pasó.",
            "La secretaria no se ablanda.",
            "—Mire, señor… acá no hacemos investigaciones.",
          ],
          advance: false,
        },
        leave: {
          messages: [
            "Sentís que te arde la cara.",
            "Dás un paso atrás.",
            "Pero si te vas ahora… te quedás igual que antes.",
            "Con una foto y un vacío.",
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
        "Guardás la foto.",
        "Guardás el celular.",
        "Y te queda un pensamiento fijo, insoportable:",
        "Recién ahora, por primera vez, tenés un nombre completo del hilo.",
      ],
      choices: [{ id: "note", label: "Anotar: “Eduardo R. / Maria C. / Sofía R.”" }],
      choiceReplies: {
        note: {
          messages: ["Lo anotás. Porque si no lo anotás… se te desarma en la cabeza."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },
  ],
};
