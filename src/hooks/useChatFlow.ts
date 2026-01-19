"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatConsoleMessage } from "@/components/GameChatConsole";

export type ChatFlowResponse = {
  ok: boolean;
  messages: string[];

  blocked?: boolean;
  done?: boolean;

  levelUp?: { from: number; to: number };
  effects?: Record<string, any>;

  error?: string;
};

export type UseChatFlowOptions = {
  packId: string;
  puzzleId: string;

  endpoint?: string;       // default "/api/chat-flow"
  typingDelayMs?: number;  // default 650
  autoInit?: boolean;      // default true

  externallyDisabled?: boolean;

  onDone?: (payload: {
    packId: string;
    puzzleId: string;
    response: ChatFlowResponse;
    lastInput?: string; // normalized
  }) => void;

  onLevelUp?: (payload: { from: number; to: number; packId: string; puzzleId: string }) => void;

  onBlocked?: (payload: { packId: string; puzzleId: string; response: ChatFlowResponse }) => void;

  onOk?: (payload: { packId: string; puzzleId: string; response: ChatFlowResponse }) => void;

  onWrong?: (payload: { packId: string; puzzleId: string; response: ChatFlowResponse }) => void;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeInput(s: string) {
  return (s ?? "").trim().toLowerCase();
}

function makeSystemMsg(text: string): ChatConsoleMessage {
  return { id: crypto.randomUUID(), at: Date.now(), from: "system", text };
}

function makePlayerMsg(text: string): ChatConsoleMessage {
  return { id: crypto.randomUUID(), at: Date.now(), from: "player", text };
}

/**
 * Chat flow: la API decide TODO:
 * - mensaje inicial / prompt actual (init sin input)
 * - bloqueo por nivel
 * - validación de respuesta
 * - level up
 */
export function useChatFlow(opts: UseChatFlowOptions) {
  const {
    packId,
    puzzleId,
    endpoint = "/api/chat-flow",
    typingDelayMs = 650,
    autoInit = true,
    externallyDisabled = false,
    onDone,
    onLevelUp,
    onBlocked,
    onOk,
    onWrong,
  } = opts;

  const [messages, setMessages] = useState<ChatConsoleMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [systemTyping, setSystemTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);

  const disabled = useMemo(() => externallyDisabled || done, [externallyDisabled, done]);

  const callApi = useCallback(
    async (input?: string) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          packId,
          puzzleId,
          input: input ?? "", // init manda ""
        }),
      });

      const data = (await res.json()) as ChatFlowResponse;
      if (!res.ok) throw new Error(data?.error ?? "API error");
      return data;
    },
    [endpoint, packId, puzzleId]
  );

  /** Inicializa conversación desde API (prompt actual / bloqueo) */
  const init = useCallback(async () => {
    if (loadingInit) return;
    setLoadingInit(true);

    try {
      const data = await callApi(""); // init sin input

      // reset de estado
      setDone(!!data.done);
      setMessages([]);

      if (Array.isArray(data.messages) && data.messages.length) {
        const now = Date.now();
        setMessages(
          data.messages.map((t, i) => ({
            id: crypto.randomUUID(),
            at: now + i,
            from: "system",
            text: t,
          }))
        );
      }

      if (data.blocked) onBlocked?.({ packId, puzzleId, response: data });
      if (data.levelUp) onLevelUp?.({ ...data.levelUp, packId, puzzleId });
      if (data.done) onDone?.({ packId, puzzleId, response: data });
    } catch {
      setMessages([makeSystemMsg("Error cargando el chat. Intentá recargar.")]);
    } finally {
      setLoadingInit(false);
    }
  }, [callApi, loadingInit, onBlocked, onDone, onLevelUp, packId, puzzleId]);

  /** Enviar respuesta del jugador */
  const send = useCallback(
    async (rawText: string, normalizedText?: string) => {
      if (disabled || sending || loadingInit) return;

      const normalized = normalizedText ?? normalizeInput(rawText);
      if (!normalized) return;

      // mensaje del jugador
      setMessages((prev) => [...prev, makePlayerMsg(rawText)]);

      setSending(true);
      setSystemTyping(true);

      await sleep(typingDelayMs);

      let data: ChatFlowResponse | null = null;

      try {
        data = await callApi(normalized);
      } catch {
        setMessages((prev) => [...prev, makeSystemMsg("Error de conexión. Intentá de nuevo.")]);
        setSystemTyping(false);
        setSending(false);
        return;
      }

      // append mensajes del sistema
      if (Array.isArray(data.messages) && data.messages.length) {
        const now = Date.now();
        setMessages((prev) => [
          ...prev,
          ...data.messages.map((t, i) => ({
            id: crypto.randomUUID(),
            at: now + i,
            from: "system",
            text: t,
          })),
        ]);
      }

      // callbacks
      if (data.blocked) onBlocked?.({ packId, puzzleId, response: data });
      if (data.levelUp) onLevelUp?.({ ...data.levelUp, packId, puzzleId });
      if (data.ok) onOk?.({ packId, puzzleId, response: data });
      else onWrong?.({ packId, puzzleId, response: data });

      if (data.done) {
        setDone(true);
        onDone?.({ packId, puzzleId, response: data, lastInput: normalized });
      }

      setSystemTyping(false);
      setSending(false);
    },
    [
      disabled,
      sending,
      loadingInit,
      typingDelayMs,
      callApi,
      onBlocked,
      onDone,
      onLevelUp,
      onOk,
      onWrong,
      packId,
      puzzleId,
    ]
  );

  /** Reinicia desde API (útil si cambia nivel y querés refrescar prompt) */
  const refresh = useCallback(async () => {
    await init();
  }, [init]);

  // auto init al montar y al cambiar pack/puzzle
  useEffect(() => {
    if (!autoInit) return;
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, puzzleId]);

  return {
    messages,
    sending,
    systemTyping,
    disabled,
    done,
    loadingInit,
    init,
    refresh,
    send,
  };
}
