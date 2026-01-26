"use client";

export type RafId = number;

export function raf(cb: (t: number) => void): RafId {
  if (typeof window === "undefined") return 0 as any;

  const fn = window.requestAnimationFrame;
  if (typeof fn === "function") return fn(cb);

  // fallback duro
  return window.setTimeout(() => cb(performance.now()), 16);
}

export function caf(id: RafId) {
  if (typeof window === "undefined") return;

  const fn = window.cancelAnimationFrame;
  if (typeof fn === "function") fn(id);
  else window.clearTimeout(id);
}
