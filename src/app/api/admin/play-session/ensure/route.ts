// src/app/api/admin/play-session/ensure/route.ts
import { NextResponse } from "next/server";
import { assertLocalAdmin } from "@/lib/adminGuard";
import { ensureRtdbPlaySession } from "@/lib/rtdbPlaySession";

export async function POST(req: Request) {
  try {
    await assertLocalAdmin();

    const body = await req.json().catch(() => null);
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!code) {
      return NextResponse.json({ ok: false, error: "code requerido" }, { status: 400 });
    }

    const { playSessionId } = await ensureRtdbPlaySession(code);
    return NextResponse.json({ ok: true, playSessionId });
  } catch (e: any) {
    const msg = e?.message ?? "Error";
    const status = msg.toLowerCase().includes("forbidden") ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
