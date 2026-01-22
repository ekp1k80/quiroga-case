// src/app/api/r2-proxy/route.ts
import { NextResponse } from "next/server";

const ALLOWED_HOST_SUFFIXES = [
  // poné acá tus hosts reales de R2 (ej: "<accountid>.r2.cloudflarestorage.com")
  "r2.cloudflarestorage.com",
  "cloudflarestorage.com",
];

function isAllowedSignedUrl(u: URL) {
  if (u.protocol !== "https:") return false;
  return ALLOWED_HOST_SUFFIXES.some((s) => u.hostname === s || u.hostname.endsWith("." + s));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ ok: false, error: "Missing ?url=" }, { status: 400 });
  }

  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid url" }, { status: 400 });
  }

  if (!isAllowedSignedUrl(u)) {
    return NextResponse.json({ ok: false, error: "URL not allowed" }, { status: 400 });
  }

  const r = await fetch(u.toString());
  if (!r.ok) {
    return NextResponse.json({ ok: false, error: `R2 fetch failed: ${r.status}` }, { status: 502 });
  }

  const contentType = r.headers.get("content-type") ?? "application/octet-stream";
  const arrayBuffer = await r.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=60",
    },
  });
}
