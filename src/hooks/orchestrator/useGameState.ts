// src/hooks/orchestrator/useGameState.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveScreenFromStoryNode, type GameScreen } from "@/lib/resolveScreenFromStoryNode";
import type { UserPayload } from "@/hooks/orchestrator/useUserState";
import { useNodeAssets } from "@/hooks/orchestrator/useNodeAssets";

export type Tab = "chat" | "files" | "qr" | "finalPuzzle";
export type ProgressAdvanced = { from: string; to: string };

export function useGameState({
  user,
  setUser,
  fetchUser,
}: {
  user: UserPayload | null;
  setUser: React.Dispatch<React.SetStateAction<UserPayload | null>>;
  fetchUser: () => Promise<UserPayload>;
}) {
  const { storyAssets, prefetchForNode } = useNodeAssets();

  const [boot, setBoot] = useState<"booting" | "ready" | "error">("booting");
  const [bootError, setBootError] = useState<string | null>(null);

  const [screen, setScreen] = useState<GameScreen | null>(null);
  const [tabs, setTabs] = useState<Tab[]>(["chat", "files", "qr"]);
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  const [transitioning, setTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState<string>("Cargando…");

  const [storyEpoch, setStoryEpoch] = useState(0);
  const bumpStoryEpoch = useCallback(() => setStoryEpoch((e) => e + 1), []);

  const bootInFlightRef = useRef(false);
  const lastBootKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if(user?.storyNode === "qr3"){
      setTabs(["files", "finalPuzzle"])
      setActiveTab("finalPuzzle")
      return
    } else {
      if(tabs.includes("finalPuzzle")){
        setTabs(["chat", "files", "qr"])
      }
    }
  }, [user?.storyNode])

  const applyResolved = useCallback(
    async (u: UserPayload, resolved: ReturnType<typeof resolveScreenFromStoryNode>) => {
      // ✅ consistente con transitionToNode: prefetch ANTES de aplicar UI
      await prefetchForNode(u.storyNode, resolved.primary);

      setScreen(resolved.primary);
      setTabs(resolved.tabs);

      const nextTab: Tab =
        resolved.defaultTab ??
        (resolved.primary.kind === "files" ? "files" : resolved.primary.kind === "qr" ? "qr" : "chat");
      setActiveTab(nextTab);

      if (resolved.primary.kind === "storyteller") bumpStoryEpoch();
    },
    [prefetchForNode, bumpStoryEpoch]
  );

  const doBoot = useCallback(async () => {
    if (bootInFlightRef.current) return;
    if (user) return;

    bootInFlightRef.current = true;
    setBoot("booting");
    setBootError(null);

    try {
      const u = await fetchUser();
      const resolved = resolveScreenFromStoryNode(u.storyNode as any);

      const bootKey = JSON.stringify({
        userId: u.id,
        storyNode: u.storyNode,
        primary: resolved.primary,
        tabs: resolved.tabs,
        defaultTab: resolved.defaultTab ?? null,
      });
      console.log("resolved.defaultTab", resolved.defaultTab)
      if(resolved.defaultTab) {
        setActiveTab(resolved.defaultTab)
      }

      if (lastBootKeyRef.current === bootKey) {
        setUser(u); // keep fresh user payload anyway
        setBoot("ready");
        bootInFlightRef.current = false;
        return;
      }
      lastBootKeyRef.current = bootKey;

      setUser(u);
      await applyResolved(u, resolved);
      setBoot("ready");
    } catch (e: any) {
      setBoot("error");
      setBootError(e?.message ?? "Error");
    } finally {
      bootInFlightRef.current = false;
    }
  }, [user, fetchUser, setUser, applyResolved]);

  const transitionToNode = useCallback(
    async (nextStoryNode: string, opts?: { label?: string }) => {
      setTransitionLabel(opts?.label ?? "Cargando…");
      setTransitioning(true);

      try {
        const resolved = resolveScreenFromStoryNode(nextStoryNode as any);

        // ✅ lo importante: prefetch ANTES de aplicar screen
        await prefetchForNode(nextStoryNode, resolved.primary);

        // ahora sí: aplicar UI state
        setScreen(resolved.primary);
        setTabs(resolved.tabs);

        const nextTab: Tab =
          resolved.defaultTab ??
          (resolved.primary.kind === "files" ? "files" : resolved.primary.kind === "qr" ? "qr" : "chat");
        setActiveTab(nextTab);

        // update local user storyNode
        setUser((prev) => (prev ? { ...prev, storyNode: nextStoryNode } : prev));

        if (resolved.primary.kind === "storyteller") setStoryEpoch((e) => e + 1);
      } finally {
        setTransitioning(false);
      }
    },
    [prefetchForNode, setUser]
  );

  const applyAdvanced = useCallback(
    async (advanced: ProgressAdvanced) => {
      const should = user?.storyNode === advanced.from;
      if (!should) return;
      await transitionToNode(advanced.to, { label: "Cargando siguiente escena…" });
    },
    [user?.storyNode, transitionToNode]
  );

  return {
    boot,
    bootError,
    screen,
    setScreen,
    tabs,
    setTabs,
    activeTab,
    setActiveTab,
    storyAssets,
    transitioning,
    transitionLabel,
    transitionToNode,
    applyAdvanced,
    storyEpoch,
    bumpStoryEpoch,
    doBoot,
  };
}
