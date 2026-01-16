import { NextResponse } from "next/server";
import { getR2SignedUrl } from "@/lib/r2SignedUrl";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { ok: false, error: "Missing ?key= (ej: audios/radio-01.mp3)" },
      { status: 400 }
    );
  }

  try {
    const url = await getR2SignedUrl(key, 60 * 10);
    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    console.error("R2 signed url error:", e?.message ?? e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "R2 error" },
      { status: 500 }
    );
  }
}
