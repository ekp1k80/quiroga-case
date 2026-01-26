import { SocialEvent } from "./types";
import { mulberry32, randRange, spawnLayout } from "./rng";
import {
  SECTION_NEWS,
  SECTION_SIGNAL,
  SECTION_REACTION,
  SECTION_NOISE_POOL,
} from "@/data/socialStormSeedPosts";

type SeedPost = { author: string; handle: string; verified?: boolean; text: string };

function pick<T>(arr: T[], r: () => number) {
  return arr[Math.floor(r() * arr.length)];
}

function makeId(i: number) {
  return `p_${i}_${Math.random().toString(36).slice(2, 7)}`;
}

function pushSpawn(events: SocialEvent[], i: number, t: number, sp: SeedPost, r: () => number, early: boolean) {
  const lay = spawnLayout(early, r);
  events.push({
    t,
    type: "spawn",
    post: {
      id: makeId(i),
      author: sp.author,
      handle: sp.handle,
      verified: sp.verified,
      text: sp.text,
      timeLabel: early ? "ahora" : r() < 0.33 ? "hace 1 min" : r() < 0.66 ? "hace 2 min" : "hace 3 min",
      ...lay,
      z: 10 + i,
    },
  });
}

function scheduleIncs(
  events: SocialEvent[],
  r: () => number,
  postId: string,
  spawnT: number,
  phase: "early" | "mid" | "chaos"
) {
  const life =
    phase === "early" ? randRange(r, 16_000, 24_000) : phase === "mid" ? randRange(r, 10_000, 18_000) : randRange(r, 6_000, 12_000);

  const endT = spawnT + life;
  const baseGap = phase === "early" ? 420 : phase === "mid" ? 180 : 75;
  let t = spawnT + randRange(r, 250, 900);

  while (t < endT) {
    const likes =
      phase === "early"
        ? r() < 0.7
          ? 1
          : 2
        : phase === "mid"
        ? r() < 0.65
          ? 1
          : r() < 0.9
          ? 2
          : 3
        : r() < 0.5
        ? 2
        : r() < 0.85
        ? 3
        : 5;

    const comments = r() < (phase === "chaos" ? 0.16 : 0.10) ? 1 : 0;
    const shares = r() < (phase === "chaos" ? 0.09 : 0.05) ? 1 : 0;

    events.push({
      t,
      type: "inc",
      postId,
      likes,
      comments: comments || undefined,
      shares: shares || undefined,
      sfx: shares ? "swish" : comments ? "pop" : "tick",
    });

    const jitter = phase === "chaos" ? 30 : 60;
    t += Math.max(55, baseGap + randRange(r, -jitter, jitter));
  }
}

export function buildSocialStormTimeline(seed: number) {
  const r = mulberry32(seed);
  const events: SocialEvent[] = [];
  let idx = 0;

  // Fase 1: news legible
  {
    let t = 0;
    for (let k = 0; k < SECTION_NEWS.length; k++) {
      t += 3200 + randRange(r, -450, 450);
      pushSpawn(events, idx++, t, SECTION_NEWS[k], r, true);
    }
  }

  // Fase 2: reacción + señal
  {
    let t = 18_000;
    const pool = [...SECTION_REACTION, ...SECTION_SIGNAL];
    const count = 12;
    for (let k = 0; k < count; k++) {
      t += 1600 + randRange(r, -500, 500);
      pushSpawn(events, idx++, t, pick(pool, r), r, false);
    }
  }

  // Fase 3: transición
  {
    let t = 30_000;
    const pool = [...SECTION_REACTION, ...SECTION_SIGNAL, ...SECTION_NOISE_POOL];
    const count = 16;
    for (let k = 0; k < count; k++) {
      t += 650 + randRange(r, -280, 280);
      pushSpawn(events, idx++, t, pick(pool, r), r, false);
    }
  }

  // Fase 4: ruido (pero cortamos a mitad)
  let cutAt = 52_000; // fallback
  {
    let t = 40_000;
    const count = 140;

    // calculamos un “medio” real del bloque
    const half = Math.floor(count / 2);

    for (let k = 0; k < count; k++) {
      t += 55 + randRange(r, -25, 35);
      pushSpawn(events, idx++, t, pick(SECTION_NOISE_POOL, r), r, false);

      if (k === half) {
        cutAt = t;
      }
    }
  }

  // Increments por post (hasta el cut igual sirve)
  const spawnEvents = events.filter((e) => e.type === "spawn") as Extract<SocialEvent, { type: "spawn" }>[];
  for (const sp of spawnEvents) {
    const spawnT = sp.t;
    const phase: "early" | "mid" | "chaos" = spawnT < 18_000 ? "early" : spawnT < 40_000 ? "mid" : "chaos";
    scheduleIncs(events, r, sp.post.id, spawnT, phase);
  }

  // ✅ corte a negro (desmontaje)
  events.push({ t: cutAt, type: "cut" });

  events.sort((a, b) => a.t - b.t);
  return { events, cutAtMs: cutAt };
}
