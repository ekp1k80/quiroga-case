import { NextResponse } from "next/server";
import { getR2SignedUrl } from "@/lib/r2SignedUrl";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json({ ok: false, error: "Missing ?key=" }, { status: 400 });
  }

  const signedUrl = await getR2SignedUrl(key, 60 * 10);

  const r = await fetch(signedUrl);
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: `R2 fetch failed: ${r.status}` }, { status: 502 });
  }

  const contentType = r.headers.get("content-type") ?? "application/octet-stream";
  const arrayBuffer = await r.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // opcional: cache corto para dev
      "Cache-Control": "private, max-age=60",
    },
  });
}
