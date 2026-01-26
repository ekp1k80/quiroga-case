// src/hooks/useRtdbValue.ts
"use client";

import { useEffect, useState } from "react";
import { onValue, ref, type DatabaseReference } from "firebase/database";
import { rtdbClient } from "@/lib/firebaseClient";

export function useRtdbValue<T>(path: string) {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
    

  useEffect(() => {
    const db = rtdbClient();
    console.log("useRtdbValue", db, path)
    const r: DatabaseReference = ref(db, path);

    const unsub = onValue(
      r,
      (snap) => {
        console.log("snap")
        console.log(snap.val())
        setValue((snap.val() ?? null) as T | null);
        setError(null);
      },
      () => setError("No se pudo leer RTDB")
    );

    return () => unsub();
  }, [path]);

  return { value, error };
}
