// src/hooks/orchestrator/useGameEffectsHandler.ts
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAssets } from "@/providers/AssetsProvider";
import type { EffectsList } from "@/types/effects";
import type { GameScreen } from "@/lib/resolveScreenFromStoryNode";

type Tab = "chat" | "files" | "qr";

export function useGameEffectsHandler({
  setActiveTab,
  setScreen,
  bumpStoryEpoch,
}: {
  setActiveTab: (t: Tab) => void;
  setScreen: (s: GameScreen) => void;
  bumpStoryEpoch: () => void;
}) {
  const router = useRouter();
  const assets = useAssets();

  const applyEffects = useCallback(
    async (effects: EffectsList) => {
      for (const e of effects) {
        switch (e.type) {
          case "openTab":
            setActiveTab(e.tab);
            break;

          case "openChat":
            setScreen({
              kind: "chat",
              packId: e.packId,
              puzzleId: e.puzzleId,
              title: e.title,
              subtitle: e.subtitle,
            });
            setActiveTab("chat");
            break;

          case "openFiles":
            setScreen({ kind: "files", packId: e.packId, title: e.title });
            setActiveTab("files");
            break;

          case "openStory":
            setScreen({ kind: "storyteller", sceneId: e.sceneId });
            bumpStoryEpoch();
            break;

          case "navigate":
            if (e.newTab) window.open(e.url, "_blank", "noopener,noreferrer");
            else router.push(e.url);
            break;

          case "prefetchPacks": {
            const prefetch = e.prefetch ?? "all";
            const concurrency = e.concurrency ?? 3;
            for (const pid of e.packIds) {
              void assets.prefetchPack(pid, { prefetch, concurrency }).catch(() => {});
            }
            break;
          }

          case "toast":
            break;
        }
      }
    },
    [assets, router, setActiveTab, setScreen, bumpStoryEpoch]
  );

  return { applyEffects };
}
