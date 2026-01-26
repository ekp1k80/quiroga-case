// src/components/SocialStorm/useSocialStorm.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SocialEvent, SocialPost } from "./types";
import { createSoundBus } from "./sound";

const DEFAULT_MAX_POSTS = 80;
const DEFAULT_TICK_MS = 33;

export function useSocialStorm(params: {
  events: SocialEvent[];
  seed?: number;
  autoStart?: boolean;
  onCut?: () => void;
  maxRenderedPosts?: number;
  tickMs?: number;
}) {
  const {
    events,
    seed = 1234,
    autoStart = true,
    onCut,
    maxRenderedPosts = DEFAULT_MAX_POSTS,
    tickMs = DEFAULT_TICK_MS,
  } = params;

  const sound = useMemo(() => createSoundBus(seed), [seed]);
  const [posts, setPosts] = useState<SocialPost[]>([]);

  // refs “stateful”
  const t0Ref = useRef<number>(0);
  const cursorRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const startedRef = useRef<boolean>(false);

  // evitar closures viejas
  const eventsRef = useRef<SocialEvent[]>(events);
  const onCutRef = useRef<typeof onCut>(onCut);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    onCutRef.current = onCut;
  }, [onCut]);

  const postsByIdRef = useRef<Record<string, SocialPost>>({});
  const orderRef = useRef<string[]>([]);
  const aliveRef = useRef<Set<string>>(new Set());

  function pruneIfNeeded() {
    while (orderRef.current.length > maxRenderedPosts) {
      const oldId = orderRef.current.shift();
      if (!oldId) break;
      delete postsByIdRef.current[oldId];
      aliveRef.current.delete(oldId);
    }
  }

  function applySpawn(ev: Extract<SocialEvent, { type: "spawn" }>, elapsed: number) {
    const p: SocialPost = {
      ...ev.post,
      counts: { likes: 0, comments: 0, shares: 0 },
      spawnedAtMs: elapsed,
    };

    postsByIdRef.current[p.id] = p;
    aliveRef.current.add(p.id);
    orderRef.current.push(p.id);

    pruneIfNeeded();
    sound.play("spawn", 0.22);
  }

  function applyInc(ev: Extract<SocialEvent, { type: "inc" }>) {
    if (!aliveRef.current.has(ev.postId)) return;
    const p = postsByIdRef.current[ev.postId];
    if (!p) return;

    p.counts.likes += Math.max(0, ev.likes ?? 0);
    p.counts.comments += Math.max(0, ev.comments ?? 0);
    p.counts.shares += Math.max(0, ev.shares ?? 0);

    if (ev.sfx === "tick") sound.play("tick", 0.2);
    if (ev.sfx === "pop") sound.play("pop", 0.22);
    if (ev.sfx === "swish") sound.play("swish", 0.22);
  }

  function flushToReact() {
    const arr = orderRef.current.map((id) => postsByIdRef.current[id]).filter(Boolean);
    setPosts(arr);
  }

  function stop() {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ✅ tick estable (NO closure de props / events)
  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    const elapsed = performance.now() - t0Ref.current;
    const evs = eventsRef.current;

    while (cursorRef.current < evs.length) {
      const ev = evs[cursorRef.current];
      if (ev.t > elapsed) break;

      if (ev.type === "spawn") applySpawn(ev, elapsed);
      if (ev.type === "inc") applyInc(ev);

      if (ev.type === "cut") {
        stop();
        sound.dispose();
        onCutRef.current?.();
        return;
      }

      cursorRef.current += 1;
    }

    flushToReact();

    if (cursorRef.current >= evs.length) {
      stop();
    }
  };

  function start() {
    // ✅ idempotente + evita duplicar interval
    if (timerRef.current != null) return;

    startedRef.current = true;
    t0Ref.current = performance.now();
    cursorRef.current = 0;

    // reset estado interno
    postsByIdRef.current = {};
    orderRef.current = [];
    aliveRef.current = new Set();

    // correr 1 tick inmediato
    tickRef.current();

    timerRef.current = window.setInterval(() => {
      tickRef.current();
    }, Math.max(16, tickMs));
  }

  // ✅ AutoStart SIN cleanup por re-render.
  // Solo limpiamos en unmount.
  useEffect(() => {
    if (autoStart) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // cleanup real al desmontar
  useEffect(() => {
    return () => {
      stop();
      // sound.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function revealSfxLoud() {
    sound.play("reveal", 1.0);
  }

  return { posts, start, stop, revealSfxLoud };
}
