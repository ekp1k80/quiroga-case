"use client";

type SoundKey = "tick" | "pop" | "swish" | "spawn" | "reveal";

const SOUND_FILES: Record<SoundKey, string[]> = {
  tick: ["/media/social/like.mp3"],
  pop: ["/media/social/pop.mp3"],
  swish: ["/media/social/swish.mp3"],
  spawn: ["/media/social/spawn.mp3"],
  reveal: ["/media/social/reveal.mp3"],
};

function pick<T>(arr: T[], r: () => number) {
  return arr[Math.floor(r() * arr.length)];
}

export function createSoundBus(seed = 1234) {
  let s = seed >>> 0;
  const r = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  let disposed = false;

  const lastPlay: Record<SoundKey, number> = { tick: 0, pop: 0, swish: 0, spawn: 0, reveal: 0 };
  const minGapMs: Record<SoundKey, number> = { tick: 55, pop: 120, swish: 160, spawn: 110, reveal: 0 };

  const pool: HTMLAudioElement[] = [];
  const all = new Set<HTMLAudioElement>();
  const POOL_SIZE = 12;

  function ensurePool() {
    if (disposed) return;
    if (pool.length) return;

    for (let i = 0; i < POOL_SIZE; i++) {
      const a = new Audio();
      a.preload = "auto";
      (a as any).playsInline = true;
      pool.push(a);
      all.add(a);
    }
  }

  function nextAudio() {
    if (disposed) return null;
    ensurePool();
    if (!pool.length) return null;
    const a = pool.shift()!;
    pool.push(a);
    return a;
  }

  function hardStop(a: HTMLAudioElement) {
    try {
      a.pause();
      a.currentTime = 0;
      // no vaciamos src acá, para permitir reuso rápido sin re-instanciar todo
    } catch {}
  }

  // ✅ NUEVO: cortar todo lo que esté sonando YA, pero sin matar el bus
  function stopAll() {
    if (disposed) return;
    for (const a of all) hardStop(a);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;

    for (const a of all) {
      try {
        a.pause();
        a.currentTime = 0;
        a.volume = 0;
        a.src = "";
        a.load();
      } catch {}
    }

    pool.length = 0;
    all.clear();
  }

  function play(key: SoundKey, volume = 0.25) {
    if (disposed) return;

    const now = performance.now();
    if (now - lastPlay[key] < minGapMs[key]) return;
    lastPlay[key] = now;

    const a = nextAudio();
    if (!a) return;

    try {
      a.pause();
      a.currentTime = 0;

      a.src = pick(SOUND_FILES[key], r);
      a.playbackRate = 0.98 + r() * 0.05;
      a.volume = Math.max(0, Math.min(1, volume));

      a.play().catch(() => {});
    } catch {}
  }

  return { play, stopAll, dispose };
}
