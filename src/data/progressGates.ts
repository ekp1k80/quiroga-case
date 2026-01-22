// src/data/progressGates.ts
import type { StoryNode } from "@/data/levels";

export type FilesSeenGate = {
  whenStoryNode: StoryNode;
  packId: string;

  // Si requiredFileIds está vacío => basta con "seenAll"
  requiredFileIds: string[];

  advanceTo: StoryNode;

  addFlags?: string[];
  addTags?: string[];
};

export type StorytellingDoneGate = {
  whenStoryNode: StoryNode;
  sceneId: string;

  advanceTo: StoryNode;

  addFlags?: string[];
  addTags?: string[];
};

// ✅ gates declarativos (server truth)
// (Hoy no tenés pack de Eduardo, pero lo dejamos listo con un placeholder coherente)
export const FILES_SEEN_GATES: FilesSeenGate[] = [
  // EJEMPLO (ajustar packId y fileIds cuando tengas el pack real):
  // {
  //   whenStoryNode: "eduardo-house-board",
  //   packId: "eduardo-house-board",
  //   requiredFileIds: ["eduardo_board_wall", "board_part_1", "board_part_2"],
  //   advanceTo: "eduardo-house-next-chat",
  // },
];

export const STORYTELLING_DONE_GATES: StorytellingDoneGate[] = [
  // EJEMPLO:
  { whenStoryNode: "prologue-1", sceneId: "prologue-1", advanceTo: "res-prologue" },
  { whenStoryNode: "res-prologue", sceneId: "res-prologue", advanceTo: "hector-mom-call" },
  { whenStoryNode: "hector-mom-call", sceneId: "hector-mom-call", advanceTo: "viaje-centragolo-hospital" },
  { whenStoryNode: "viaje-centragolo-hospital", sceneId: "viaje-centragolo-hospital", advanceTo: "hector-house" },
  { whenStoryNode: "hector-house", sceneId: "hector-house", advanceTo: "the-horror" },
  { whenStoryNode: "the-horror", sceneId: "the-horror", advanceTo: "act2-sofia" },
  { whenStoryNode: "act2-sofia", sceneId: "act2-sofia", advanceTo: "act2-the-camera-game" },
  { whenStoryNode: "act2-the-camera-game", sceneId: "act2-the-camera-game", advanceTo: "act2-the-camera-audio" },
  { whenStoryNode: "act2-the-camera-audio", sceneId: "act2-the-camera-audio", advanceTo: "chat-to-school-1" },
  { whenStoryNode: "the-radio-audio", sceneId: "the-radio-audio", advanceTo: "before-scan-qr1-chat" },
];
