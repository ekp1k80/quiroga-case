"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // si ya hay sesión, mandalo al demo
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/session/me", { cache: "no-store" });
      const data = await res.json();
      if (data?.loggedIn) router.replace("/demo");
    })();
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? "No se pudo crear sesión");

      if (name.trim()) {
        await fetch("/api/user", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name }),
        });
      }

      router.replace("/demo");
    } catch (err: any) {
      setStatus("error");
      setError(err?.message ?? "Error");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
      <h2 style={{ marginTop: 0 }}>Login (testing)</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Temporal code</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej: A1B2C3D4"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Nombre (opcional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Federico"
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <button
          type="submit"
          disabled={!code.trim() || status === "loading"}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #000", background: "#000", color: "#fff" }}
        >
          {status === "loading" ? "Entrando..." : "Entrar"}
        </button>

        {error ? <div style={{ color: "crimson" }}>{error}</div> : null}
      </form>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        Esto es solo para testing. Generá un temporal-code con tu endpoint admin.
      </div>
    </div>
  );
}
