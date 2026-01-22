// src/hooks/usePackPrefetch.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAssets } from "@/providers/AssetsProvider";
import type { ApiPackFile } from "@/types/packApi";

type Options = { prefetch: "audio" | "all" | "none"; concurrency: number };

export function usePackPrefetch(packId: string, options?: Partial<Options>) {
  const opts: Options = useMemo(
    () => ({
      prefetch: options?.prefetch ?? "audio",
      concurrency: options?.concurrency ?? 3,
    }),
    [options?.prefetch, options?.concurrency]
  );

  const assets = useAssets();
  const { loadPack, prefetchPack, isAssetCached, getPackAsset, ensurePackFileCached, cacheVersion } = assets;

  const [files, setFiles] = useState<ApiPackFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const f = await loadPack(packId);
        if (cancelled) return;
        setFiles(f);

        await prefetchPack(packId, { prefetch: opts.prefetch, concurrency: opts.concurrency });

        if (!cancelled) setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Error");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [packId, opts.prefetch, opts.concurrency, loadPack, prefetchPack]);

  const isCached = useCallback(
    (fileId: string) => isAssetCached({ kind: "pack", packId, fileId }),
    [isAssetCached, packId]
  );

  const getObjectUrl = useCallback(
    (fileId: string) => getPackAsset(packId, fileId)?.src ?? null,
    [getPackAsset, packId]
  );

  const getBlob = useCallback(
    (fileId: string) => getPackAsset(packId, fileId)?.blob ?? null,
    [getPackAsset, packId]
  );

  const getContentType = useCallback((_fileId: string) => null, []);

  const ensureCached = useCallback(
    async (fileOrId: ApiPackFile | string) => {
      const id = typeof fileOrId === "string" ? fileOrId : fileOrId.id;
      await ensurePackFileCached(packId, id);
    },
    [ensurePackFileCached, packId]
  );

  return {
    files,
    loading,
    error,
    cacheVersion,
    isCached,
    getObjectUrl,
    getBlob,
    getContentType,
    ensureCached,
  };
}
