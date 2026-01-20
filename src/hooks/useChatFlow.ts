"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatConsoleMessage, ChatApiMessage } from "@/components/GameChatConsole";
import type { PackFile } from "@/data/packs";

export type ChatChoice = { id: string; label: string };

// ✅ lo que viene del backend
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

  error?: string;
};

export type UseChatFlowOptions = {
  packId: string;
  puzzleId: string;

  endpoint?: string;
  typingDelayMs?: number;
  autoInit?: boolean;

  externallyDisabled?: boolean;

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

function makePlayerMsg(payload: ChatApiMessage): ChatConsoleMessage {
  return { id: crypto.randomUUID(), at: Date.now(), from: "player", text: payload };
}

type PackIndex = {
  files: PackFile[];
  byId: Map<string, PackFile>;
};

type CacheEntry = { objectUrl: string; contentType?: string };

export function useChatFlow(opts: UseChatFlowOptions) {
  const {
    packId,
    puzzleId,
    endpoint = "/api/chat-flow",
    typingDelayMs = 650,
    autoInit = true,
    externallyDisabled = false,
    onDone,
    onBlocked,
    onOk,
    onWrong,
  } = opts;

  const [messages, setMessages] = useState<ChatConsoleMessage[]>([]);
  const [choices, setChoices] = useState<ChatChoice[]>([]);

  const [sending, setSending] = useState(false);
  const [systemTyping, setSystemTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingInit, setLoadingInit] = useState(false);

  const disabled = useMemo(() => externallyDisabled || done, [externallyDisabled, done]);

  // ✅ pack cache
  const packRef = useRef<PackIndex | null>(null);
  const packInflightRef = useRef<Promise<PackIndex> | null>(null);

  // ✅ file blob cache (by fileId)
  const fileCacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const fileInflightRef = useRef<Map<string, Promise<void>>>(new Map());

  // cleanup object urls cuando cambia packId (o unmount)
  useEffect(() => {
    return () => {
      for (const entry of fileCacheRef.current.values()) URL.revokeObjectURL(entry.objectUrl);
      fileCacheRef.current.clear();
      fileInflightRef.current.clear();
      packRef.current = null;
      packInflightRef.current = null;
    };
  }, [packId]);

  const fetchPackIndex = useCallback(async (): Promise<PackIndex> => {
    if (packRef.current) return packRef.current;
    const inflight = packInflightRef.current;
    if (inflight) return inflight;

    const p = (async () => {
      const res = await fetch(`/api/packs/${encodeURIComponent(packId)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Pack fetch failed");

      const files: PackFile[] = data.files ?? [];
      const byId = new Map<string, PackFile>();
      for (const f of files) byId.set(f.id, f);

      const idx = { files, byId };
      packRef.current = idx;
      return idx;
    })().finally(() => {
      packInflightRef.current = null;
    });

    packInflightRef.current = p;
    return p;
  }, [packId]);

  const ensureFileCached = useCallback(async (file: PackFile) => {
    if (fileCacheRef.current.has(file.id)) return;

    const existing = fileInflightRef.current.get(file.id);
    if (existing) return existing;

    const p = (async () => {
      const fileRes = await fetch(`/api/r2-proxy?key=${encodeURIComponent(file.key)}`, {
        cache: "force-cache",
      });
      if (!fileRes.ok) return;

      const blob = await fileRes.blob();
      const objectUrl = URL.createObjectURL(blob);

      fileCacheRef.current.set(file.id, {
        objectUrl,
        contentType: fileRes.headers.get("content-type") ?? undefined,
      });
    })().finally(() => {
      fileInflightRef.current.delete(file.id);
    });

    fileInflightRef.current.set(file.id, p);
    return p;
  }, []);

  const resolveBackendMsgs = useCallback(
    async (backendMsgs: BackendChatMessage[]): Promise<ChatApiMessage[]> => {
      // fast path
      if (!backendMsgs?.length) return [];

      // si no hay packFile, devolvemos tal cual
      const hasPackFile = backendMsgs.some((m) => typeof m !== "string" && m?.type === "packFile");
      if (!hasPackFile) return backendMsgs as unknown as ChatApiMessage[];

      let idx: PackIndex | null = null;
      try {
        idx = await fetchPackIndex();
      } catch {
        // si falla pack, degradamos a texto
        return backendMsgs.map((m) =>
          typeof m === "string" ? m : `[Archivo: ${m.fileId}]`
        );
      }

      const out: ChatApiMessage[] = [];
      for (const m of backendMsgs) {
        if (typeof m === "string") {
          out.push(m);
          continue;
        }

        if (m.type === "packFile") {
          const file = idx.byId.get(m.fileId);
          if (!file) {
            out.push(`[Archivo: ${m.fileId}]`);
            continue;
          }

          // solo inline si es img; doc/audio quedan como texto por ahora
          if (file.type !== "img") {
            out.push(file.title ?? `[Archivo: ${m.fileId}]`);
            continue;
          }

          await ensureFileCached(file);

          const cached = fileCacheRef.current.get(file.id);
          if (!cached?.objectUrl) {
            out.push(file.title ?? `[Imagen: ${m.fileId}]`);
            continue;
          }

          out.push({
            type: "img",
            src: cached.objectUrl,
            alt: (file as any).alt ?? file.title ?? "",
            caption: m.caption,
          });
          continue;
        }

        out.push("—");
      }

      return out;
    },
    [ensureFileCached, fetchPackIndex]
  );

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

  const init = useCallback(async () => {
    if (loadingInit) return;
    setLoadingInit(true);

    try {
      const data = await callApi("");

      setDone(!!data.done);
      setMessages([]);
      setChoices(Array.isArray(data.choices) ? data.choices : []);

      const resolved = await resolveBackendMsgs(Array.isArray(data.messages) ? data.messages : []);

      if (resolved.length) {
        const now = Date.now();
        setMessages(
          resolved.map((m, i) => ({
            id: crypto.randomUUID(),
            at: now + i,
            from: "system",
            text: m,
          }))
        );
      }

      if (data.blocked) onBlocked?.({ packId, puzzleId, response: data });
      if (data.done) onDone?.({ packId, puzzleId, response: data });
    } catch {
      setMessages([makeSystemMsg("Error cargando el chat. Intentá recargar.")]);
      setChoices([]);
    } finally {
      setLoadingInit(false);
    }
  }, [callApi, loadingInit, onBlocked, onDone, packId, puzzleId, resolveBackendMsgs]);

  const send = useCallback(
    async (rawText: string, normalizedText?: string) => {
      if (disabled || sending || loadingInit) return;

      const normalized = normalizedText ?? normalizeInput(rawText);
      if (!normalized) return;

      setMessages((prev) => [...prev, makePlayerMsg(rawText)]);
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

      const resolved = await resolveBackendMsgs(Array.isArray(data.messages) ? data.messages : []);

      if (resolved.length) {
        const now = Date.now();
        // @ts-ignore
        setMessages((prev) => [
          ...prev,
          ...resolved.map((m, i) => ({
            id: crypto.randomUUID(),
            at: now + i,
            from: "system",
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
    await init();
  }, [init]);

  useEffect(() => {
    if (!autoInit) return;
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packId, puzzleId]);

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
  };
}
