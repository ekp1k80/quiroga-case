import type { SocialPost as UiPost } from "./PostCard";

export type SocialPost = UiPost & {
  spawnedAtMs: number;
};

export type SocialEvent =
  | { t: number; type: "spawn"; post: Omit<SocialPost, "counts" | "spawnedAtMs"> }
  | { t: number; type: "inc"; postId: string; likes?: number; comments?: number; shares?: number; sfx?: "tick" | "pop" | "swish" }
  | { t: number; type: "cut" };
