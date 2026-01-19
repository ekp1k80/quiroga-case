"use client";

import React, { useEffect, useState } from "react";

type Props = {
  playing?: boolean;
  frameMs?: number;
  size?: number;
  frames: string[];
};

export default function CharacterAnimation({
  playing = true,
  frameMs = 200,
  size = 96,
  frames = []
}: Props) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!playing) return;

    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, frameMs);

    return () => window.clearInterval(id);
  }, [playing, frameMs]);

  return (
    <img
      src={frames[frame]}
      alt="Martín caminando"
      width={size}
      height={size}
      style={{
        imageRendering: "pixelated",
        display: "block",
        userSelect: "none",
      }}
      draggable={false}
    />
  );
}
