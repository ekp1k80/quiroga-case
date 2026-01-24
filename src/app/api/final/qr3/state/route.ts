import { NextResponse } from "next/server";
import { ensurePlaySession, getFinalPlaySessionState, lockAndCreateGroupsIfReady } from "@/lib/firestoreModels";

export async function GET() {
  await ensurePlaySession("qr3");

  // ✅ auto lock + groups cuando hay >=3 (sin pausa)
  await lockAndCreateGroupsIfReady({ storyNode: "qr3" });

  const state = await getFinalPlaySessionState("qr3");
  if (!state) return NextResponse.json({ ok: false, error: "Session missing" }, { status: 404 });

  return NextResponse.json({ ok: true, state });
}
