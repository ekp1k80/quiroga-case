export function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randRange(r: () => number, a: number, b: number) {
  return a + r() * (b - a);
}

export function spawnLayout(isFirstOrEarly: boolean, r: () => number) {
  if (isFirstOrEarly) {
    // centrado + apilado leve
    const dy = (-0.10 + r() * 0.20) * 0.22; // +- ~2.2% de pantalla
    return { x: 0.5, y: 0.44 + dy, rot: -1 + r() * 2, scale: 1.06 };
  }

  return {
    x: 0.05 + r() * 0.90,
    y: 0.08 + r() * 0.84,
    rot: -20 + r() * 40,
    scale: 0.72 + r() * 0.38,
  };
}
