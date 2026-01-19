// usePackPrefetch.ts
"use client";

import { PackFile } from "@/data/packs";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

type CacheEntry = {
  blob: Blob;
  objectUrl: string;
  contentType?: string;
};

type Options = {
  prefetch: "audio" | "all" | "none";
  concurrency: number;
};

async function fetchWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
) {
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

export function usePackPrefetch(packId: string, options?: Partial<Options>) {
  const opts: Options = useMemo(
    () => ({
      prefetch: options?.prefetch ?? "audio",
      concurrency: options?.concurrency ?? 3,
    }),
    [options?.prefetch, options?.concurrency]
  );

  const [files, setFiles] = useState<PackFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const inflightRef = useRef<Map<string, Promise<void>>>(new Map());

  const [cacheVersion, setCacheVersion] = useState(0);

  const fetchFileIntoCache = useCallback(async (f: PackFile) => {
    if (cacheRef.current.has(f.id)) return;

    // dedupe inflight
    const existing = inflightRef.current.get(f.id);
    if (existing) return existing;

    const p = (async () => {
      const fileRes = await fetch(`/api/r2-proxy?key=${encodeURIComponent(f.key)}`, {
        cache: "force-cache",
      });
      if (!fileRes.ok) return;

      const blob = await fileRes.blob();
      const objectUrl = URL.createObjectURL(blob);

      cacheRef.current.set(f.id, {
        blob,
        objectUrl,
        contentType: fileRes.headers.get("content-type") ?? undefined,
      });

      setCacheVersion((v) => v + 1);
    })()
      .finally(() => {
        inflightRef.current.delete(f.id);
      });

    inflightRef.current.set(f.id, p);
    return p;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setFiles([]);

      // cleanup cache anterior
      for (const entry of cacheRef.current.values()) URL.revokeObjectURL(entry.objectUrl);
      cacheRef.current = new Map();
      inflightRef.current = new Map();
      setCacheVersion((v) => v + 1);

      try {
        const res = await fetch(`/api/packs/${encodeURIComponent(packId)}`, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error ?? `Pack fetch failed (${res.status})`);
        }

        const packFiles: PackFile[] = data.files ?? [];
        if (cancelled) return;
        setFiles(packFiles);

        if (opts.prefetch === "none") {
          if (!cancelled) setLoading(false);
          return;
        }

        const toPrefetch =
          opts.prefetch === "audio"
            ? packFiles.filter((f) => f.type === "audio")
            : packFiles; // "all"

        await fetchWithConcurrency(toPrefetch, opts.concurrency, async (f) => {
          if (cancelled) return;
          await fetchFileIntoCache(f);
        });

        if (!cancelled) setLoading(false);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) {
          setError(e?.message ?? "Error");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      for (const entry of cacheRef.current.values()) URL.revokeObjectURL(entry.objectUrl);
    };
  }, [packId, opts.prefetch, opts.concurrency, fetchFileIntoCache]);

  function isCached(fileId: string) {
    return cacheRef.current.has(fileId);
  }

  function getObjectUrl(fileId: string) {
    return cacheRef.current.get(fileId)?.objectUrl ?? null;
  }

  function getBlob(fileId: string) {
    return cacheRef.current.get(fileId)?.blob ?? null;
  }

  function getContentType(fileId: string) {
    return cacheRef.current.get(fileId)?.contentType ?? null;
  }

  // ✅ nuevo: traer un archivo si no está cacheado (doc o audio)
  async function ensureCached(fileOrId: PackFile | string) {
    const file =
      typeof fileOrId === "string" ? files.find((f) => f.id === fileOrId) : fileOrId;
    if (!file) return;
    await fetchFileIntoCache(file);
  }

  return {
    files,
    loading,
    error,
    cacheVersion,
    isCached,
    getObjectUrl,
    getBlob,
    getContentType,
    ensureCached, // ✅
  };
}
