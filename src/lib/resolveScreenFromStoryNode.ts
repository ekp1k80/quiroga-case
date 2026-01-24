// src/lib/resolveScreenFromStoryNode.ts
import type { StoryNode } from "@/data/levels";

export type GameScreen =
  | { kind: "chat"; packId: string; puzzleId: string; title?: string; subtitle?: string }
  | { kind: "files"; packId: string; title?: string }
  | { kind: "qr"; title?: string }
  | { kind: "storyteller"; sceneId: string }
  | { kind: "final-puzzle"; storyNode: string };

type ScreenResolve = {
  // pantalla principal (lo que se auto-muestra)
  primary: GameScreen;

  // tabs visibles en navbar (storyteller no va)
  tabs: Array<"chat" | "files" | "qr">;

  // sugerencia opcional: qué tab resaltar
  defaultTab?: "chat" | "files" | "qr";
};

export function resolveScreenFromStoryNode(storyNode: StoryNode): ScreenResolve {
  // ✅ Base: una vez que el juego arrancó, querés poder ir a chat/files/qr
  // (los endpoints igual bloquean si no corresponde)
  const baseTabs: ScreenResolve["tabs"] = ["chat", "files", "qr"];

  if (storyNode === "qr3") {
    return {
      primary: { kind: "final-puzzle", storyNode: "qr3" },
      tabs: ["files"],
      defaultTab: "files",
    };
  }

  // Storyteller scenes (ejemplos; agregás todos los que quieras)
  if (storyNode === "prologue-1") {
    return { primary: { kind: "storyteller", sceneId: "prologue-1" }, tabs: baseTabs };
  }
  if (storyNode === "res-prologue") {
    return { primary: { kind: "storyteller", sceneId: "res-prologue" }, tabs: baseTabs };
  }
  if (storyNode === "hector-mom-call") {
    return { primary: { kind: "storyteller", sceneId: "hector-mom-call" }, tabs: baseTabs };
  }
  if (storyNode === "viaje-centragolo-hospital") {
    return { primary: { kind: "storyteller", sceneId: "viaje-centragolo-hospital" }, tabs: baseTabs };
  }
  if (storyNode === "hector-house") {
    return { primary: { kind: "storyteller", sceneId: "hector-house" }, tabs: baseTabs };
  }
  if (storyNode === "the-horror") {
    return { primary: { kind: "storyteller", sceneId: "the-horror" }, tabs: baseTabs };
  }
  if (storyNode === "act2-sofia") {
    return { primary: { kind: "storyteller", sceneId: "act2-sofia" }, tabs: baseTabs };
  }
  if (storyNode === "act2-the-camera-game") {
    return { primary: { kind: "storyteller", sceneId: "act2-the-camera-game" }, tabs: baseTabs };
  }
  if (storyNode === "act2-the-camera-audio") {
    return { primary: { kind: "storyteller", sceneId: "act2-the-camera-audio" }, tabs: baseTabs };
  }

  // Chats principales por storyNode (ejemplos)
  if (storyNode === "chat-to-school-1") {
    return {
      primary: { kind: "chat", packId: "chat-to-school-1", puzzleId: "chat-to-school-1", title: "Recapitulacion" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  if (storyNode === "chat-to-school-2") {
    return {
      primary: { kind: "chat", packId: "chat-to-school-2", puzzleId: "chat-to-school-2", title: "Recapitulacion" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  if (storyNode === "the-radio-chat") {
    return {
      primary: { kind: "chat", packId: "the-radio-chat", puzzleId: "the-radio-chat", title: "Caminanding..." },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  if (storyNode === "the-radio-audio") {
    return { primary: { kind: "storyteller", sceneId: "the-radio-audio" }, tabs: baseTabs };
  }

  if (storyNode === "eduardo-house-chat") {
    return {
      primary: { kind: "chat", packId: "eduardo-house", puzzleId: "eduardo-house-chat", title: "Terminal" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }

  if (storyNode === "eduardo-house-board") {
    return {
      primary: { kind: "files", packId: "eduardo-house", title: "Tablero de Eduardo" },
      tabs: baseTabs,
      defaultTab: "files",
    };
  }

  // Default: dejalo en chat genérico (o storyteller si lo preferís)
  return {
    primary: { kind: "chat", packId: "intro", puzzleId: "qr2", title: "Terminal" },
    tabs: baseTabs,
    defaultTab: "chat",
  };
}
