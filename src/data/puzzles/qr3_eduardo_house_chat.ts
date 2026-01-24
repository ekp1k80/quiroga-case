// src/data/puzzles/qr3_eduardo_house_chat.ts
import { type PuzzleFlow } from "@/data/puzzles/puzzleFlows";

export const QR3_EDUARDO_HOUSE_CHAT_FLOW: PuzzleFlow = {
  packId: "eduardo-house-chat",
  puzzleId: "eduardo-house-chat",

  // deps: ['qr2']
  requires: { type: "story", node: "qr2-puzzle" },

  // ✅ Fin Chat 1 → storyNode = "eduardo-house-board"
  onSuccess: { storyNode: "eduardo-house-board-chat" },

  blockedMessage: "Todavía no podés acceder a esta secuencia.",
  steps: [
    {
      prompt: [
        "Arcos 3271.",
        "",
        "El ascensor tarda.",
        "O tarda lo mismo, pero hoy se siente más largo.",
        "",
        "Cuando llegás al piso, el pasillo está limpio.",
        "Sin olores raros. Sin ruido.",
        "",
        "Igual te agarra esa sensación de estar hablando fuerte aunque no digas nada.",
      ],
      choices: [{ id: "ring_1", label: "Tocar timbre" }, { id: "wait", label: "Esperar un momento" }],
      choiceReplies: {
        wait: {
          messages: ["Esperás.", "El silencio no cambia.", "Tocás igual."],
          advance: false,
        },
        ring_1: {
          messages: ["Tocás una vez.", "Te quedás quieto.", "No se escucha movimiento adentro."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: ["Te sorprende lo fácil que se te seca la boca.", "", "Mirás la puerta de al lado, por reflejo.", "La mirás como si alguien pudiera mirar desde ahí.", "", "Volvés al timbre."],
      choices: [
        { id: "ring_2", label: "Tocar otra vez" },
        { id: "knock_soft", label: "Golpear suave" },
      ],
      choiceReplies: {
        knock_soft: {
          messages: ["Golpeás suave con los nudillos.", "Esperás.", "Nada."],
          advance: false,
        },
        ring_2: {
          messages: ["Tocás de nuevo.", "Más firme.", "No hay pasos. No hay voz. No hay nada."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "No te asusta que no responda.",
        "Te molesta que no haya ni una señal.",
        "",
        "Ni una cadena.",
        "Ni un roce.",
        "Ni un ‘¿quién es?’.",
        "",
        "Como si adentro no hubiera aire.",
      ],
      choices: [
        { id: "ring_3", label: "Tocar por última vez" },
        { id: "step_back", label: "Alejarte y mirar el marco" },
      ],
      choiceReplies: {
        step_back: {
          messages: [
            "Te alejás medio paso.",
            "Mirás el marco de la puerta.",
            "La cerradura.",
            "La madera cerca del pestillo.",
            "Volvés.",
          ],
          advance: false,
        },
        ring_3: {
          messages: ["Tocás una tercera vez.", "Y al bajar la mano… lo notás."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: ["La puerta está corrida.", "Apenas.", "", "No lo suficiente como para que parezca abierta.", "Lo suficiente como para que te des cuenta."],
      choices: [
        { id: "knock_announce", label: "Golpear y avisar" },
        { id: "enter", label: "Empujar y entrar" },
        { id: "leave", label: "Irte" },
      ],
      choiceReplies: {
        leave: {
          messages: ["Te quedás con esa idea en la cabeza.", "No te vas."],
          advance: false,
        },
        knock_announce: {
          messages: ["Golpeás dos veces.", "—¿Señor Eduardo?", "Esperás.", "Nada."],
          advance: false,
        },
        enter: {
          messages: ["Empujás con cuidado.", "La puerta abre sin ruido.", "Entrás."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "Adentro la temperatura es distinta.",
        "Apenas.",
        "",
        "No es frío. No es calor.",
        "Es aire quieto.",
        "",
        "Cerrás la puerta sin cerrarla del todo.",
        "Te quedás con el picaporte en la mano un segundo más de lo necesario.",
      ],
      choices: [
        { id: "announce", label: "Anunciarte" },
        { id: "advance", label: "Avanzar" },
      ],
      choiceReplies: {
        announce: {
          messages: [
            "Señor Eduardo.",
            "Vengo de parte de Fiscalía. Estamos realizando una investigación.",
            "Tu voz rebota contra el living.",
            "No contesta nadie.",
          ],
          advance: false,
        },
        advance: {
          messages: ["Avanzás despacio.", "Dos pasos.", "Parás."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "Hay luz prendida en el living.",
        "Blanca.",
        "Uniforme.",
        "",
        "Te hace ver todo demasiado claro.",
        "Y aun así sentís que no estás viendo lo importante.",
      ],
      choices: [
        { id: "look", label: "Mirar alrededor" },
        { id: "back_to_door", label: "Volver a la puerta" },
      ],
      choiceReplies: {
        back_to_door: {
          messages: ["Volvés a la puerta.", "La puerta sigue corrida, igual que cuando entraste.", "Eso te molesta más de lo que debería."],
          advance: false,
        },
        look: {
          messages: ["Mirás alrededor.", "Te obligás a no apurarte."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "Una silla corrida.",
        "Papeles arriba de la mesa sin ordenar.",
        "Una carpeta abierta.",
        "",
        "No parece robo.",
        "Tampoco parece abandono.",
        "",
        "Parece… que alguien estaba en algo y lo dejó a mitad.",
      ],
      choices: [
        { id: "stay_near_exit", label: "Quedarte cerca de la salida" },
        { id: "walk_in", label: "Caminar un poco más" },
      ],
      choiceReplies: {
        stay_near_exit: {
          messages: ["Te quedás donde podés salir rápido.", "Desde ahí mirás todo.", "No alcanza."],
          advance: false,
        },
        walk_in: {
          messages: ["Caminás un poco más.", "La madera del piso suena apenas.", "Te molesta que suene."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "Al principio no lo reconocés como “algo”.",
        "",
        "Es una textura en la pared.",
        "Cinta pegada donde no va cinta.",
        "Papel donde no va papel.",
        "",
        "Mirás de nuevo y te das cuenta de que no es desorden.",
        "Es armado.",
      ],
      choices: [
        { id: "approach", label: "Acercarte" },
        { id: "look_from_here", label: "Mirar desde donde estás" },
      ],
      choiceReplies: {
        look_from_here: {
          messages: ["Te quedás donde estás.", "No podés leer nada.", "Solo ves que ocupa demasiado."],
          advance: false,
        },
        approach: {
          messages: ["Te acercás despacio.", "Lo suficiente para distinguir cosas."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "La pared está usada.",
        "",
        "Usada como se usa una mesa, un cuaderno, un pizarrón.",
        "",
        "Hay impresiones pegadas una arriba de otra.",
        "Hay marcas de fibrón que atraviesan papel y terminan en el revoque.",
        "Hay flechas hechas rápido, torcidas, corregidas encima.",
        "",
        "Hay lugares donde la cinta ya se despegó y volvió a pegarse en el mismo punto.",
        "Como insistencia.",
      ],
      choices: [
        { id: "keep_reading", label: "Seguir mirando" },
        { id: "step_back", label: "Alejarte un poco" },
      ],
      choiceReplies: {
        step_back: {
          messages: ["Te alejás medio paso.", "Te cuesta abarcarlo entero.", "Volvés a acercarte igual."],
          advance: false,
        },
        keep_reading: {
          messages: ["Te quedás frente a la pared.", "Leés sin orden.", "Como se lee algo que no te pide permiso."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "Hay nombres.",
        "Fechas.",
        "Direcciones.",
        "",
        "Cosas que reconocés.",
        "Otras que no.",
        "",
        "Lo primero que te parte la expectativa no es lo que hay.",
        "Es cuánto hay.",
        "",
        "Nadie arma esto “en un rato”.",
        "Esto es… vivir mirando lo mismo, hasta gastarlo.",
      ],
      choices: [
        { id: "find_sofia", label: "Buscar 'Sofía Rivas'" },
        { id: "scan_repetition", label: "Mirar qué se repite" },
      ],
      choiceReplies: {
        scan_repetition: {
          messages: ["Buscás repeticiones.", "Las encontrás rápido.", "Eso te deja peor, porque significa que alguien ya pasó por ahí cien veces."],
          advance: false,
        },
        find_sofia: {
          messages: ["Buscás 'Sofía Rivas'.", "Está.", "Y no está sola."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "Encontrás el nombre de Sofía.",
        "Te anclás ahí, por reflejo.",
        "",
        "Al lado hay fotos impresas en baja calidad.",
        "Hay recortes.",
        "Hay cosas subrayadas con birome como si alguien quisiera atravesar el papel.",
        "",
        "Y hay flechas que salen de Sofía y van a lugares que no cierran con un padre desesperado.",
        "",
        "Esa es la primera vez que te quedás quieto de verdad.",
      ],
      choices: [
        { id: "look_whole", label: "Mirar el tablero entero" },
        { id: "get_closer", label: "Acercarte más" },
      ],
      choiceReplies: {
        get_closer: {
          messages: [
            "Te acercás más.",
            "Te das cuenta de que hay cosas escritas encima de impresiones viejas.",
            "Como si lo más importante no fuera el documento. Fuera la nota arriba.",
          ],
          advance: false,
        },
        look_whole: {
          messages: ["Dás un paso atrás para verlo entero.", "No entra en el living.", "Ni debería."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      prompt: [
        "No te da miedo.",
        "Te da algo peor:",
        "El que hizo esto no lo hizo para que alguien lo vea.",
        "",
        "Lo hizo para poder seguir mirando cuando ya no se podía mirar más.",
      ],
      choices: [{ id: "show_board", label: "Ver una foto del tablero" }],
      choiceReplies: {
        show_board: {
          messages: [
            "Sacás una foto.",
            "Y recién ahí te cae lo absurdo: estás sacándole una foto a una pared que parece un expediente vivo.",
          ],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
    },

    {
      // ✅ Imagen en chat: el backend devuelve referencia al pack
      prompt: [{ type: "packFile", fileId: "eduardo_board_wall" }],
      choices: [{ id: "open_board", label: "Ver el tablero por partes" }],
      choiceReplies: {
        open_board: {
          messages: ["Abrís el tablero en detalle."],
          advance: true,
        },
      },
      check: () => true,
      okMessages: [],
      badMessages: ["Elegí una opción."],
      effectsOnDone: { saveField: "qr3.eduardo_house.open_board" },
    },
  ],
};
