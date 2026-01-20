// src/data/puzzles/puzzleFlows.ts
import type { AccessRule, StoryNode } from "@/data/levels";

// ✅ Mensajes tipados: texto o referencia a un archivo del pack
export type ApiMsg = string | { type: "packFile"; fileId: string; caption?: string };

export type ProgressPatch = {
  // avanza historia principal (si aplica)
  storyNode?: StoryNode;

  // cosas laterales
  addFlags?: string[];
  addTags?: string[];
};

export type StepChoice = { id: string; label: string };

export type StepChoiceReply = {
  messages: ApiMsg[];       // ✅ antes string[]
  advance?: boolean;        // default false
};

export type PuzzleStep = {
  // ✅ ahora puede ser texto o "packFile"
  prompt: ApiMsg | ApiMsg[];

  // texto libre usa check; choices ignora check pero existe por compat
  check: (input: string) => boolean;

  // ✅ ok/bad también tipados (por coherencia; podés dejar strings siempre)
  okMessages: ApiMsg[];
  badMessages: ApiMsg[];

  effectsOnDone?: Record<string, any>;

  // choices / branching
  choices?: StepChoice[];
  choiceReplies?: Record<string, StepChoiceReply>;
};

export type PuzzleFlow = {
  packId: string;
  puzzleId: string;

  requires?: AccessRule;
  onSuccess?: ProgressPatch;

  blockedMessage: string;

  steps: PuzzleStep[];
};

export function puzzleKey(packId: string, puzzleId: string) {
  return `${packId}:${puzzleId}`;
}
