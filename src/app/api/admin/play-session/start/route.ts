// src/app/api/admin/play-session/start/route.ts
import { NextResponse } from "next/server";
import { assertLocalAdmin } from "@/lib/adminGuard";
import { adminStartPlaySession } from "@/lib/rtdbPlaySession";

export async function POST(req: Request) {
  try {
    await assertLocalAdmin();

    const body = await req.json().catch(() => null);
    const playSessionId = typeof body?.playSessionId === "string" ? body.playSessionId.trim() : "";

    if (!playSessionId) {
      return NextResponse.json({ ok: false, error: "playSessionId requerido" }, { status: 400 });
    }

    await adminStartPlaySession(playSessionId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "Error";
    const status = msg.toLowerCase().includes("forbidden") ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
