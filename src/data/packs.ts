import type { AccessRule, StoryNode } from "@/data/levels";

export type AudioVizConfig = {
  gain: number;
  minBinFrac: number;
  gate: number;
  gateSoft: number;
};

export type AudioPackFile = {
  id: string;
  type: "audio";
  title: string;
  key: string; // R2 key
  viz?: AudioVizConfig;
};

export type DocPackFile = {
  id: string;
  type: "doc";
  title: string;
  key: string; // R2 key
};

export type ImgPackFile = {
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
  intro: {
    id: "intro",
    requires: { type: "story", node: "prologue-1" satisfies StoryNode },
    files: [
      {
        id: "radio1",
        type: "audio",
        title: "Radio — Tanda 1",
        key: "Prologo_del_prologo.mp3",
        viz: { gain: 1.5, minBinFrac: 0.2, gate: 0.1, gateSoft: 0.005 },
      },
      {
        id: "doc1",
        type: "doc",
        title: "Acta PDF — Declaración Cruzada",
        key: "Acta_Declaraciones_Cruzadas_Sofia_Rivas_MAIL.pdf",
      },
    ],
  },

  level2: {
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
