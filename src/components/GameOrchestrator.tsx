// src\components\GameOrchestrator.tsx
"use client";

import React, { useEffect, useMemo } from "react";
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

export default function GameOrchestrator() {
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

  const { value: playSessionState, error } = useRtdbValue<LobbyState>(`playSessions/${user?.playSessionId}`);
  const qr3 = playSessionState?.qr3;

  const {pack, groupId} = useQr3RoleFromState(qr3, user?.id);

  const advance = async () => {
    await applyAdvanced({
      from: 'qr3',
      to: 'hector-mom-final-call'
    })
  }

  useEffect(() => {
    if (playSessionState?.phase === "done") {
      fetchUser()
      advance()
    }
  }, [playSessionState?.phase]);

  useEffect(() => {
    doBoot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "no-session") {
    return (
      <CharacterCreation
        onCreated={async () => {
          // la API ya setea la cookie
          doBoot();
        }}
      />
    );
  }

  return (
    <FullscreenGuard>
      {transitioning ? (
        <FullScreenLoader label={transitionLabel} />
      ) : boot !== "ready" || !user || !screen ? (
        <FullScreenLoader label={boot === "error" ? bootError ?? "Error" : "Cargando…"} />
      ) : user.playSessionId && playSessionState?.phase === "grouping" ? (
        <PlaySessionGroupFormation playSessionId={user.playSessionId} userId={user.id} />
      )
      : (user.playSessionId && playSessionState?.phase === "lobby") ? (
        <PlaySessionLobby playSessionId={user?.playSessionId} />
      ) : screen.kind === "storyteller" ? (
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
      ) : (screen?.kind === "finalPuzzle" && screen.play === "qr3") ? (
        <Shell>
          <Body>
            <Center>
              <Panel>
                { activeTab === "finalPuzzle" ?
                  (
                    <FinalPuzzleOrchestrator
                      user={user as any}
                      groupId={groupId}
                    />
                  ) : activeTab === "files" ? (
                    <FilesPanel user={user} packId={pack} />
                  ) : <></>
                }
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
                  <ChatPanel user={user} primary={screen} />
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
      onDone: 
        async ({response}) => {
          if (response.done && response.advanced) await applyAdvanced(response.advanced);
          if (response.done && response.effects?.length) await applyEffects(response.effects as EffectsList);
        }
      
    });

    return (
      <GameChatConsole
        title={chat.title ?? "Terminal"}
        subtitle={""}
        // subtitle={chat.subtitle ?? `Nodo: ${user.storyNode}`}
        messages={flow.messages as any}
        choices={flow.choices}
        sending={flow.sending}
        systemTyping={flow.systemTyping}
        disabled={flow.disabled}
        onSend={flow.send}
      />
    );
  }

  function FilesPanel({ user, packId }: { user: any, packId?: string }) {
    return <GamePackFilesViewer packId={packId ?? user.storyNode} title="Archivos" prefetch="all" />;
  }

  function QrPanel() {
    const [open, setOpen] = React.useState(true);

    return (
      <div style={{ width: "100%", height: "100%" }}>
        {open ? (
          <QrClaimScanner onClose={() => setOpen(false)} onClaimed={
            async (response) => {
              if (response.ok && response.advanced) await applyAdvanced(response.advanced);
              if (response.ok && response.effects?.length) await applyEffects(response.effects as EffectsList);
            }
          } />
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
