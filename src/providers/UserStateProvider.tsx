"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type UserStatus = "unknown" | "no-session" | "ready" | "error";

export type UserPayload = {
  id: string;
  name: string;
  storyNode: string;
  flags: string[];
  tags: string[];
  playSessionId: string;
};

type UserStore = {
  user: UserPayload | null;
  setUser: React.Dispatch<React.SetStateAction<UserPayload | null>>;
  status: UserStatus;
  fetchUser: () => Promise<UserPayload | null>;
};

const Ctx = createContext<UserStore | null>(null);

export function UserStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [status, setStatus] = useState<UserStatus>("unknown");

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/user", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; user?: UserPayload; error?: string };

      if (!res.ok || !data?.ok) {
        if (res.status === 401) {
          setStatus("no-session");
          setUser(null);
          return null;
        }
        throw new Error(data?.error ?? "User fetch failed");
      }

      setUser(data.user ?? null);
      setStatus("ready");
      return data.user ?? null;
    } catch (e) {
      setStatus("error");
      throw e;
    }
  }, []);

  const value = useMemo<UserStore>(
    () => ({ user, setUser, status, fetchUser }),
    [user, status, fetchUser]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserStore must be used within <UserStateProvider />");
  return ctx;
}
