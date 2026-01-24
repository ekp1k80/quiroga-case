import { NextResponse } from "next/server";
import { joinPlaySessionDebug } from "@/lib/firestoreModels";

type Body = {
  userId: string;
  name: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const userId = String(body?.userId ?? "").trim();
  const name = String(body?.name ?? "").trim();

  if (!userId) return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });
  if (!name) return NextResponse.json({ ok: false, error: "Missing name" }, { status: 400 });

  try {
    await joinPlaySessionDebug({ storyNode: "qr3", userId, name });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Join failed" }, { status: 400 });
  }
}
