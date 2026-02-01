"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AudioMeter, { type AudioMeterHandle } from "./AudioMeter";
import { AudioVizConfig } from "@/data/packs";

type Props = {
  src: string; // objectUrl
  blob: Blob; // compat
  title?: string;
  viz: AudioVizConfig;
  showControls?: boolean;
  autoPlay?: boolean;
  onEnded?: () => void;
  barCount?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  src,
  blob: _blob,
  title,
  viz,
  showControls = true,
  autoPlay = false,
  onEnded,
  barCount,
}: Props) {
  const meterRef = useRef<AudioMeterHandle>(null);

  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const lastTimeRef = useRef(0);
  const wasPlayingRef = useRef(false);

  const [needsTapToResume, setNeedsTapToResume] = useState(false);

  const setAudioRef = useCallback((node: HTMLAudioElement | null) => {
    audioElRef.current = node;
    setAudioEl(node);

    if (node) {
      // iOS/Safari hints
      node.setAttribute("playsinline", "true");
      node.setAttribute("webkit-playsinline", "true");
    }
  }, []);

  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;

    const onLoaded = () => setDuration(el.duration || 0);
    const onTime = () => {
      const t = el.currentTime || 0;
      setCurrent(t);
      lastTimeRef.current = t;
    };
    const onPlay = () => {
      setIsPlaying(true);
      wasPlayingRef.current = true;
      setNeedsTapToResume(false);
    };
    const onPause = () => {
      setIsPlaying(false);
      wasPlayingRef.current = false;
    };
    const onEndedInternal = () => {
      setIsPlaying(false);
      wasPlayingRef.current = false;
      setNeedsTapToResume(false);
      onEnded?.();
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEndedInternal);

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEndedInternal);
    };
  }, [src, onEnded]);

  async function safeResumeMeter() {
    try {
      await meterRef.current?.resume();
    } catch (e) {
      console.error(e);
    }
  }

  async function tryPlay(fromUserGesture: boolean) {
    const el = audioElRef.current;
    if (!el) return;

    try {
      await safeResumeMeter();

      // si el SO lo cortó, re-seteamos el tiempo guardado para evitar "reinicio"
      if (lastTimeRef.current > 0 && Math.abs(el.currentTime - lastTimeRef.current) > 0.25) {
        el.currentTime = lastTimeRef.current;
      }

      await el.play();
      setNeedsTapToResume(false);
    } catch (e) {
      console.error(e);
      // en iOS muchas veces solo permite play si viene de un gesto
      if (!fromUserGesture) setNeedsTapToResume(true);
    }
  }

  async function togglePlay() {
    const el = audioElRef.current;
    if (!el) return;

    if (el.paused) {
      await tryPlay(true);
    } else {
      el.pause();
    }
  }

  function seekBy(delta: number) {
    const el = audioElRef.current;
    if (!el) return;
    const next = clamp(el.currentTime + delta, 0, el.duration || Infinity);
    el.currentTime = next;
    lastTimeRef.current = next;
    setCurrent(next);
  }

  // AutoPlay: solo si el browser lo permite (si no, cae al botón “Tap to resume”)
  useEffect(() => {
    if (!autoPlay) return;
    void tryPlay(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, src, audioEl]);

  // Guardar estado al bloquear / ocultar y reanudar al volver
  useEffect(() => {
    const saveState = () => {
      const el = audioElRef.current;
      if (!el) return;
      lastTimeRef.current = el.currentTime || 0;
      wasPlayingRef.current = !el.paused && !el.ended;
    };

    const restoreState = async () => {
      const el = audioElRef.current;
      if (!el) return;

      // restaurar tiempo para evitar volver al inicio
      if (lastTimeRef.current > 0 && Math.abs(el.currentTime - lastTimeRef.current) > 0.25) {
        el.currentTime = lastTimeRef.current;
      }

      // si estaba reproduciendo antes, intentamos seguir
      if (wasPlayingRef.current) {
        await tryPlay(false);
      } else {
        // aunque no estuviera, el meter a veces queda suspendido
        await safeResumeMeter();
      }
    };

    const onVisibility = () => {
      if (document.hidden) saveState();
      else void restoreState();
    };

    const onPageHide = () => saveState();
    const onPageShow = () => void restoreState();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const sliderMax = useMemo(() => duration || 0, [duration]);
  const sliderVal = useMemo(() => Math.min(current, duration || 0), [current, duration]);

  return (
    <div style={{ display: "grid", gap: 10, padding: 1, borderRadius: 12 }}>
      {title ? <div style={{ fontWeight: 600 }}>{title}</div> : null}

      <audio
        ref={setAudioRef}
        src={src}
        preload="auto"
        playsInline
      />

      {showControls && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => seekBy(-10)}>-10</button>
          <button onClick={togglePlay}>{isPlaying ? "Pause" : "Play"}</button>
          <button onClick={() => seekBy(10)}>+10</button>

          <div style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
            {formatTime(current)} / {formatTime(duration)}
          </div>
        </div>
      )}

      {needsTapToResume ? (
        <button
          onClick={() => void tryPlay(true)}
          style={{
            height: 44,
            borderRadius: 10,
            fontWeight: 600,
          }}
        >
          Tap to resume audio
        </button>
      ) : null}

      {audioEl ? (
        <AudioMeter barCount={barCount} ref={meterRef} audioEl={audioEl} viz={viz} />
      ) : (
        <div style={{ height: 128 }} />
      )}

      {showControls && (
        <input
          type="range"
          min={0}
          max={sliderMax}
          step={0.01}
          value={sliderVal}
          onChange={(e) => {
            const el = audioElRef.current;
            if (!el) return;
            const t = Number(e.target.value);
            el.currentTime = t;
            lastTimeRef.current = t;
            setCurrent(t);
          }}
          style={{ width: "100%" }}
        />
      )}
    </div>
  );
}
