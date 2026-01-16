// src/lib/r2SignedUrl.ts
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "./r2";

export async function getR2SignedUrl(key: string, expiresInSeconds = 600) {
  const cmd = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });

  return getSignedUrl(r2, cmd, { expiresIn: expiresInSeconds });
}
