// src/hooks/usePlaySessionRealtime.ts
"use client";

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdbClient } from "@/lib/firebaseRtdbClient";

export type PlaySessionRealtimeState = {
  status?: "forming" | "running" | "done";
  createdAt?: number;
  updatedAt?: number;
  players?: Record<string, { name: string; joinedAt: number }>;
};

export function usePlaySessionRealtime(playSessionId: string | null) {
  const [state, setState] = useState<PlaySessionRealtimeState | null>(null);

  useEffect(() => {
    if (!playSessionId) return;

    const r = ref(rtdbClient, `cq/playSessions/${playSessionId}`);
    const unsub = onValue(r, (snap) => {
      setState(snap.exists() ? (snap.val() as any) : null);
    });

    return () => unsub();
  }, [playSessionId]);

  return state;
}
