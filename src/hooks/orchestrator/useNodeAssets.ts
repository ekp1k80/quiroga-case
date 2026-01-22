// src/hooks/orchestrator/useNodeAssets.ts
"use client";

import { useCallback, useState } from "react";
import { useAssets } from "@/providers/AssetsProvider";
import { resolveAssetReqForNode } from "@/lib/assets/resolveAssetReq";
import type { GameScreen } from "@/lib/resolveScreenFromStoryNode";
import type { Asset } from "@/types/assets";
import type { ApiPackFile } from "@/types/packApi";

export type AssetMap = Record<string, Asset | undefined>;

function addPackAsset(out: AssetMap, packId: string, f: ApiPackFile, a: Asset | null) {
  if (!a) return;

  // Keys redundantes para no romper escenas viejas
  out[f.id] = a;
  out[`${packId}::${f.id}`] = a;
  out[`${packId}/${f.id}`] = a;

  // Si alguien usa el "title" como key (no ideal, pero por las dudas)
  if (f.title) out[f.title] = a;
}

export function useNodeAssets() {
  const assets = useAssets();
  const [storyAssets, setStoryAssets] = useState<AssetMap>({});

  const prefetchForNode = useCallback(
    async (storyNode: string, primary: GameScreen) => {
      const req = resolveAssetReqForNode(storyNode, primary);

      // 1) Prefetch public (si hay)
      if (req.public.length > 0) {
        await assets.prefetchPublic(req.public).catch(() => {});
      }

      // 2) Prefetch packs (en paralelo)
      if (req.packs.length > 0) {
        await Promise.all(
          req.packs.map((pid) => assets.prefetchPack(pid, { prefetch: "all", concurrency: 3 }).catch(() => {}))
        );
      }

      // 3) Construir AssetMap FINAL (public + packs)
      const out: AssetMap = {};

      // public
      for (const p of req.public) {
        const a = assets.getAsset({ kind: "public", path: p });
        if (a) out[p] = a;
      }

      // packs: incluimos TODOS los archivos del pack (si están cacheados, salen ya)
      for (const pid of req.packs) {
        // Asegura manifest
        const files = await assets.loadPack(pid).catch(() => []);
        for (const f of files) {
          // asegura asset (por si prefetch falló/skip)
          await assets.ensurePackFileCached(pid, f.id).catch(() => {});
          const a = assets.getPackAsset(pid, f.id);
          addPackAsset(out, pid, f, a);
        }
      }

      setStoryAssets(out);
    },
    [assets]
  );

  return { storyAssets, prefetchForNode };
}
