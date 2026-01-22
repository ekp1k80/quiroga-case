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
        title: "Radio — Tanda 2",
        key: "audios/radio-02.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
    ],
  },
};
