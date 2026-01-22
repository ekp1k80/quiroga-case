// src/lib/assets/publicAssets.ts
export type PublicAsset = { src: string; blob: Blob };
type AssetMap = Record<string, PublicAsset | undefined>;

const cache = new Map<string, PublicAsset>();

export async function fetchPublicBlobCached(path: string): Promise<PublicAsset> {
  const hit = cache.get(path);
  if (hit) return hit;

  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Public asset fetch failed: ${path}`);
  const blob = await res.blob();
  const src = URL.createObjectURL(blob);

  const asset = { src, blob };
  cache.set(path, asset);
  return asset;
}

export async function prefetchPublicAssets(paths: string[]): Promise<AssetMap> {
  const out: AssetMap = {};
  await Promise.all(
    paths.map(async (p) => {
      out[p] = await fetchPublicBlobCached(p);
    })
  );
  return out;
}

export function cleanupPublicAssetCache() {
  for (const a of cache.values()) {
    try { URL.revokeObjectURL(a.src); } catch {}
  }
  cache.clear();
}
