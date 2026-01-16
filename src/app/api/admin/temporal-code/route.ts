import { NextResponse } from "next/server";
import crypto from "crypto";
import { createTemporalCode } from "@/lib/firestoreModels";

function isAdmin(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const h = req.headers.get("x-admin-secret");
  return h === secret;
}

function makeCode(len = 8) {
  // 8 chars hex = 4 bytes; si querés más, subí bytes
  return crypto.randomBytes(Math.ceil(len / 2)).toString("hex").slice(0, len).toUpperCase();
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const hardValid = !!body?.hardValid;

  const code = makeCode(8);
  await createTemporalCode(code, hardValid);

  return NextResponse.json({ ok: true, code, hardValid });
}
