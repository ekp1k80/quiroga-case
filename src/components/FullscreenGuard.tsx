"use client";

import React, { useEffect, useMemo, useState } from "react";
import FullscreenGate from "@/components/FullscreenGate";
import { useFullscreen } from "@/hooks/useFullscreen";

async function requestWakeLock() {
  try {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      return await navigator.wakeLock.request("screen");
    }
  } catch {}
  return null;
}

async function releaseWakeLock(sentinel: any) {
  try {
    await sentinel?.release?.();
  } catch {}
}

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

  const [wakeSentinel, setWakeSentinel] = useState<any>(null);

  const canWakeLock = useMemo(() => {
    return typeof navigator !== "undefined" && "wakeLock" in navigator;
  }, []);

  const ensureWakeLock = async () => {
    if (!canWakeLock) return;
    const s = await requestWakeLock();
    if (s) {
      setWakeSentinel(s);
      try {
        s.addEventListener?.("release", () => {
          setWakeSentinel(null);
        });
      } catch {}
    }
  };

  // cuando salís de fullscreen, resetea ready y suelta wake lock
  useEffect(() => {
    if (isDev) return;

    const t = setInterval(() => {
      if (!isFullscreen()) {
        setReadyOnce(false);
      }
    }, 1000);

    return () => clearInterval(t);
  }, [isFullscreen, isDev]);

  useEffect(() => {
    if (isDev) return;

    const tick = async () => {
      if (isFullscreen()) {
        if (!wakeSentinel) await ensureWakeLock();
      } else {
        if (wakeSentinel) {
          await releaseWakeLock(wakeSentinel);
          setWakeSentinel(null);
        }
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void tick();
    };

    document.addEventListener("visibilitychange", onVisibility);
    void tick();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeSentinel, isDev, isFullscreen]);

  useEffect(() => {
    return () => {
      void releaseWakeLock(wakeSentinel);
    };
  }, [wakeSentinel]);

  if (!isFullscreen() || !readyOnce) {
    return (
      <FullscreenGate
        onReady={async () => {
          try {
            await enter();
          } catch {}

          if (!isDev) {
            await ensureWakeLock();
          }

          setReadyOnce(true);
          onReady && onReady();
        }}
      />
    );
  }

  return <>{children}</>;
}
