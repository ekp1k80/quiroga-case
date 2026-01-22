// src/hooks/usePrefetchPublicAudio.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Entry = {
  path: string; // "/hospital_main.mp3"
  blob: Blob;
  objectUrl: string;
};

type State = {
  loading: boolean;
  error: string | null;
  version: number;
};

type Options = {
  enabled?: boolean;
  // si querés, podés meter concurrency después; por ahora simple
};

export function usePrefetchPublicAudio(paths: string[], options?: Options) {
  const enabled = options?.enabled ?? true;

  const [state, setState] = useState<State>({ loading: true, error: null, version: 0 });

  const cacheRef = useRef<Map<string, Entry>>(new Map());
  const inflightRef = useRef<Map<string, Promise<void>>>(new Map());

  const normalizedPaths = useMemo(() => {
    // normaliza: asegura que empiece con "/"
    return (paths ?? []).map((p) => (p.startsWith("/") ? p : `/${p}`));
  }, [paths]);

  const prefetchOne = useCallback(async (path: string) => {
    if (cacheRef.current.has(path)) return;

    const inflight = inflightRef.current.get(path);
    if (inflight) return inflight;

    const p = (async () => {
      const res = await fetch(path, { cache: "force-cache" });
      if (!res.ok) throw new Error(`Audio fetch failed: ${path} (${res.status})`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      cacheRef.current.set(path, { path, blob, objectUrl });
      setState((s) => ({ ...s, version: s.version + 1 }));
    })().finally(() => {
      inflightRef.current.delete(path);
    });

    inflightRef.current.set(path, p);
    return p;
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let cancelled = false;

    async function run() {
      setState({ loading: true, error: null, version: 0 });

      // cleanup previo
      for (const e of cacheRef.current.values()) URL.revokeObjectURL(e.objectUrl);
      cacheRef.current = new Map();
      inflightRef.current = new Map();

      try {
        for (const p of normalizedPaths) {
          if (cancelled) return;
          await prefetchOne(p);
        }
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      } catch (e: any) {
        if (!cancelled) setState({ loading: false, error: e?.message ?? "Error", version: 0 });
      }
    }

    run();

    return () => {
      cancelled = true;
      for (const e of cacheRef.current.values()) URL.revokeObjectURL(e.objectUrl);
    };
  }, [enabled, normalizedPaths, prefetchOne]);

  const getObjectUrl = useCallback((path: string) => {
    const key = path.startsWith("/") ? path : `/${path}`;
    return cacheRef.current.get(key)?.objectUrl ?? null;
  }, []);

  const getBlob = useCallback((path: string) => {
    const key = path.startsWith("/") ? path : `/${path}`;
    return cacheRef.current.get(key)?.blob ?? null;
  }, []);

  const ensure = useCallback(
    async (path: string) => {
      const key = path.startsWith("/") ? path : `/${path}`;
      await prefetchOne(key);
    },
    [prefetchOne]
  );

  return {
    loading: state.loading,
    error: state.error,
    version: state.version,
    getObjectUrl,
    getBlob,
    ensure,
  };
}
