// src/components/SocialStorm/SocialStormScene.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import SocialStorm from "./SocialStorm";
import { buildSocialStormTimeline } from "./buildTimeline";
import { useSocialStorm } from "./useSocialStorm";
import type { SocialPost } from "./types";
import PostCard from "./PostCard";

export default function SocialStormScene(props: {
  seed?: number;
  onDone?: () => void; // tap en "ver audio"
}) {
  const seed = props.seed ?? 1337;

  const [cut, setCut] = useState(false);
  const [showFinalTweet, setShowFinalTweet] = useState(false);

  const built = useMemo(() => buildSocialStormTimeline(seed), [seed]);

  const { posts, start } = useSocialStorm({
    events: built.events,
    seed,
    autoStart: true, // ya estás bajo FullscreenGate global => sin tap interno acá
    maxRenderedPosts: 80,
    onCut: () => {
      setCut(true);
      window.setTimeout(() => setShowFinalTweet(true), 5000); // negro ~10s
    },
  });

  return (
    <Stage>
      {!cut ? <SocialStorm posts={posts} /> : <Black />}

      {cut && showFinalTweet ? <FinalTweetOverlay onDone={() => props.onDone?.()} /> : null}
    </Stage>
  );
}

/* ---------------- Final Tweet Overlay ---------------- */

function FinalTweetOverlay({ onDone }: { onDone: () => void }) {
  const [counts, setCounts] = useState({ likes: 0, comments: 0, shares: 0 });

  // ✅ reveal directo (NO bus / NO hook)
  useEffect(() => {
    const a = new Audio("/media/social/reveal.mp3");
    a.preload = "auto";
    (a as any).playsInline = true;

    // fuerte
    a.volume = 1.0;

    // por si quedó “en el medio”
    try {
      a.currentTime = 0;
    } catch {}

    // intentar reproducir
    a.play().catch((e) => {
      // no hacemos unlock acá; solo log por si algo falla
      console.warn("[FinalTweetOverlay] reveal play failed:", e?.name, e?.message);
    });

    return () => {
      try {
        a.pause();
        a.currentTime = 0;
        a.src = "";
        a.load();
      } catch {}
    };
  }, []);

  // ⚡ incrementos ultra rápidos
  useEffect(() => {
    let alive = true;

    const startT = performance.now();
    const target = { likes: 12800, comments: 920, shares: 430 };

    let intervalId: number | null = null;

    const rafTick = () => {
      if (!alive) return;

      const t = Math.min(1, (performance.now() - startT) / 1800);
      const ease = 1 - Math.pow(1 - t, 3);

      const jitter = (base: number) => Math.max(0, Math.floor(base + (Math.random() * 10 - 5)));

      setCounts({
        likes: jitter(target.likes * ease),
        comments: jitter(target.comments * ease),
        shares: jitter(target.shares * ease),
      });

      if (t < 1) {
        requestAnimationFrame(rafTick);
      } else {
        intervalId = window.setInterval(() => {
          setCounts((c) => ({
            likes: c.likes + (Math.random() < 0.7 ? 8 : 16),
            comments: c.comments + (Math.random() < 0.6 ? 2 : 4),
            shares: c.shares + (Math.random() < 0.65 ? 1 : 2),
          }));
        }, 45);
      }
    };

    requestAnimationFrame(rafTick);

    return () => {
      alive = false;
      if (intervalId != null) window.clearInterval(intervalId);
    };
  }, []);

  const finalPost = useMemo<SocialPost>(() => {
    return {
      id: "final",
      author: "Redacción Judicial",
      handle: "@redaccionjud",
      verified: true,
      text: "Se filtró el audio de la interrogación del detenido.\n\n▶ Ver audio",
      timeLabel: "ahora",
      linkLabel: "Ver audio",
      counts,
      x: 0.5,
      y: 0.48,
      rot: 0,
      scale: 1.08,
      z: 9999,
      spawnedAtMs: 0,
    } as any;
  }, [counts]);

  return (
    <FinalWrap>
      <FinalCard onClick={onDone} role="button" aria-label="Ver audio filtrado">
        <Inner>
          <PostCard post={finalPost as any} isEarly />
        </Inner>
        <Hint>Tocar para ver el audio</Hint>
      </FinalCard>
    </FinalWrap>
  );
}

/* ---------------- styles ---------------- */

const Stage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const Black = styled.div`
  position: absolute;
  inset: 0;
  background: #000;
`;

const FinalWrap = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
`;

const FinalCard = styled.div`
  width: min(94vw, 420px);
  display: grid;
  gap: 12px;
  cursor: pointer;
`;

const Inner = styled.div`
  display: grid;
  place-items: center;
`;

const Hint = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 13px;
`;
