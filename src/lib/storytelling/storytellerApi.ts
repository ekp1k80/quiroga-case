// src/lib/storytelling/storytellerApi.ts
import type { ApiResponseBase } from "@/types/effects";

type ProgressAdvanced = { from: string; to: string };
export type StorytellerDoneRes = ApiResponseBase & { advanced?: ProgressAdvanced };

export async function notifyStorytellerSeen(sceneId: string): Promise<StorytellerDoneRes> {
  const res = await fetch("/api/progress/storytelling-done", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sceneId }),
  });

  if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
  return (await res.json()) as StorytellerDoneRes;
}
