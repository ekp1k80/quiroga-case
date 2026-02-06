// src/hooks/useChatFlow.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatConsoleMessage, ChatApiMessage } from "@/components/GameChatConsole";
import { useAssets } from "@/providers/AssetsProvider";
import type { ApiPackFile } from "@/types/packApi";

export type ChatChoice = { id: string; label: string };

export type BackendChatMessage =
  | string
  | { type: "packFile"; fileId: string; caption?: string };

export type ChatFlowResponse = {
  ok: boolean;
  messages: BackendChatMessage[];

  blocked?: boolean;
  done?: boolean;

  effects?: Record<string, any>;
  choices?: ChatChoice[];
  advanced?: { from: string; to: string };

  error?: string;
};

export type UseChatFlowOptions = {
  packId: string;
  puzzleId: string;

  endpoint?: string;
  typingDelayMs?: number;
  autoInit?: boolean;

  externallyDisabled?: boolean;

  // clave de scope para resetear entre story-nodes (ej: user.storyNode)
  scopeKey?: string;

  onDone?: (payload: {
    packId: string;
    puzzleId: string;
    response: ChatFlowResponse;
    lastInput?: string;
  }) => void;

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

function makeSystemMsg(payload: ChatApiMessage): ChatConsoleMessage {
  return { id: crypto.randomUUID(), at: Date.now(), from: "system", text: payload };
}

/* ===================== Persistencia ===================== */

type PersistedChatMsg = {
  id: string;
  at: number;
  from: "system" | "player";
  text: BackendChatMessage; // serializable
};

type PersistedChatState = {
  v: 1;
  done: boolean;
  choices: ChatChoice[];
  messages: PersistedChatMsg[];
};

type MemoryChatState = {
  uiMessages: ChatConsoleMessage[]; // puede contener img con objectUrl
  persistedMessages: PersistedChatMsg[];
  choices: ChatChoice[];
  done: boolean;
};

const memoryCache = new Map<string, MemoryChatState>();
const initInflight = new Map<string, Promise<ChatFlowResponse>>();

function loadLS(key: string): PersistedChatState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedChatState;
    if (!data || data.v !== 1) return null;
    if (!Array.isArray(data.messages)) return null;
    return data;
  } catch {
    return null;
  }
}

function saveLS(key: string, data: PersistedChatState) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function removeLS(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function useChatFlow(opts: UseChatFlowOptions) {
  const assets = useAssets();

  const {
    packId,
    puzzleId,
    endpoint = "/api/chat-flow",
    typingDelayMs = 650,
    autoInit = true,
    externallyDisabled = false,
    scopeKey = "global",
    onDone,
    onBlocked,
    onOk,
    onWrong,
  } = opts;

  const cacheKey = useMemo(() => `${scopeKey}|${endpoint}|${packId}|${puzzleId}`, [
    scopeKey,
    endpoint,
    packId,
    puzzleId,
  ]);

  const storageKey = useMemo(() => `cq:chatflow:v1:${cacheKey}`, [cacheKey]);

  const [messages, setMessages] = useState<ChatConsoleMessage[]>([]);
  const [choices, setChoices] = useState<ChatChoice[]>([]);
  const [sending, setSending] = useState(false);
  const [systemTyping, setSystemTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);

  const [persistedMessages, setPersistedMessages] = useState<PersistedChatMsg[]>([]);

  const disabled = useMemo(() => externallyDisabled || done, [externallyDisabled, done]);

  const loadingInitRef = useRef(false);

  const hydrationStateRef = useRef<{
    cacheKey: string | null;
    readyToPersist: boolean;
  }>({ cacheKey: null, readyToPersist: false });

  /* ===================== Resolver backend -> UI ===================== */

  const resolveBackendMsgs = useCallback(
    async (backendMsgs: BackendChatMessage[]): Promise<ChatApiMessage[]> => {
      if (!backendMsgs?.length) return [];

      const hasPackFile = backendMsgs.some((m) => typeof m !== "string" && m?.type === "packFile");
      if (!hasPackFile) return backendMsgs as unknown as ChatApiMessage[];

      let files: ApiPackFile[] = [];
      try {
        files = await assets.loadPack(packId);
      } catch {
        return backendMsgs.map((m) => (typeof m === "string" ? m : `[Archivo: ${m.fileId}]`));
      }

      const byId = new Map(files.map((f) => [f.id, f]));

      const out: ChatApiMessage[] = [];

      for (const m of backendMsgs) {
        if (typeof m === "string") {
          out.push(m);
          continue;
        }

        if (m.type === "packFile") {
          const f = byId.get(m.fileId);
          if (!f) {
            out.push(`[Archivo: ${m.fileId}]`);
            continue;
          }

          // inline solo img
          if (f.type !== "img") {
            out.push(f.title ?? `[Archivo: ${m.fileId}]`);
            continue;
          }

          await assets.ensurePackFileCached(packId, f.id).catch(() => {});
          const a = assets.getPackAsset(packId, f.id);

          if (!a?.src) {
            out.push(f.title ?? `[Imagen: ${m.fileId}]`);
            continue;
          }

          out.push({
            type: "img",
            src: a.src,
            alt: (f as any).alt ?? f.title ?? "",
            caption: m.caption,
          });
          continue;
        }

        out.push("—");
      }

      return out;
    },
    [assets, packId]
  );

  /* ===================== API ===================== */

  const callApi = useCallback(
    async (input?: string) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          packId,
          puzzleId,
          input: input ?? "",
        }),
      });

      const data = (await res.json()) as ChatFlowResponse;
      if (!res.ok) throw new Error(data?.error ?? "API error");
      return data;
    },
    [endpoint, packId, puzzleId]
  );

  /* ===================== Hydration: memory -> localStorage ===================== */

  useEffect(() => {
    hydrationStateRef.current.cacheKey = cacheKey;
    hydrationStateRef.current.readyToPersist = false;

    // 1) memoria (tab switch)
    const mem = memoryCache.get(cacheKey);
    if (mem) {
      setMessages(mem.uiMessages);
      setPersistedMessages(mem.persistedMessages);
      setChoices(mem.choices);
      setDone(mem.done);
      hydrationStateRef.current.readyToPersist = true;
      return;
    }

    // 2) localStorage (reload)
    const ls = loadLS(storageKey);
    if (ls) {
      setDone(!!ls.done);
      setChoices(Array.isArray(ls.choices) ? ls.choices : []);
      setPersistedMessages(Array.isArray(ls.messages) ? ls.messages : []);

      (async () => {
        const backendMsgs: BackendChatMessage[] = ls.messages.map((m) => m.text);
        const resolved = await resolveBackendMsgs(backendMsgs);

        const ui: ChatConsoleMessage[] = ls.messages.map((pm, i) => ({
          id: pm.id ?? crypto.randomUUID(),
          at: pm.at ?? Date.now() + i,
          from: pm.from,
          text: resolved[i] ?? "—",
        }));

        setMessages(ui);

        memoryCache.set(cacheKey, {
          uiMessages: ui,
          persistedMessages: ls.messages,
          choices: Array.isArray(ls.choices) ? ls.choices : [],
          done: !!ls.done,
        });

        if (hydrationStateRef.current.cacheKey === cacheKey) {
          hydrationStateRef.current.readyToPersist = true;
        }
      })();

      return;
    }

    // 3) no hay nada guardado
    hydrationStateRef.current.readyToPersist = true;
  }, [cacheKey, storageKey, resolveBackendMsgs]);

  /* ===================== Persist: memory + localStorage ===================== */

  useEffect(() => {
    if (hydrationStateRef.current.cacheKey !== cacheKey) return;
    if (!hydrationStateRef.current.readyToPersist) return;

    const hasAnything =
      persistedMessages.length > 0 || messages.length > 0 || choices.length > 0 || done;

    if (!hasAnything) return;

    memoryCache.set(cacheKey, {
      uiMessages: messages,
      persistedMessages,
      choices,
      done,
    });

    saveLS(storageKey, {
      v: 1,
      done: !!done,
      choices: Array.isArray(choices) ? choices : [],
      messages: persistedMessages,
    });
  }, [cacheKey, storageKey, messages, persistedMessages, choices, done]);

  /* ===================== init (dedupe) ===================== */

  const init = useCallback(async () => {
    if (loadingInitRef.current) return;
    loadingInitRef.current = true;
    setLoadingInit(true);

    try {
      const mem = memoryCache.get(cacheKey);
      if (mem && (mem.persistedMessages.length > 0 || mem.done)) return;

      const ls = loadLS(storageKey);
      if (ls && ls.messages.length > 0) return;

      let p = initInflight.get(cacheKey);
      if (!p) {
        p = callApi("");
        initInflight.set(cacheKey, p);
        p.finally(() => initInflight.delete(cacheKey));
      }

      const data = await p;

      setDone(!!data.done);
      setChoices(Array.isArray(data.choices) ? data.choices : []);

      const backend = Array.isArray(data.messages) ? data.messages : [];
      const now = Date.now();

      const sysPersisted: PersistedChatMsg[] = backend.map((m, i) => ({
        id: crypto.randomUUID(),
        at: now + i,
        from: "system",
        text: m,
      }));

      setPersistedMessages(sysPersisted);

      const resolved = await resolveBackendMsgs(backend);

      const ui: ChatConsoleMessage[] = resolved.map((m, i) => ({
        id: sysPersisted[i]?.id ?? crypto.randomUUID(),
        at: sysPersisted[i]?.at ?? now + i,
        from: "system",
        text: m,
      }));

      setMessages(ui);

      hydrationStateRef.current.readyToPersist = true;

      if (data.blocked) onBlocked?.({ packId, puzzleId, response: data });
      if (data.done) onDone?.({ packId, puzzleId, response: data });
    } catch {
      setMessages([makeSystemMsg("Error cargando el chat. Intentá recargar.")]);
      setChoices([]);
      setPersistedMessages([]);
    } finally {
      setLoadingInit(false);
      loadingInitRef.current = false;
    }
  }, [cacheKey, storageKey, callApi, onBlocked, onDone, packId, puzzleId, resolveBackendMsgs]);

  useEffect(() => {
    if (!autoInit) return;

    const mem = memoryCache.get(cacheKey);
    if (mem && (mem.persistedMessages.length > 0 || mem.done)) return;

    const ls = loadLS(storageKey);
    if (ls && ls.messages.length > 0) return;

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoInit, cacheKey, storageKey]);

    const resetLocal = useCallback(async () => {
      // 1) detener persistencia durante el reset (evita re-guardar estado viejo)
      hydrationStateRef.current.readyToPersist = false;

      // 2) limpiar caches
      memoryCache.delete(cacheKey);
      initInflight.delete(cacheKey);

      // 3) limpiar localStorage
      removeLS(storageKey);

      // 4) resetear estado UI
      setMessages([]);
      setPersistedMessages([]);
      setChoices([]);
      setDone(false);
      setSending(false);
      setSystemTyping(false);

      // 5) re-habilitar persistencia + re-init
      hydrationStateRef.current.readyToPersist = true;
      if (autoInit) {
        await init();
      }
    }, [autoInit, cacheKey, storageKey, init]);

  /* ===================== send ===================== */

  const send = useCallback(
    async (rawText: string, normalizedText?: string) => {
      if (disabled || sending || loadingInit) return;

      const normalized = normalizedText ?? normalizeInput(rawText);
      if (!normalized) return;

      const playerPersisted: PersistedChatMsg = {
        id: crypto.randomUUID(),
        at: Date.now(),
        from: "player",
        text: rawText,
      };

      setPersistedMessages((prev) => [...prev, playerPersisted]);
      setMessages((prev) => [
        ...prev,
        { id: playerPersisted.id, at: playerPersisted.at, from: "player", text: rawText },
      ]);

      setChoices([]);
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

      setChoices(Array.isArray(data.choices) ? data.choices : []);

      const backend = Array.isArray(data.messages) ? data.messages : [];
      const now = Date.now();

      const sysPersisted: PersistedChatMsg[] = backend.map((m, i) => ({
        id: crypto.randomUUID(),
        at: now + i,
        from: "system",
        text: m,
      }));

      setPersistedMessages((prev) => [...prev, ...sysPersisted]);

      const resolved = await resolveBackendMsgs(backend);

      if (resolved.length) {
        setMessages((prev) => [
          ...prev,
          ...resolved.map((m, i) => ({
            id: sysPersisted[i]?.id ?? crypto.randomUUID(),
            at: sysPersisted[i]?.at ?? now + i,
            from: "system" as const,
            text: m,
          })),
        ]);
      }

      if (data.blocked) onBlocked?.({ packId, puzzleId, response: data });
      if (data.ok) onOk?.({ packId, puzzleId, response: data });
      else onWrong?.({ packId, puzzleId, response: data });

      if (data.done) {
        setDone(true);
        setChoices([]);
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
      onOk,
      onWrong,
      packId,
      puzzleId,
      resolveBackendMsgs,
    ]
  );

  const refresh = useCallback(async () => {
    // no-op
  }, []);

  return {
    messages,
    choices,
    sending,
    systemTyping,
    disabled,
    done,
    loadingInit,
    init,
    refresh,
    send,
    resetLocal
  };
}
