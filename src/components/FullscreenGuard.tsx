// src/components/FullscreenGuard.tsx
"use client";

import React, { useEffect, useState } from "react";
import FullscreenGate from "@/components/FullscreenGate";
import { useFullscreen } from "@/hooks/useFullscreen";

export default function FullscreenGuard({
  children,
  onReady,
}: {
  children: React.ReactNode;
  onReady?: () => void;
}) {
  const { enter, isFullscreen } = useFullscreen();
  const [readyOnce, setReadyOnce] = useState(false);
  const isDev = process.env.NODE_ENV !== "production";

  // Cuando el usuario sale de fullscreen, reseteamos el readyOnce
  useEffect(() => {
		if(isDev) return
    const t = setInterval(() => {
      if (!isFullscreen()) setReadyOnce(false);
    }, 1000);
    return () => clearInterval(t);
  }, [isFullscreen]);

  if (!isFullscreen() || !readyOnce) {
    return (
      <FullscreenGate
        onReady={async () => {
          // Gate unlock + intentar entrar a fullscreen
          try {

            await enter();
          } catch {}
          setReadyOnce(true);
          onReady && onReady();
        }}
      />
    );
  }

  return <>{children}</>;
}
