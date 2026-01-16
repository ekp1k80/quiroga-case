// src/data/types.ts
export type Folder = {
  id: string;
  name: string;
  order?: number;
};

export type LibraryItem = {
  id: string;
  type: "audio" | "doc";
  title: string;
  folderId: string;
  storagePath: string; // path dentro del bucket
  requires?: string[]; // puzzles requeridos
  order?: number;
};
