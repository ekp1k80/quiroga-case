// src/hooks/useRtdbValue.ts
"use client";

import { useEffect, useState } from "react";
import { onValue, ref, type DatabaseReference } from "firebase/database";
import { rtdbClient } from "@/lib/firebaseClient";

function isValidRtdbPath(path: string) {
  if (!path || !path.trim()) return false;
  return !/[.#$\[\]]/.test(path);
}

export function useRtdbValue<T>(path: string | null | undefined) {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path || !isValidRtdbPath(path)) {
      setValue(null);
      setError(null);
      return;
    }

    const db = rtdbClient();
    const r: DatabaseReference = ref(db, path);

    const unsub = onValue(
      r,
      (snap) => {
        setValue((snap.val() ?? null) as T | null);
        setError(null);
      },
      () => setError("No se pudo leer RTDB")
    );

    return () => unsub();
  }, [path]);

  return { value, error };
}
