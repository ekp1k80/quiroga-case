"use client";

import { useEffect, useRef, useState } from "react";

type UsePublicAudioResult = {
  src: string | null;   // objectURL listo para <audio>
  blob: Blob | null;
  loading: boolean;
  error: Error | null;
};

export function usePublicAudio(url?: string): UsePublicAudioResult {
  const [src, setSrc] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // para limpiar correctamente
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url) {
      setSrc(null);
      setBlob(null);
      setLoading(false);
      setError(null);
      return;
    }

    let aborted = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(url as string);
        if (!res.ok) {
          throw new Error(`Failed to fetch audio (${res.status})`);
        }

        const b = await res.blob();
        if (aborted) return;

        const objectUrl = URL.createObjectURL(b);

        // limpiar el anterior si existe
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }

        objectUrlRef.current = objectUrl;
        setBlob(b);
        setSrc(objectUrl);
      } catch (e) {
        if (aborted) return;
        setError(e instanceof Error ? e : new Error("Unknown error"));
        setBlob(null);
        setSrc(null);
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();

    return () => {
      aborted = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [url]);

  return { src, blob, loading, error };
}
