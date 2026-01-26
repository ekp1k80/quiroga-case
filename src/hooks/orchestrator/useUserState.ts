// src/hooks/orchestrator/useUserState.ts
"use client";

import { useCallback, useState } from "react";

type UserStatus = "unknown" | "no-session" | "ready" | "error";

export type UserPayload = {
  id: string;
  name: string;
  storyNode: string;
  flags: string[];
  tags: string[];
  playSessionId: string;
};

type UserRes = { ok: boolean; user?: UserPayload; error?: string };

export function useUserState() {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [status, setStatus] = useState<UserStatus>("unknown");

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/user", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        if (res.status === 401) {
          setStatus("no-session");
          return null;
        }
        throw new Error(data?.error ?? "User fetch failed");
      }

      setUser(data.user);
      setStatus("ready");
      return data.user;
    } catch (e) {
      setStatus("error");
      throw e;
    }
  }, []);

  return { user, setUser, status, fetchUser };
}
