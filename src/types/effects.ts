export type Effects =
  | { type: "openTab"; tab: "chat" | "files" | "qr" }
  | { type: "openChat"; packId: string; puzzleId: string; title?: string; subtitle?: string }
  | { type: "openFiles"; packId: string; title?: string }
  | { type: "openStory"; sceneId: string }
  | { type: "navigate"; url: string; newTab?: boolean }
  | { type: "prefetchPacks"; packIds: string[]; prefetch?: "audio" | "all" | "none"; concurrency?: number }
  | { type: "toast"; message: string; tone?: "info" | "success" | "warn" | "error" };

export type EffectsList = Effects[];

export type Advanced = { from: string; to: string };

export type ApiResponseBase = {
  ok: boolean;
  error?: string;
  advanced?: Advanced;
  effects?: EffectsList;
};
