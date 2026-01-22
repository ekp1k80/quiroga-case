// src\lib\assets\resolveAssetReq.ts
import { ASSET_REQ_BY_NODE } from "@/data/assetRequirements";
import type { GameScreen } from "@/lib/resolveScreenFromStoryNode";

export function resolveAssetReqForNode(storyNode: string, primary: GameScreen) {
  const base = ASSET_REQ_BY_NODE[storyNode] ?? {};
  const packs = new Set<string>(base.packs ?? []);
  const pub = new Set<string>(base.public ?? []);

  // derivado automático
  if (primary.kind === "chat") packs.add(primary.packId);
  if (primary.kind === "files") packs.add(primary.packId);

  return { public: Array.from(pub), packs: Array.from(packs) };
}
