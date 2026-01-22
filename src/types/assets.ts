export type Asset = { src: string; blob: Blob };

export type AssetRef =
  | { kind: "public"; path: string }                 // "/ViajeCentragolo.mp3"
  | { kind: "pack"; packId: string; fileId: string } // ("eduardo-house", "audio-1")
;
