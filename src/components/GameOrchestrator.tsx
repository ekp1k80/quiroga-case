// src/components/GameOrchestrator.tsx
"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";

import GameNavbar from "@/components/GameNavbar";
import StorytellerOverlay from "@/components/StorytellerOverlay";
import GameChatConsole from "@/components/GameChatConsole";
import GamePackFilesViewer from "@/components/GamePackFilesViewer";
import QrClaimScanner from "@/components/QrClaimScanner";
import FullscreenGuard from "@/components/FullscreenGuard";

import { useChatFlow } from "@/hooks/useChatFlow";

import { useUserState } from "@/hooks/orchestrator/useUserState";
import { useGameState } from "@/hooks/orchestrator/useGameState";
import { useGameEffectsHandler } from "@/hooks/orchestrator/useGameEffectsHandler";
import { notifyStorytellerSeen } from "@/lib/storytelling/storytellerApi";
import type { GameScreen } from "@/lib/resolveScreenFromStoryNode";
import CharacterCreation from "./CharacterCreation";
import FullScreenLoader from "./FullScreenLoader";
import { EffectsList } from "@/types/effects";
import PlaySessionLobby from "./PlaySessionLobby";
import FinalPuzzleOrchestrator from "./FinalPuzzleOrchestrator";
import { useRtdbValue } from "@/hooks/useRtdbValue";
import { useQr3RoleFromState } from "@/hooks/useQr3RoleFromState";
import PlaySessionGroupFormation from "./PlaySessionGroupFormation";
import { useLoaderTips } from "@/hooks/useLoaderTips";

type Tab = "chat" | "files" | "qr";

type LobbyState = {
  code?: string;
  phase?: "lobby" | "grouping" | "running" | "done";
  players?: Record<string, { name: string; joinedAt: number }>;
  qr3?: {
    groups?: Record<
      string,
      {
        idx?: number;
        playerIds?: string[];
        status?: "active" | "done";
        score?: number;
        rank?: number;
      }
    >;
  };
};

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export default function GameOrchestrator() {
  const debug = process.env.NODE_ENV !== "production";
  const log = (...args: any[]) => {
    if (debug) console.log("[GameOrchestrator]", ...args);
  };

  const { bootReady: tipsReady, pickTips } = useLoaderTips({ debug: true, debugTag: "orchestrator" });

  const { user, status, fetchUser, setUser } = useUserState();

  const {
    boot,
    bootError,
    screen,
    setScreen,
    tabs,
    activeTab,
    setActiveTab,
    storyAssets,
    storyEpoch,
    bumpStoryEpoch,
    doBoot,
    applyAdvanced,
    transitionLabel,
    transitioning,
  } = useGameState({ user, setUser, fetchUser });

  const { applyEffects } = useGameEffectsHandler({
    setActiveTab,
    setScreen,
    bumpStoryEpoch,
  });

  const { value: playSessionState } = useRtdbValue<LobbyState>(`playSessions/${user?.playSessionId}`);
  const qr3 = playSessionState?.qr3;
  const { pack, groupId } = useQr3RoleFromState(qr3, user?.id);

  const advance = async () => {
    await applyAdvanced({ from: "qr3", to: "hector-mom-final-call" });
  };

  useEffect(() => {
    if (playSessionState?.phase === "done") {
      fetchUser();
      advance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSessionState?.phase]);

  useEffect(() => {
    doBoot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // Loader control + messages
  // =========================
  const [minTipsReached, setMinTipsReached] = useState(false);
  const [loaderActive, setLoaderActive] = useState(false);
  const [coreMessages, setCoreMessages] = useState<string[] | null>(null);

  const [postTapActive, setPostTapActive] = useState(false);
  const [tapEpoch, setTapEpoch] = useState(0);
  const [postTapMessages, setPostTapMessages] = useState<string[] | null>(null);

  const shouldShowLoaderCore = transitioning || boot !== "ready" || !user || !screen;

  useEffect(() => {
    log("STATE", {
      t: now(),
      tipsReady,
      boot,
      transitioning,
      hasUser: !!user,
      hasScreen: !!screen,
      shouldShowLoaderCore,
      loaderActive,
      minTipsReached,
      postTapActive,
      transitionLabel,
    });
  }, [tipsReady, boot, transitioning, user, screen, shouldShowLoaderCore, loaderActive, minTipsReached, postTapActive, transitionLabel]);

  useEffect(() => {
    if (!tipsReady) return;
    if (!shouldShowLoaderCore) return;

    if (!loaderActive) {
      setLoaderActive(true);
      setMinTipsReached(false);
      setCoreMessages(null);
      log("ENTER core loader", { t: now() });
    }

    if (coreMessages == null) {
      const msgs = pickTips(2);
      setCoreMessages(msgs);
      log("CORE picked messages", { t: now(), msgs });
    }
  }, [tipsReady, shouldShowLoaderCore, loaderActive, coreMessages, pickTips]);

  useEffect(() => {
    if (!shouldShowLoaderCore && loaderActive) {
      setLoaderActive(false);
      log("EXIT core loader", { t: now() });
    }
  }, [shouldShowLoaderCore, loaderActive]);

  useEffect(() => {
    if (!tipsReady) return;
    if (!postTapActive) return;

    const msgs = pickTips(1);
    setPostTapMessages(msgs);
    log("POST-TAP picked messages", { t: now(), tapEpoch, msgs });
  }, [tipsReady, postTapActive, tapEpoch, pickTips]);

  const loaderLabel = transitioning ? transitionLabel : boot === "error" ? bootError ?? "Error" : undefined;

  const coreKey = transitioning
    ? `core:t:${transitionLabel ?? ""}`
    : `core:b:${boot}:${user ? "u1" : "u0"}:${screen ? "s1" : "s0"}`;

  const postTapKey = `postTap:${tapEpoch}`;

  // Configurables
  const CORE_INTERVAL_MS = 5000;
  const CORE_MIN_VISIBLE_MS = 5000;

  const POST_TAP_MIN_VISIBLE_MS = 5000;

  if (status === "no-session") {
    return <CharacterCreation onCreated={async () => doBoot()} />;
  }

  return (
    <FullscreenGuard
      onReady={() => {
        log("FullscreenGuard onReady (tap)", { t: now(), tipsReady });
        setTapEpoch((e) => e + 1);
        setPostTapMessages(null);
        setPostTapActive(true);
      }}
    >
      {shouldShowLoaderCore || (!minTipsReached && loaderActive) ? (
        <FullScreenLoader
          key={coreKey}
          messages={loaderLabel ? [loaderLabel] : coreMessages ?? ["Cargando…"]}
          intervalMs={CORE_INTERVAL_MS}
          minVisibleMs={CORE_MIN_VISIBLE_MS}
          debugTag="core"
          onMinMessagesReached={() => {
            log("CORE onMinMessagesReached", { t: now() });
            setMinTipsReached(true);
          }}
        />
      ) : postTapActive ? (
        <FullScreenLoader
          key={postTapKey}
          messages={postTapMessages ?? ["Cargando…"]}
          intervalMs={CORE_INTERVAL_MS}
          minVisibleMs={POST_TAP_MIN_VISIBLE_MS}
          debugTag="postTap"
          onMinMessagesReached={() => {
            log("POST-TAP onMinMessagesReached", { t: now() });
            setPostTapActive(false);
          }}
        />
      ) : user?.playSessionId && playSessionState?.phase === "grouping" ? (
        <PlaySessionGroupFormation playSessionId={user.playSessionId} userId={user.id} />
      ) : user?.playSessionId && playSessionState?.phase === "lobby" ? (
        <PlaySessionLobby playSessionId={user.playSessionId} />
      ) : screen?.kind === "storyteller" ? (
        <StorytellerOverlay
          key={`${screen.sceneId}:${storyEpoch}`}
          sceneId={screen.sceneId}
          assets={storyAssets}
          onDone={async () => {
            const data = await notifyStorytellerSeen(screen.sceneId);
            if (data.ok && data.advanced) await applyAdvanced(data.advanced);
            if (data.ok && (data as any).effects?.length) await applyEffects((data as any).effects);
          }}
        />
      ) : screen?.kind === "finalPuzzle" && screen.play === "qr3" ? (
        <Shell>
          <Body>
            <Center>
              <Panel>
                {activeTab === "finalPuzzle" ? (
                  <FinalPuzzleOrchestrator user={user as any} groupId={groupId} />
                ) : activeTab === "files" ? (
                  <FilesPanel user={user} packId={pack} />
                ) : (
                  <></>
                )}
              </Panel>
            </Center>
          </Body>
          <GameNavbar tabs={tabs} active={activeTab as Tab} onSelect={setActiveTab as any} />
        </Shell>
      ) : (
        <Shell>
          <Body>
            <Center>
              <Panel>
                {activeTab === "chat" ? (
                  <ChatPanel user={user} primary={screen as any} />
                ) : activeTab === "files" ? (
                  <FilesPanel user={user} />
                ) : (
                  <QrPanel />
                )}
              </Panel>
            </Center>
          </Body>
          <GameNavbar tabs={tabs} active={activeTab as Tab} onSelect={setActiveTab as any} />
        </Shell>
      )}
    </FullscreenGuard>
  );

  function ChatPanel({ user, primary }: { user: any; primary: GameScreen }) {
    const chat =
      primary.kind === "chat"
        ? primary
        : ({
            kind: "chat",
            packId: "intro",
            puzzleId: "qr2",
            title: "Terminal",
          } as const);

    const flow = useChatFlow({
      packId: chat.packId,
      puzzleId: chat.puzzleId,
      scopeKey: user.storyNode,
      onDone: async ({ response }) => {
        if (response.done && response.advanced) await applyAdvanced(response.advanced);
        if (response.done && response.effects?.length) await applyEffects(response.effects as EffectsList);
      },
    });

    return (
      <GameChatConsole
        title={chat.title ?? "Terminal"}
        subtitle={""}
        messages={flow.messages as any}
        choices={flow.choices}
        sending={flow.sending}
        systemTyping={flow.systemTyping}
        disabled={flow.disabled}
        onSend={flow.send}
      />
    );
  }

  function FilesPanel({ user, packId }: { user: any; packId?: string }) {
    return <GamePackFilesViewer packId={packId ?? user.storyNode} title="Archivos" prefetch="all" />;
  }

  function QrPanel() {
    const [open, setOpen] = React.useState(true);

    return (
      <div style={{ width: "100%", height: "100%" }}>
        {open ? (
          <QrClaimScanner
            onClose={() => setOpen(false)}
            onClaimed={async (response) => {
              if (response.ok && response.advanced) await applyAdvanced(response.advanced);
              if (response.ok && response.effects?.length) await applyEffects(response.effects as EffectsList);
            }}
          />
        ) : (
          <div style={{ color: "#fff", opacity: 0.8, padding: 14 }}>
            Scanner cerrado. Volvé a abrirlo desde la pestaña QR.
          </div>
        )}
      </div>
    );
  }
}

const Shell = styled.div`
  width: 100%;
  min-height: 100svh;
  background: #000;
  color: #fff;
`;

const Body = styled.div`
  padding: 12px;
`;

const Center = styled.div`
  width: min(1100px, 100%);
  margin: 0 auto;
`;

const Panel = styled.div`
  height: calc(100svh - 56px - 24px);
`;
