// src/lib/resolveScreenFromStoryNode.ts
import type { StoryNode } from "@/data/levels";

export type GameScreen =
  | { kind: "chat"; packId: string; puzzleId: string; title?: string; subtitle?: string }
  | { kind: "files"; packId: string; title?: string }
  | { kind: "qr"; title?: string }
  | { kind: "storyteller"; sceneId: string }
  | { kind: "finalPuzzle"; play: "qr3" };

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
      primary: { kind: "finalPuzzle", play: "qr3" },
      tabs: ["chat", "files", "qr"],
      defaultTab: "chat",
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
  if (storyNode === "before-scan-qr1-chat") {
    return {
      primary: { kind: "chat", packId: "before-scan-qr1-chat", puzzleId: "before-scan-qr1-chat", title: "Llegada a la escuela" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  if (storyNode === "chat-qr1") {
    return {
      primary: { kind: "chat", packId: "chat-qr1", puzzleId: "chat-qr1", title: "Escuela" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  if (storyNode === "before-scan-qr2-chat") {
    return {
      primary: { kind: "chat", packId: "before-scan-qr2-chat", puzzleId: "before-scan-qr2-chat", title: "Vuelta" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  if (storyNode === "qr2-chat") {
    return {
      primary: { kind: "chat", packId: "qr2-chat", puzzleId: "qr2-chat", title: "Desaparición" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  if (storyNode === "qr2-puzzle") {
    return {
      primary: { kind: "chat", packId: "qr2-puzzle", puzzleId: "qr2-puzzle", title: "Desaparición" },
      tabs: baseTabs,
      defaultTab: "files",
    };
  }
  
  if (storyNode === "eduardo-house-chat") {
    return {
      primary: { kind: "chat", packId: "eduardo-house-chat", puzzleId: "eduardo-house-chat", title: "Casa de eduardo" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  if (storyNode === "eduardo-house-board-chat") {
    return {
      primary: { kind: "chat", packId: "eduardo-house-board-chat", puzzleId: "eduardo-house-board-chat", title: "La pared" },
      tabs: baseTabs,
      defaultTab: "files",
    };
  }
  if (storyNode === "eduardo-house-next-chat") {
    return {
      primary: { kind: "chat", packId: "eduardo-house-next-chat", puzzleId: "eduardo-house-next-chat", title: "El hilo" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  if (storyNode === "casa-maria-cordoba") {
    return { primary: { kind: "storyteller", sceneId: "casa-maria-cordoba" }, tabs: baseTabs };
  }
  if (storyNode === "recapitulacion-maria") {
    return { primary: { kind: "storyteller", sceneId: "recapitulacion-maria" }, tabs: baseTabs };
  }
  if (storyNode === "llegada-casa-beatriz") {
    return { primary: { kind: "storyteller", sceneId: "llegada-casa-beatriz" }, tabs: baseTabs };
  }
  if (storyNode === "beatriz-abre-puerta") {
    return { primary: { kind: "storyteller", sceneId: "beatriz-abre-puerta" }, tabs: baseTabs };
  }
  if (storyNode === "martin-entra-habitacion-eduardo") {
    return { primary: { kind: "storyteller", sceneId: "martin-entra-habitacion-eduardo" }, tabs: baseTabs };
  }
  if (storyNode === "before-scan-qr3-chat") {
    return {
      primary: { kind: "chat", packId: "before-scan-qr3-chat", puzzleId: "before-scan-qr3-chat", title: "Huida" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  if (storyNode === "qr3") {
    return {
      primary: { kind: "chat", packId: "qr3", puzzleId: "qr3", title: "Que paso?" },
      tabs: baseTabs,
      defaultTab: "chat",
    };
  }
  
  if (storyNode === "hector-mom-final-call") {
    return { primary: { kind: "storyteller", sceneId: "hector-mom-final-call" }, tabs: baseTabs };
  }
  if (storyNode === "social-app-noise") {
    return { primary: { kind: "storyteller", sceneId: "social-app-noise" }, tabs: baseTabs };
  }
  if (storyNode === "eduardo-leaked") {
    return { primary: { kind: "storyteller", sceneId: "eduardo-leaked" }, tabs: baseTabs };
  }
  if (storyNode === "investigation") {
    return  {
      primary: { kind: "chat", packId: "investigation", puzzleId: "investigation", title: "investigation" },
      tabs: baseTabs,
      defaultTab: "files",
    }
  }
  if (storyNode === "credits") {
    return { primary: { kind: "storyteller", sceneId: "credits" }, tabs: baseTabs };
  }


  // Default: dejalo en chat genérico (o storyteller si lo preferís)
  return {
    primary: { kind: "chat", packId: "intro", puzzleId: "qr2", title: "Terminal" },
    tabs: baseTabs,
    defaultTab: "chat",
  };
}
