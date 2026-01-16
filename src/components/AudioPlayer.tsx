"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const meterRef = useRef<AudioMeterHandle>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  // ✅ clave: cuando el <audio> existe, forzamos render para pasar audioEl no-null al AudioMeter
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // En cuanto el ref se setea (post-mount), guardamos el elemento en estado
    if (audioRef.current && audioEl !== audioRef.current) {
      setAudioEl(audioRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRef.current]); // sí, esto funciona en la práctica: dispara al mount

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => setDuration(el.duration || 0);
    const onTime = () => setCurrent(el.currentTime || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEndedInternal = () => {
      setIsPlaying(false);
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
      // Si audioEl todavía es null, no hay graph posible
      if (!audioRef.current) return;
      await meterRef.current?.resume();
    } catch (e) {
      console.error(e);
    }
  }

  async function togglePlay() {
    const el = audioRef.current;
    if (!el) return;

    try {
      if (el.paused) {
        await safeResumeMeter();
        await el.play();
      } else {
        el.pause();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function runAutoPlay() {
    const el = audioRef.current;
    if (!el) return;

    try {
      // ✅ MUY importante: asegurar que AudioMeter ya recibió audioEl no-null
      // Esperamos al próximo tick si todavía no se actualizó el state.
      if (!audioEl) {
        await new Promise<void>((r) => setTimeout(() => r(), 0));
      }

      await safeResumeMeter();
      await el.play();
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (!autoPlay) return;
    void runAutoPlay();
    // reintenta si cambia el src o cuando el audioEl se vuelva no-null
  }, [autoPlay, src, audioEl]);

  function seekBy(delta: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = clamp(el.currentTime + delta, 0, el.duration || Infinity);
  }

  const sliderMax = useMemo(() => duration || 0, [duration]);
  const sliderVal = useMemo(() => Math.min(current, duration || 0), [current, duration]);

  return (
    <div style={{ display: "grid", gap: 10, padding: 1, borderRadius: 12 }}>
      {title ? <div style={{ fontWeight: 600 }}>{title}</div> : null}

      <audio ref={audioRef} src={src} preload="metadata" />

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

      {/* ✅ Solo renderizamos el meter cuando audioEl ya existe */}
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
            const el = audioRef.current;
            if (!el) return;
            el.currentTime = Number(e.target.value);
          }}
          style={{ width: "100%" }}
        />
      )}
    </div>
  );
}
