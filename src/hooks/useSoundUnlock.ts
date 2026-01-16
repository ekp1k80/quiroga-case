"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseSoundUnlockReturn = {
  unlocked: boolean;
  audioContextRef: React.MutableRefObject<AudioContext | null>;
  unlockNow: () => Promise<boolean>;
};

export function useSoundUnlock(): UseSoundUnlockReturn {
  const [unlocked, setUnlocked] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);

  const unlockNow = useCallback(async () => {
    try {
      const AudioContextCtor =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return false;

      if (!ctxRef.current) ctxRef.current = new AudioContextCtor();

      // resume es clave
      if ((ctxRef.current as AudioContext ).state !== "running") {
        await (ctxRef.current as AudioContext ).resume();
      }

      // “tick” inaudible para consolidar el unlock
      const osc = (ctxRef.current as AudioContext ).createOscillator();
      const gain = (ctxRef.current as AudioContext ).createGain();
      gain.gain.value = 0.00001; // casi inaudible, pero no 0 por si algún browser optimiza
      osc.connect(gain);
      gain.connect((ctxRef.current as AudioContext ).destination);
      osc.start();
      osc.stop((ctxRef.current as AudioContext ).currentTime + 0.01);

      setUnlocked(true);
      try {
        localStorage.setItem("audioUnlocked", "1");
      } catch {}

      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem("audioUnlocked") === "1") {
        // Ojo: aún así algunos browsers requieren gesto, pero ayuda
        setUnlocked(true);
      }
    } catch {}
  }, []);

  // Si querés “auto” con el primer gesto en cualquier lugar:
  useEffect(() => {
    if (unlocked) return;

    const handler = () => {
      void unlockNow();
    };

    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("touchstart", handler);
      window.removeEventListener("keydown", handler);
    };
  }, [unlocked, unlockNow]);

  return { unlocked, audioContextRef: ctxRef, unlockNow };
}
