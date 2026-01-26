"use client";

import React from "react";
import styled from "styled-components";
import PostCard from "./PostCard";
import type { SocialPost } from "./types";

export default function SocialStorm(props: {
  posts: SocialPost[];
  dimBackground?: boolean;
  showVignette?: boolean;
}) {
  const { posts, dimBackground = true, showVignette = true } = props;

  const now = typeof window !== "undefined" ? performance.now() : 0;

  return (
    <Stage>
      {dimBackground ? <Backdrop /> : null}
      {showVignette ? <Vignette /> : null}

      <Layer>
        {posts.map((p) => {
          const isEarlyPhase = p.spawnedAtMs < 18_000;

          // ✅ boost solo un rato
          const ageMs = now - p.spawnedAtMs;
          const boostMs = 4500; // ajustá: 3500-6000
          const shouldBoost = isEarlyPhase && ageMs >= 0 && ageMs < boostMs;

          const z = shouldBoost ? 9999 : p.z;

          return (
            <Placed key={p.id} $x={p.x} $y={p.y} $z={z}>
              <PostCard post={p} isEarly={isEarlyPhase} />
            </Placed>
          );
        })}
      </Layer>
    </Stage>
  );
}

const Stage = styled.div`
  position: fixed;
  inset: 0;
  overflow: hidden;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(1200px 900px at 50% 20%, rgba(25, 25, 30, 0.72), rgba(0, 0, 0, 0.95));
`;

const Vignette = styled.div`
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 160px rgba(0, 0, 0, 0.75);
  pointer-events: none;
`;

const Layer = styled.div`
  position: absolute;
  inset: 0;
`;

const Placed = styled.div<{ $x: number; $y: number; $z: number }>`
  position: absolute;
  left: ${(p) => p.$x * 100}%;
  top: ${(p) => p.$y * 100}%;
  transform: translate(-50%, -50%);
  z-index: ${(p) => p.$z};
`;
