// src/providers/AssetsProvider.tsx
"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Asset, AssetRef } from "@/types/assets";
import type { ApiPackFile, ApiPackRes } from "@/types/packApi";
import { prefetchPublicAssets, cleanupPublicAssetCache } from "@/lib/assets/publicAssets";

type PrefetchMode = "audio" | "all" | "none";

type PackManifest = {
  files: ApiPackFile[];
  fetchedAt: number;
  expiresAt?: number;
};

type AssetsContextValue = {
  prefetchPublic: (paths: string[]) => Promise<void>;

  loadPack: (packId: string) => Promise<ApiPackFile[]>;
  getPackFiles: (packId: string) => ApiPackFile[] | null;
  prefetchPack: (packId: string, opts?: { prefetch?: PrefetchMode; concurrency?: number }) => Promise<void>;

  ensureAssetCached: (ref: AssetRef) => Promise<void>;
  getAsset: (ref: AssetRef) => Asset | null;
  isAssetCached: (ref: AssetRef) => boolean;

  ensurePackFileCached: (packId: string, fileId: string) => Promise<void>;
  getPackAsset: (packId: string, fileId: string) => Asset | null;

  cacheVersion: number;
};

const AssetsContext = createContext<AssetsContextValue | null>(null);

function packFileKey(packId: string, fileId: string) {
  return `${packId}::${fileId}`;
}

async function fetchWithConcurrency<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  const queue = items.slice();
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) return;
      await worker(item);
    }
  });
  await Promise.all(workers);
}

export function AssetsProvider({ children }: { children: React.ReactNode }) {
  // ✅ Fuente de verdad: refs (no dependen del render)
  const publicAssetsRef = useRef<Map<string, Asset>>(new Map());

  const packManifestRef = useRef<Map<string, PackManifest>>(new Map());
  const packInflightRef = useRef<Map<string, Promise<ApiPackFile[]>>>(new Map());

  const packFileAssetsRef = useRef<Map<string, Asset>>(new Map());
  const packFileInflightRef = useRef<Map<string, Promise<void>>>(new Map());

  const [cacheVersion, setCacheVersion] = useState(0);

  // ---------- Public ----------
  const prefetchPublic = useCallback(async (paths: string[]) => {
    if (!paths.length) return;

    const m = await prefetchPublicAssets(paths);
    for (const [path, asset] of Object.entries(m)) {
      publicAssetsRef.current.set(path, asset as Asset);
    }
    setCacheVersion((v) => v + 1);
  }, []);

  // ---------- Packs: manifest ----------
  const loadPack = useCallback(async (packId: string) => {
    const cached = packManifestRef.current.get(packId);
    if (cached?.files?.length) return cached.files;

    const inflight = packInflightRef.current.get(packId);
    if (inflight) return inflight;

    const p = (async () => {
      const res = await fetch(`/api/packs/${encodeURIComponent(packId)}`, { cache: "no-store" });
      const data = (await res.json()) as ApiPackRes;

      if (!res.ok || !data?.ok || !data.files) {
        throw new Error(data?.error ?? `Pack fetch failed (${res.status})`);
      }

      packManifestRef.current.set(packId, {
        files: data.files,
        fetchedAt: Date.now(),
        expiresAt: data.expiresAt,
      });

      setCacheVersion((v) => v + 1);
      return data.files;
    })().finally(() => {
      packInflightRef.current.delete(packId);
    });

    packInflightRef.current.set(packId, p);
    return p;
  }, []);

  const getPackFiles = useCallback((packId: string) => {
    return packManifestRef.current.get(packId)?.files ?? null;
  }, []);

  // ---------- Packs: file fetch -> Asset ----------
  const fetchPackFileIntoCache = useCallback(async (packId: string, f: ApiPackFile) => {
    const k = packFileKey(packId, f.id);
    if (packFileAssetsRef.current.has(k)) return;

    const inflight = packFileInflightRef.current.get(k);
    if (inflight) return inflight;

    const p = (async () => {
      const r = await fetch(`/api/r2-proxy?url=${encodeURIComponent(f.url)}`, { cache: "force-cache" });
      if (!r.ok) return;

      const blob = await r.blob();
      const src = URL.createObjectURL(blob);

      packFileAssetsRef.current.set(k, { src, blob });
      setCacheVersion((v) => v + 1);
    })().finally(() => {
      packFileInflightRef.current.delete(k);
    });

    packFileInflightRef.current.set(k, p);
    return p;
  }, []);

  const ensurePackFileCached = useCallback(
    async (packId: string, fileId: string) => {
      const files = await loadPack(packId);
      const f = files.find((x) => x.id === fileId);
      if (!f) return;
      await fetchPackFileIntoCache(packId, f);
    },
    [loadPack, fetchPackFileIntoCache]
  );

  const getPackAsset = useCallback((packId: string, fileId: string): Asset | null => {
    return packFileAssetsRef.current.get(packFileKey(packId, fileId)) ?? null;
  }, []);

  const prefetchPack = useCallback(
    async (packId: string, opts?: { prefetch?: PrefetchMode; concurrency?: number }) => {
      const prefetch = opts?.prefetch ?? "audio";
      const concurrency = opts?.concurrency ?? 3;

      const files = await loadPack(packId);
      if (prefetch === "none") return;

      const toPrefetch = prefetch === "audio" ? files.filter((f) => f.type === "audio") : files;

      await fetchWithConcurrency(toPrefetch, concurrency, async (f) => {
        await fetchPackFileIntoCache(packId, f);
      });
    },
    [loadPack, fetchPackFileIntoCache]
  );

  // ---------- Unified API (lee SIEMPRE desde refs) ----------
  const isAssetCached = useCallback((ref: AssetRef) => {
    if (ref.kind === "public") return publicAssetsRef.current.has(ref.path);
    return packFileAssetsRef.current.has(packFileKey(ref.packId, ref.fileId));
  }, []);

  const getAsset = useCallback((ref: AssetRef): Asset | null => {
    if (ref.kind === "public") return publicAssetsRef.current.get(ref.path) ?? null;
    return packFileAssetsRef.current.get(packFileKey(ref.packId, ref.fileId)) ?? null;
  }, []);

  const ensureAssetCached = useCallback(
    async (ref: AssetRef) => {
      if (ref.kind === "public") {
        if (publicAssetsRef.current.has(ref.path)) return;
        await prefetchPublic([ref.path]);
        return;
      }
      await ensurePackFileCached(ref.packId, ref.fileId);
    },
    [prefetchPublic, ensurePackFileCached]
  );

  // ---------- Cleanup global ----------
  useEffect(() => {
    return () => {
      for (const a of packFileAssetsRef.current.values()) {
        try {
          URL.revokeObjectURL(a.src);
        } catch {}
      }
      packFileAssetsRef.current.clear();
      packFileInflightRef.current.clear();
      packManifestRef.current.clear();
      packInflightRef.current.clear();

      cleanupPublicAssetCache();
      publicAssetsRef.current.clear();
    };
  }, []);

  const value = useMemo<AssetsContextValue>(
    () => ({
      prefetchPublic,
      loadPack,
      getPackFiles,
      prefetchPack,

      ensureAssetCached,
      getAsset,
      isAssetCached,

      ensurePackFileCached,
      getPackAsset,

      cacheVersion,
    }),
    [
      prefetchPublic,
      loadPack,
      getPackFiles,
      prefetchPack,
      ensureAssetCached,
      getAsset,
      isAssetCached,
      ensurePackFileCached,
      getPackAsset,
      cacheVersion,
    ]
  );

  return <AssetsContext.Provider value={value}>{children}</AssetsContext.Provider>;
}

export function useAssets() {
  const ctx = useContext(AssetsContext);
  if (!ctx) throw new Error("useAssets must be used inside <AssetsProvider>");
  return ctx;
}
