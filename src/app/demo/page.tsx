"use client";

import React, { useMemo, useState } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import { usePackPrefetch } from "@/hooks/usePackPrefetch";
import { AudioVizConfig } from "@/data/packs";

export default function Page() {
  // Prefetch SOLO audios
  const { files, loading, error, isCached, getObjectUrl, getBlob } =
    usePackPrefetch("intro", { prefetch: "audio", concurrency: 3 });

  const audios = useMemo(
    () => files.filter((f) => f.type === "audio"),
    [files]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    const id = selectedId ?? audios[0]?.id ?? null;
    if (!id) return null;
    return audios.find((a) => a.id === id) ?? null;
  }, [selectedId, audios]);

  if (loading) return <div style={{ padding: 16 }}>Cargando audios…</div>;
  if (error) return <div style={{ padding: 16 }}>Error: {error}</div>;
  if (!selected) return <div style={{ padding: 16 }}>No hay audios.</div>;

  const src = getObjectUrl(selected.id);
  const blob = getBlob(selected.id);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: 16,
        padding: 16,
      }}
    >
      {/* Lista de audios */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Audios</div>

        <div style={{ display: "grid", gap: 8 }}>
          {audios.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              style={{
                textAlign: "left",
                padding: 10,
                borderRadius: 10,
                border: "1px solid #eee",
                background: a.id === selected.id ? "#f4f8ff" : "white",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600 }}>{a.title}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {isCached(a.id) ? "Listo" : "Descargando…"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Player */}
      <div>
        {!src || !blob ? (
          <div>Preparando audio…</div>
        ) : selected.type === "audio" && (
          <AudioPlayer
            src={src}
            blob={blob}
            title={selected.title}
						viz={selected.viz as AudioVizConfig}
          />
        )}
      </div>
    </div>
  );
}
