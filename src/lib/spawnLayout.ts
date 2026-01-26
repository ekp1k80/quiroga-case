export function spawnLayout(isFirst: boolean, r: () => number) {
  if (isFirst) return { x: 0.5, y: 0.5, rot: 0, scale: 1.05 };

  return {
    x: 0.08 + r() * 0.84, // permite cortar bordes
    y: 0.10 + r() * 0.80,
    rot: -20 + r() * 40,
    scale: 0.72 + r() * 0.36,
  };
}