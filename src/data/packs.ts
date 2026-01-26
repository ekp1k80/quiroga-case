import type { AccessRule, StoryNode } from "@/data/levels";

export type AudioVizConfig = {
  gain: number;
  minBinFrac: number;
  gate: number;
  gateSoft: number;
};

export type AudioPackFile = {
  notShowFileViewer?: boolean
  id: string;
  type: "audio";
  title: string;
  key: string; // R2 key
  viz?: AudioVizConfig;
};

export type DocPackFile = {
  notShowFileViewer?: boolean
  id: string;
  type: "doc";
  title: string;
  key: string; // R2 key
};

export type ImgPackFile = {
  notShowFileViewer?: boolean
  id: string;
  type: "img";
  title: string;
  key: string; // R2 key
  alt?: string;
  width?: number;
  height?: number;
};

export type PackFile = AudioPackFile | DocPackFile | ImgPackFile;

export type Pack = {
  id: string;
  requires?: AccessRule;
  files: PackFile[];
};

export const PACKS: Record<string, Pack> = {
  'chat-to-school-1': {
    id: "chat-to-school-1",
    requires: { type: "story", node: "chat-to-school-1" satisfies StoryNode },
    files: [
      {
        id: "act3/foto_encuadrada.png",
        type: "img",
        title: "Foto Sofia - Hallada en casa de Hector - Tiene un recorte diario doblado adjunto",
        key: "act3/foto_encuadrada.png",
      },
      {
        id: "act3/recorte_diario_sofia_page.jpg",
        type: "img",
        title: "Recorte de diario 15/10/20",
        key: "act3/recorte_diario_sofia_page.jpg",
        notShowFileViewer: true
      },
      {
        id: "act3/billetera.png",
        type: "img",
        title: "Wallet crypto - Hallada en casa de Hector",
        key: "act3/billetera.png",
      },
      {
        id: "act3/sospechoso.png",
        type: "img",
        title: "Foto de sospechoso",
        key: "act3/sospechoso.png",
      },
      {
        id: "act3/tatuaje.png",
        type: "img",
        title: "Post-it - Hallado en casa de Hector",
        key: "act3/tatuaje.png",
      },
      {
        id: "act3/usb.png",
        type: "img",
        title: "USB - Hallado en casa de Hector",
        key: "act3/usb.png",
      },
    ],
  },
  'chat-to-school-2': {
    id: "chat-to-school-2",
    requires: { type: "story", node: "chat-to-school-2" satisfies StoryNode },
    files: [
      {
        id: "act3/foto_encuadrada.png",
        type: "img",
        title: "Foto Sofia - Hallada en casa de Hector",
        key: "act3/foto_encuadrada.png",
      },
      {
        id: "act3/recorte_diario_sofia.pdf",
        type: "doc",
        title: "Recorte de diario 15/10/20",
        key: "act3/recorte_diario_sofia.pdf",
      },
      {
        id: "act3/billetera.png",
        type: "img",
        title: "Wallet crypto - Hallada en casa de Hector",
        key: "act3/billetera.png",
      },
      {
        id: "act3/sospechoso.png",
        type: "img",
        title: "Foto de sospechoso",
        key: "act3/sospechoso.png",
      },
      {
        id: "act3/tatuaje.png",
        type: "img",
        title: "Post-it - Hallado en casa de Hector",
        key: "act3/tatuaje.png",
      },
      {
        id: "act3/usb.png",
        type: "img",
        title: "USB - Hallado en casa de Hector",
        key: "act3/usb.png",
      },
    ],
  },
  'the-radio-audio': {
    id: "the-radio-audio",
    requires: { type: "story", node: "the-radio-audio" satisfies StoryNode },
    files: [
      {
        id: "act3/the_radio.mp3",
        type: "audio",
        title: "Radio en la calle",
        key: "act3/the_radio.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
    ],
  },
  'qr2-puzzle': {
    id: "qr2-puzzle",
    requires: { type: "story", node: "qr2-puzzle" satisfies StoryNode },
    files: [
      {
        id: "act3/qr2/AUDIO 02 - Mesa de Entradas - llamada registrada.mp3",
        type: "audio",
        title: "AUDIO 02 - Mesa de Entradas - llamada registrada",
        key: "act3/qr2/AUDIO 02 - Mesa de Entradas - llamada registrada.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 03 - Eduardo - declaración inicial (extracto).mp3",
        type: "audio",
        title: "AUDIO 03 - Eduardo - declaración inicial (extracto)",
        key: "act3/qr2/AUDIO 03 - Eduardo - declaración inicial (extracto).mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 05 - Directora - declaración institucional.mp3",
        type: "audio",
        title: "AUDIO 05 - Directora - declaración institucional",
        key: "act3/qr2/AUDIO 05 - Directora - declaración institucional.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 06 - Preceptor.mp3",
        type: "audio",
        title: "AUDIO 06 - Preceptor",
        key: "act3/qr2/AUDIO 06 - Preceptor.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 07 - Eduardo - declaración inicial (extracto 2do).mp3",
        type: "audio",
        title: "AUDIO 07 - Eduardo - declaración inicial (extracto 2do)",
        key: "act3/qr2/AUDIO 07 - Eduardo - declaración inicial (extracto 2do).mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 08 - Defensa del colegio.mp3",
        type: "audio",
        title: "AUDIO 08 - Defensa del colegio",
        key: "act3/qr2/AUDIO 08 - Defensa del colegio.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 09 - Operadora 911 (día de un incidente).mp3",
        type: "audio",
        title: "AUDIO 09 - Operadora 911 (día de un incidente)",
        key: "act3/qr2/AUDIO 09 - Operadora 911 (día de un incidente).mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 10 - Periodista - recorte radial.mp3",
        type: "audio",
        title: "AUDIO 10 - Periodista - recorte radial",
        key: "act3/qr2/AUDIO 10 - Periodista - recorte radial.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 11 - Audio ambiente - pasillo tribunal.mp3",
        type: "audio",
        title: "AUDIO 11 - Audio ambiente - pasillo tribunal",
        key: "act3/qr2/AUDIO 11 - Audio ambiente - pasillo tribunal.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/Acta_Declaraciones_Cruzadas_Sofia_Rivas_MAIL.pdf",
        type: "doc",
        title: "Acta_Declaraciones_Cruzadas_Sofia_Rivas_MAIL",
        key: "act3/qr2/Acta_Declaraciones_Cruzadas_Sofia_Rivas_MAIL.pdf",
      },
      {
        id: "act3/qr2/Amiga de Sofía - entrevista (no judicial).pdf",
        type: "doc",
        title: "Amiga de Sofía - entrevista (no judicial)",
        key: "act3/qr2/Amiga de Sofía - entrevista (no judicial).pdf",
      },
      {
        id: "act3/qr2/Documento legales - Informe de porteria.pdf",
        type: "doc",
        title: "Documento legales - Informe de porteria",
        key: "act3/qr2/Documento legales - Informe de porteria.pdf",
      },
      {
        id: "act3/qr2/Documento legales - Informe pericial psicológico.pdf",
        type: "doc",
        title: "Documento legales - Informe pericial psicológico",
        key: "act3/qr2/Documento legales - Informe pericial psicológico.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Acta de Matrimonio - Córdoba Rivas.pdf",
        type: "doc",
        title: "Documentos legales - Acta de Matrimonio - Córdoba Rivas",
        key: "act3/qr2/Documentos legales - Acta de Matrimonio - Córdoba Rivas.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Acta de denuncia por desaparición.pdf",
        type: "doc",
        title: "Documentos legales - Acta de denuncia por desaparición",
        key: "act3/qr2/Documentos legales - Acta de denuncia por desaparición.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Colegio_ informe.pdf",
        type: "doc",
        title: "Documentos legales - Colegio_ informe",
        key: "act3/qr2/Documentos legales - Colegio_ informe.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Constancia de domicilio.pdf",
        type: "doc",
        title: "Documentos legales - Constancia de domicilio",
        key: "act3/qr2/Documentos legales - Constancia de domicilio.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Divorcio.pdf",
        type: "doc",
        title: "Documentos legales - Divorcio",
        key: "act3/qr2/Documentos legales - Divorcio.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Nota de la defensa del colegio.pdf",
        type: "doc",
        title: "Documentos legales - Nota de la defensa del colegio",
        key: "act3/qr2/Documentos legales - Nota de la defensa del colegio.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Oficio pedido por cámaras - denegatoria.pdf",
        type: "doc",
        title: "Documentos legales - Oficio pedido por cámaras - denegatoria",
        key: "act3/qr2/Documentos legales - Oficio pedido por cámaras - denegatoria.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Proveido fiscal.pdf",
        type: "doc",
        title: "Documentos legales - Proveido fiscal",
        key: "act3/qr2/Documentos legales - Proveido fiscal.pdf",
      },
      {
        id: "act3/qr2/Juicio_Sofia_Rivas_Actas_Declaraciones_Cruzadas.pdf",
        type: "doc",
        title: "Juicio_Sofia_Rivas_Actas_Declaraciones_Cruzadas",
        key: "act3/qr2/Juicio_Sofia_Rivas_Actas_Declaraciones_Cruzadas.pdf",
      },
      {
        id: "act3/qr2/Juicio_Sofia_Rivas_Notas_Psicologicas.pdf",
        type: "doc",
        title: "Juicio_Sofia_Rivas_Notas_Psicologicas",
        key: "act3/qr2/Juicio_Sofia_Rivas_Notas_Psicologicas.pdf",
      },
      {
        id: "act3/qr2/Recorte de prensa sobre desaparición de Sofía.png",
        type: "img",
        title: "Recorte de prensa sobre desaparición de Sofía",
        key: "act3/qr2/Recorte de prensa sobre desaparición de Sofía.png",
      },
      
    ],
  },
  'eduardo-house-chat': {
    id: "eduardo-house-chat",
    requires: { type: "story", node: "eduardo-house-chat" satisfies StoryNode },
    files:[
      {
        id: "act4/BoardImagen.png",
        type: "img",
        title: "Foto de pared en la casa de Eduardo",
        key: "act4/BoardImagen.png",
      },
    ],
  },
  'eduardo-house-board-chat': {
    id: "eduardo-house-board-chat",
    requires: { type: "story", node: "eduardo-house-board-chat" satisfies StoryNode },
    files:[
      {
        id: "act4/BoardImagen.png",
        type: "img",
        title: "Foto de pared en la casa de Eduardo",
        key: "act4/BoardImagen.png",
      },
      {
        id: "act4/Board - Captadores - intermediarios.pdf",
        type: "doc",
        title: "Board - Captadores - intermediarios",
        key: "act4/Board - Captadores - intermediarios.pdf",
      },
      {
        id: "act4/Board - Chantaje digital.pdf",
        type: "doc",
        title: "Board - Chantaje digital",
        key: "act4/Board - Chantaje digital.pdf",
      },
      {
        id: "act4/Board - Incautacion droga.pdf",
        type: "doc",
        title: "Board - Incautacion droga",
        key: "act4/Board - Incautacion droga.pdf",
      },
      {
        id: "act4/Board - Lavado.pdf",
        type: "doc",
        title: "Board - Lavado",
        key: "act4/Board - Lavado.pdf",
      },
      {
        id: "act4/Board - Lugares Mapa.pdf",
        type: "doc",
        title: "Board - Lugares Mapa",
        key: "act4/Board - Lugares Mapa.pdf",
      },
      {
        id: "act4/Board - Proteccion institucional.pdf",
        type: "doc",
        title: "Board - Proteccion institucional",
        key: "act4/Board - Proteccion institucional.pdf",
      },
      {
        id: "act4/Board - VIPs.pdf",
        type: "doc",
        title: "Board - VIPs",
        key: "act4/Board - VIPs.pdf",
      },
      {
        id: "act4/Board - Victimas.pdf",
        type: "doc",
        title: "Board - Victimas",
        key: "act4/Board - Victimas.pdf",
      },
    ],
  },
  'casa-maria-cordoba': {
    id: "qr3",
    requires: { type: "story", node: "casa-maria-cordoba" satisfies StoryNode },
    files:[
      {
        id: "act4/interrogatorio_maria.mp3",
        type: "audio",
        title: "Interrogatorio Maria",
        key: "act4/interrogatorio_maria.mp3",
      },
    ],
  },
  'recapitulacion-maria': {
    id: "recapitulacion-maria",
    requires: { type: "story", node: "recapitulacion-maria" satisfies StoryNode },
    files:[
      {
        id: "act4/recapitulacion_maria.mp3",
        type: "audio",
        title: "Recapitulacion",
        key: "act4/recapitulacion_maria.mp3",
      },
    ],
  },
  'llegada-casa-beatriz': {
    id: "llegada-casa-beatriz",
    requires: { type: "story", node: "llegada-casa-beatriz" satisfies StoryNode },
    files:[
      {
        id: "act4/llegada_casa_beatriz.mp3",
        type: "audio",
        title: "Llegada a casa de Beatriz",
        key: "act4/llegada_casa_beatriz.mp3",
      },
    ],
  },
  'beatriz-abre-puerta': {
    id: "beatriz-abre-puerta",
    requires: { type: "story", node: "beatriz-abre-puerta" satisfies StoryNode },
    files:[
      {
        id: "act4/beatriz_abre_la_puerta.mp3",
        type: "audio",
        title: "Beatriz abre la puerta",
        key: "act4/beatriz_abre_la_puerta.mp3",
      },
    ],
  },
  'martin-entra-habitacion-eduardo': {
    id: "martin-entra-habitacion-eduardo",
    requires: { type: "story", node: "martin-entra-habitacion-eduardo" satisfies StoryNode },
    files:[
      {
        id: "act4/martin_entra_habitacion_eduardo.mp3",
        type: "audio",
        title: "Martin entra a la habitacion de Eduardo",
        key: "act4/martin_entra_habitacion_eduardo.mp3",
      },
    ],
  },
  'qr3_antes': {
    id: "qr3_antes",
    requires: { type: "story", node: "qr3" satisfies StoryNode },
    files:[
       {
        id: "act3/qr2/AUDIO 02 - Mesa de Entradas - llamada registrada.mp3",
        type: "audio",
        title: "AUDIO 02 - Mesa de Entradas - llamada registrada",
        key: "act3/qr2/AUDIO 02 - Mesa de Entradas - llamada registrada.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 03 - Eduardo - declaración inicial (extracto).mp3",
        type: "audio",
        title: "AUDIO 03 - Eduardo - declaración inicial (extracto)",
        key: "act3/qr2/AUDIO 03 - Eduardo - declaración inicial (extracto).mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 05 - Directora - declaración institucional.mp3",
        type: "audio",
        title: "AUDIO 05 - Directora - declaración institucional",
        key: "act3/qr2/AUDIO 05 - Directora - declaración institucional.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 06 - Preceptor.mp3",
        type: "audio",
        title: "AUDIO 06 - Preceptor",
        key: "act3/qr2/AUDIO 06 - Preceptor.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 07 - Eduardo - declaración inicial (extracto 2do).mp3",
        type: "audio",
        title: "AUDIO 07 - Eduardo - declaración inicial (extracto 2do)",
        key: "act3/qr2/AUDIO 07 - Eduardo - declaración inicial (extracto 2do).mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 08 - Defensa del colegio.mp3",
        type: "audio",
        title: "AUDIO 08 - Defensa del colegio",
        key: "act3/qr2/AUDIO 08 - Defensa del colegio.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 09 - Operadora 911 (día de un incidente).mp3",
        type: "audio",
        title: "AUDIO 09 - Operadora 911 (día de un incidente)",
        key: "act3/qr2/AUDIO 09 - Operadora 911 (día de un incidente).mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 10 - Periodista - recorte radial.mp3",
        type: "audio",
        title: "AUDIO 10 - Periodista - recorte radial",
        key: "act3/qr2/AUDIO 10 - Periodista - recorte radial.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/AUDIO 11 - Audio ambiente - pasillo tribunal.mp3",
        type: "audio",
        title: "AUDIO 11 - Audio ambiente - pasillo tribunal",
        key: "act3/qr2/AUDIO 11 - Audio ambiente - pasillo tribunal.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act3/qr2/Acta_Declaraciones_Cruzadas_Sofia_Rivas_MAIL.pdf",
        type: "doc",
        title: "Acta_Declaraciones_Cruzadas_Sofia_Rivas_MAIL",
        key: "act3/qr2/Acta_Declaraciones_Cruzadas_Sofia_Rivas_MAIL.pdf",
      },
      {
        id: "act3/qr2/Amiga de Sofía - entrevista (no judicial).pdf",
        type: "doc",
        title: "Amiga de Sofía - entrevista (no judicial)",
        key: "act3/qr2/Amiga de Sofía - entrevista (no judicial).pdf",
      },
      {
        id: "act3/qr2/Documento legales - Informe de porteria.pdf",
        type: "doc",
        title: "Documento legales - Informe de porteria",
        key: "act3/qr2/Documento legales - Informe de porteria.pdf",
      },
      {
        id: "act3/qr2/Documento legales - Informe pericial psicológico.pdf",
        type: "doc",
        title: "Documento legales - Informe pericial psicológico",
        key: "act3/qr2/Documento legales - Informe pericial psicológico.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Acta de Matrimonio - Córdoba Rivas.pdf",
        type: "doc",
        title: "Documentos legales - Acta de Matrimonio - Córdoba Rivas",
        key: "act3/qr2/Documentos legales - Acta de Matrimonio - Córdoba Rivas.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Acta de denuncia por desaparición.pdf",
        type: "doc",
        title: "Documentos legales - Acta de denuncia por desaparición",
        key: "act3/qr2/Documentos legales - Acta de denuncia por desaparición.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Colegio_ informe.pdf",
        type: "doc",
        title: "Documentos legales - Colegio_ informe",
        key: "act3/qr2/Documentos legales - Colegio_ informe.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Constancia de domicilio.pdf",
        type: "doc",
        title: "Documentos legales - Constancia de domicilio",
        key: "act3/qr2/Documentos legales - Constancia de domicilio.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Divorcio.pdf",
        type: "doc",
        title: "Documentos legales - Divorcio",
        key: "act3/qr2/Documentos legales - Divorcio.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Nota de la defensa del colegio.pdf",
        type: "doc",
        title: "Documentos legales - Nota de la defensa del colegio",
        key: "act3/qr2/Documentos legales - Nota de la defensa del colegio.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Oficio pedido por cámaras - denegatoria.pdf",
        type: "doc",
        title: "Documentos legales - Oficio pedido por cámaras - denegatoria",
        key: "act3/qr2/Documentos legales - Oficio pedido por cámaras - denegatoria.pdf",
      },
      {
        id: "act3/qr2/Documentos legales - Proveido fiscal.pdf",
        type: "doc",
        title: "Documentos legales - Proveido fiscal",
        key: "act3/qr2/Documentos legales - Proveido fiscal.pdf",
      },
      {
        id: "act3/qr2/Juicio_Sofia_Rivas_Actas_Declaraciones_Cruzadas.pdf",
        type: "doc",
        title: "Juicio_Sofia_Rivas_Actas_Declaraciones_Cruzadas",
        key: "act3/qr2/Juicio_Sofia_Rivas_Actas_Declaraciones_Cruzadas.pdf",
      },
      {
        id: "act3/qr2/Juicio_Sofia_Rivas_Notas_Psicologicas.pdf",
        type: "doc",
        title: "Juicio_Sofia_Rivas_Notas_Psicologicas",
        key: "act3/qr2/Juicio_Sofia_Rivas_Notas_Psicologicas.pdf",
      },
      {
        id: "act3/qr2/Recorte de prensa sobre desaparición de Sofía.png",
        type: "img",
        title: "Recorte de prensa sobre desaparición de Sofía",
        key: "act3/qr2/Recorte de prensa sobre desaparición de Sofía.png",
      },
      {
        id: "act4/BoardImagen.png",
        type: "img",
        title: "Foto de pared en la casa de Eduardo",
        key: "act4/BoardImagen.png",
      },
      {
        id: "act4/Board - Captadores - intermediarios.pdf",
        type: "doc",
        title: "Board - Captadores - intermediarios",
        key: "act4/Board - Captadores - intermediarios.pdf",
      },
      {
        id: "act4/Board - Chantaje digital.pdf",
        type: "doc",
        title: "Board - Chantaje digital",
        key: "act4/Board - Chantaje digital.pdf",
      },
      {
        id: "act4/Board - Incautacion droga.pdf",
        type: "doc",
        title: "Board - Incautacion droga",
        key: "act4/Board - Incautacion droga.pdf",
      },
      {
        id: "act4/Board - Lavado.pdf",
        type: "doc",
        title: "Board - Lavado",
        key: "act4/Board - Lavado.pdf",
      },
      {
        id: "act4/Board - Lugares Mapa.pdf",
        type: "doc",
        title: "Board - Lugares Mapa",
        key: "act4/Board - Lugares Mapa.pdf",
      },
      {
        id: "act4/Board - Proteccion institucional.pdf",
        type: "doc",
        title: "Board - Proteccion institucional",
        key: "act4/Board - Proteccion institucional.pdf",
      },
      {
        id: "act4/Board - VIPs.pdf",
        type: "doc",
        title: "Board - VIPs",
        key: "act4/Board - VIPs.pdf",
      },
      {
        id: "act4/Board - Victimas.pdf",
        type: "doc",
        title: "Board - Victimas",
        key: "act4/Board - Victimas.pdf",
      },
    ],
  },
  'qr3_presente': {
    id: "qr3_presente",
    requires: { type: "story", node: "qr3" satisfies StoryNode },
    files:[
      {
        id: "act3/tatuaje.png",
        type: "img",
        title: "Post-it - Hallado en casa de Hector",
        key: "act3/tatuaje.png",
      },
      {
        id: "act5/NOTA DE CAMPO - CONTEXTO DE INGRESO.pdf",
        type: "doc",
        title: "NOTA DE CAMPO - CONTEXTO DE INGRESO",
        key: "act5/NOTA DE CAMPO - CONTEXTO DE INGRESO.pdf",
      },
      {
        id: "act5/NOTAS.pdf",
        type: "doc",
        title: "NOTAS",
        key: "act5/NOTAS.pdf",
      },
      {
        id: "act5/REGISTRO N.º 03.pdf",
        type: "doc",
        title: "REGISTRO N.º 03",
        key: "act5/REGISTRO N.º 03.pdf",
      },
      {
        id: "act5/REGISTRO DE HECHOS - OBSERVACIÓN EN CAMPO.pdf",
        type: "doc",
        title: "REGISTRO DE HECHOS - OBSERVACIÓN EN CAMPO",
        key: "act5/REGISTRO DE HECHOS - OBSERVACIÓN EN CAMPO.pdf",
      },
      {
        id: "act5/audio_4.mp3",
        type: "audio",
        title: "audio_4.mp3",
        key: "act5/audio_4.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act5/audio_5.mp3",
        type: "audio",
        title: "audio_5.mp3",
        key: "act5/audio_5.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act5/audio_6.mp3",
        type: "audio",
        title: "audio_6.mp3",
        key: "act5/audio_6.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act5/audio_7.mp3",
        type: "audio",
        title: "audio_7.mp3",
        key: "act5/audio_7.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
    ],
  },
  'qr3_despues': {
    id: "qr3_antes",
    requires: { type: "story", node: "qr3" satisfies StoryNode },
    files:[
      {
        id: "act5/REGISTRO DE ENTREVISTA - AMBITO DOMICILIARIO.pdf",
        type: "doc",
        title: "REGISTRO DE ENTREVISTA - AMBITO DOMICILIARIO",
        key: "act5/REGISTRO DE ENTREVISTA - AMBITO DOMICILIARIO.pdf",
      },
      {
        id: "act4/BoardImagen.png",
        type: "img",
        title: "Foto de pared en la casa de Eduardo",
        key: "act4/BoardImagen.png",
      },
      {
        id: "act5/TRANSCRIPCION LLAMADA.pdf",
        type: "doc",
        title: "TRANSCRIPCION LLAMADA",
        key: "act5/TRANSCRIPCION LLAMADA.pdf",
      },
      {
        id: "act3/tatuaje.png",
        type: "img",
        title: "Post-it - Hallado en casa de Hector",
        key: "act3/tatuaje.png",
      },
      {
        id: "act5/CUERPO MÉDICO FORENSE - INFORME DE AUTOPSIA N.º 17-24.pdf",
        type: "doc",
        title: "CUERPO MÉDICO FORENSE - INFORME DE AUTOPSIA N.º 17-24",
        key: "act5/CUERPO MÉDICO FORENSE - INFORME DE AUTOPSIA N.º 17-24.pdf",
      },
      {
        id: "act5/audio_1.mp3",
        type: "audio",
        title: "audio_1.mp3",
        key: "act5/audio_1.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act5/audio_2.mp3",
        type: "audio",
        title: "audio_2.mp3",
        key: "act5/audio_2.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act5/audio_3.mp3",
        type: "audio",
        title: "audio_3.mp3",
        key: "act5/audio_3.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act5/audio_8.mp3",
        type: "audio",
        title: "audio_8.mp3",
        key: "act5/audio_8.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act5/audio_9.mp3",
        type: "audio",
        title: "audio_9.mp3",
        key: "act5/audio_9.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
    ],
  },
  'hector-mom-final-call': {
    id: "hector-mom-final-call",
    requires: { type: "story", node: "hector-mom-final-call" satisfies StoryNode },
    files:[
      {
        id: "act5/adios_hector.mp3",
        type: "audio",
        title: "Adios Hector",
        key: "act5/adios_hector.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act5/llamada_adios_hector.mp3",
        type: "audio",
        title: "Llamada adios Hector",
        key: "act5/llamada_adios_hector.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "act5/after_llamada_adios_hector.mp3",
        type: "audio",
        title: "Despues de la llamada adios Hector",
        key: "act5/after_llamada_adios_hector.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
    ],
  },
  'eduardo-leaked': {
    id: "eduardo-leaked",
    requires: { type: "story", node: "eduardo-leaked" satisfies StoryNode },
    files:[
      {
        id: "leaked/captura.mp3",
        type: "audio",
        title: "Captura de Eduardo",
        key: "leaked/captura.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "leaked/el_inicio.mp3",
        type: "audio",
        title: "Como inicio todo",
        key: "leaked/el_inicio.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
    ],
  },
  'investigation': {
    id: "investigation",
    requires: { type: "story", node: "investigation" satisfies StoryNode },
    files:[
      {
        id: "act5/apertura_investigacion.png",
        type: "img",
        title: "Aperturas de investigacion",
        key: "act5/apertura_investigacion.png",
      },
      {
        id: "act5/congressman_usa.png",
        type: "img",
        title: "Congressman",
        key: "act5/congressman_usa.png",
      },
      {
        id: "act5/cierre_investigacion.png",
        type: "img",
        title: "Cierre de investigacion",
        key: "act5/cierre_investigacion.png",
      },
      {
        id: "act5/Entrevista final - Maria Noelia.pdfg",
        type: "doc",
        title: "Entrevista final - Maria Noelia",
        key: "act5/Entrevista final - Maria Noelia.pdf",
      },
    ],
  },

  example: {
    id: "level2",
    requires: {
      all: [
        { type: "story", node: "the-radio" satisfies StoryNode },
        { type: "flag", flag: "scanned-qr1" },
      ],
    },
    files: [
      {
        id: "radio2",
        type: "audio",
        title: "Radio - Tanda 2",
        key: "audios/radio-02.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
    ],
  },
};
