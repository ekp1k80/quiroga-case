// src/components/FinalPuzzleOrchestrator.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import Qr3Lobby from "@/components/Qr3Lobby";
import Qr3FinalPuzzle from "@/components/Qr3FinalPuzzle";

type User = {
  id: string;
  name: string;
  storyNode: string;
  flags: string[];
  tags: string[];
  playSessionId?: string;
};

/**
 * Orquesta SOLO la parte de QR3:
 * - Qr3Lobby: registra presencia y espera asignación de grupo (>=3)
 * - Qr3FinalPuzzle: corre el cuestionario y waiting screen hasta allDone => onAllDone()
 *
 * No incluye PlaySessionLobby (ese va afuera, en la creación de usuario).
 */
export default function FinalPuzzleOrchestrator({
  user,
  groupId,
}: {
  user: User;
  groupId?: string;
}) {
  const playSessionId = user.playSessionId ?? null;

  // Guardrail: sin playSessionId no podemos
  if (!playSessionId) {
    return (
      <div style={{ color: "#fff", padding: 18, opacity: 0.9 }}>
        Falta <b>playSessionId</b> en el usuario.
      </div>
    );
  }

  const showPuzzle = useMemo(() => !!groupId, [groupId]);

  return showPuzzle ? (
    <Qr3FinalPuzzle
      user={user}
    />
  ) : (
    <Qr3Lobby user={{ id: user.id, name: user.name }} playSessionId={playSessionId} />
  );
}
