// src/lib/assets/assetReq.ts
import { ASSET_REQ_BY_NODE } from "@/data/assetRequirements";
import type { GameScreen } from "@/lib/resolveScreenFromStoryNode";

export function getAssetReq(storyNode: string, primary: GameScreen) {
  const req = ASSET_REQ_BY_NODE[storyNode] ?? { public: [], packs: [] };
  // opcional: derivado automático
  const packs = new Set(req.packs ?? []);
  if (primary.kind === "chat") packs.add(primary.packId);
  if (primary.kind === "files") packs.add(primary.packId);

  return {
    public: req.public ?? [],
    packs: Array.from(packs),
  };
}
