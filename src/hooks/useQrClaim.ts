"use client";

import { useCallback, useState } from "react";

export type QrClaimResponse = {
  ok: boolean;

  message?: string;
  urls?: { type: "image" | "audio" | "page"; url: string; label?: string }[];
  effects?: Record<string, any>;

  levelUp?: { from: number; to: number };

  blocked?: boolean;
  alreadyClaimed?: boolean;

  error?: string;
};

export function useQrClaim(opts?: {
  endpoint?: string; // default /api/qr/claim
  onSuccess?: (res: QrClaimResponse) => void;
  onError?: (res: QrClaimResponse) => void;
}) {
  const endpoint = opts?.endpoint ?? "/api/qr/claim";

  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<QrClaimResponse | null>(null);

  const claim = useCallback(
    async (code: string) => {
      if (!code || loading) return null;
      setLoading(true);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = (await res.json()) as QrClaimResponse;
        setLast(data);

        if (res.ok && data.ok) opts?.onSuccess?.(data);
        else opts?.onError?.(data);

        return data;
      } catch {
        const data: QrClaimResponse = { ok: false, error: "Network error" };
        setLast(data);
        opts?.onError?.(data);
        return data;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, loading, opts]
  );

  return { claim, loading, last };
}
