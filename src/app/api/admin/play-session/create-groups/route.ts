// src/app/api/admin/play-session/create-groups/route.ts
import { NextResponse } from "next/server";
import { assertLocalAdmin } from "@/lib/adminGuard";
import { adminCreateGroups } from "@/lib/rtdbPlaySession";

export async function POST(req: Request) {
  try {
    await assertLocalAdmin();

    const body = await req.json().catch(() => null);

    const playSessionId = typeof body?.playSessionId === "string" ? body.playSessionId.trim() : "";
    const groupSize = typeof body?.groupSize === "number" ? body.groupSize : Number(body?.groupSize);
    const fixedByUserId = (body?.fixedByUserId ?? null) as Record<string, number> | null;

    if (!playSessionId) {
      return NextResponse.json({ ok: false, error: "playSessionId requerido" }, { status: 400 });
    }

    await adminCreateGroups({
      playSessionId,
      groupSize,
      fixedByUserId: fixedByUserId ?? undefined,
      countdownMs: 3 * 60 * 1000,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message ?? "Error";
    const status = msg.toLowerCase().includes("forbidden") ? 403 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
