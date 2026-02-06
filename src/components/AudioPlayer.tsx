"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AudioMeter, { type AudioMeterHandle } from "./AudioMeter";
import { AudioVizConfig } from "@/data/packs";
import { useUserState } from "@/hooks/orchestrator/useUserState";

function IconPlay() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function IconPause() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
    </svg>
  );
}
function IconBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 19V5l-9 7zM13 5h2v14h-2z" />
    </svg>
  );
}
function IconFwd() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 5v14l9-7zM9 5h2v14H9z" />
    </svg>
  );
}

type Props = {
  audioKey?: string;
  src: string;
  blob: Blob;
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

type AudioSessionState = {
  t: number;
  wasPlaying: boolean;
  volume: number;
  rate: number;
  savedAt: number;
};

function loadSession(key: string): AudioSessionState | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as AudioSessionState;
  } catch {
    return null;
  }
}

function saveSession(key: string, state: AudioSessionState) {
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {}
}

function clearSession(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

export default function AudioPlayer({
  audioKey,
  src,
  blob: _blob,
  title,
  viz,
  showControls = true,
  autoPlay = false,
  onEnded,
  barCount,
}: Props) {
  const { user } = useUserState();

  const meterRef = useRef<AudioMeterHandle>(null);

  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

  const lastTimeRef = useRef(0);
  const wasPlayingRef = useRef(false);

  const [needsTapToResume, setNeedsTapToResume] = useState(false);

  const sessionKey = useMemo(() => {
    const id = user?.id;
    const storyNode = user?.storyNode;
    if (!id || !storyNode || !audioKey) return null;
    return `cq:audio:v1:${id}:${storyNode}:${audioKey}`;
  }, [user?.id, user?.storyNode, audioKey]);

  const setAudioRef = useCallback((node: HTMLAudioElement | null) => {
    audioElRef.current = node;
    setAudioEl(node);

    if (node) {
      node.setAttribute("playsinline", "true");
      node.setAttribute("webkit-playsinline", "true");
    }
  }, []);

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

      if (lastTimeRef.current > 0 && Math.abs(el.currentTime - lastTimeRef.current) > 0.25) {
        el.currentTime = lastTimeRef.current;
      }

      await el.play();
      setNeedsTapToResume(false);
    } catch (e) {
      console.error(e);
      if (!fromUserGesture) setNeedsTapToResume(true);
    }
  }

  async function togglePlay() {
    const el = audioElRef.current;
    if (!el) return;

    if (el.paused) await tryPlay(true);
    else el.pause();
  }

  function seekBy(delta: number) {
    const el = audioElRef.current;
    if (!el) return;
    const next = clamp(el.currentTime + delta, 0, el.duration || Infinity);
    el.currentTime = next;
    lastTimeRef.current = next;
    setCurrent(next);
  }

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
      if (sessionKey) clearSession(sessionKey);
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
  }, [src, onEnded, sessionKey]);

  useEffect(() => {
    if (!autoPlay) return;
    void tryPlay(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, src, audioEl]);

  useEffect(() => {
    if (!sessionKey) return;

    const save = () => {
      const el = audioElRef.current;
      if (!el) return;

      saveSession(sessionKey, {
        t: el.currentTime || 0,
        wasPlaying: !el.paused && !el.ended,
        volume: el.volume,
        rate: el.playbackRate,
        savedAt: Date.now(),
      });
    };

    const restore = () => {
      const el = audioElRef.current;
      if (!el) return;

      const st = loadSession(sessionKey);
      if (!st) return;

      const apply = () => {
        try {
          const t = Number.isFinite(st.t) ? st.t : 0;
          el.currentTime = t;
          el.volume = typeof st.volume === "number" ? st.volume : el.volume;
          el.playbackRate = typeof st.rate === "number" ? st.rate : el.playbackRate;
          lastTimeRef.current = t;
          setCurrent(t);
        } catch {}
      };

      if (Number.isFinite(el.duration) && el.duration > 0) {
        apply();
      } else {
        const onMeta = () => {
          apply();
          el.removeEventListener("loadedmetadata", onMeta);
        };
        el.addEventListener("loadedmetadata", onMeta);
      }

      if (st.wasPlaying) void tryPlay(false);
      else void safeResumeMeter();
    };

    const onVisibility = () => {
      if (document.hidden) save();
      else restore();
    };

    const onPageHide = () => save();
    const onPageShow = () => restore();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    restore();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [sessionKey]);

  const sliderMax = useMemo(() => duration || 0, [duration]);
  const sliderVal = useMemo(() => Math.min(current, duration || 0), [current, duration]);

  return (
    <div style={{ display: "grid", gap: 10, padding: 1, borderRadius: 12 }}>
      {title ? <div style={{ fontWeight: 600 }}>{title}</div> : null}

      <audio ref={setAudioRef} src={src} preload="auto" playsInline />

      {showControls && (
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            padding: 10,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <button
            type="button"
            onClick={() => seekBy(-10)}
            aria-label="Retroceder 10 segundos"
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.18)",
              color: "rgba(255,255,255,0.92)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            <IconBack />
            <span style={{ fontSize: 12, opacity: 0.9 }}>10</span>
          </button>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 999,
              border: "1px solid rgba(140,255,180,0.45)",
              background: "rgba(140,255,180,0.18)",
              color: "rgba(255,255,255,0.98)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
            <span style={{ fontSize: 12, letterSpacing: 0.2 }}>{isPlaying ? "Pause" : "Play"}</span>
          </button>

          <button
            type="button"
            onClick={() => seekBy(10)}
            aria-label="Avanzar 10 segundos"
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.18)",
              color: "rgba(255,255,255,0.92)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            <span style={{ fontSize: 12, opacity: 0.9 }}>10</span>
            <IconFwd />
          </button>

          <div
            style={{
              marginLeft: "auto",
              fontVariantNumeric: "tabular-nums",
              fontSize: 12,
              opacity: 0.85,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.18)",
              whiteSpace: "nowrap",
            }}
          >
            {formatTime(current)} / {formatTime(duration)}
          </div>
        </div>
      )}


      {needsTapToResume ? (
        <button onClick={() => void tryPlay(true)} style={{ height: 44, borderRadius: 10, fontWeight: 600 }}>
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
