// src/app/debug/admin/page.tsx
"use client";

import React, { useState } from "react";

export default function DebugAdminPage() {
  const [playSessionId, setPlaySessionId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/play-session/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playSessionId }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) throw new Error(j?.error ?? "No se pudo iniciar");
      setMsg("OK: sesión iniciada");
    } catch (e: any) {
      setMsg(e?.message ?? "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 18, maxWidth: 520 }}>
      <h2>Admin (local)</h2>
      <p style={{ opacity: 0.75 }}>Start de playSession (solo localhost/dev).</p>

      <input
        value={playSessionId}
        onChange={(e) => setPlaySessionId(e.target.value)}
        placeholder="ps_..."
        style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
      />

      <button
        onClick={start}
        disabled={!playSessionId.trim() || busy}
        style={{ marginTop: 10, width: "100%", padding: 10, borderRadius: 10 }}
      >
        {busy ? "Iniciando…" : "PLAY / START"}
      </button>

      {msg ? <div style={{ marginTop: 12 }}>{msg}</div> : null}
    </div>
  );
}
