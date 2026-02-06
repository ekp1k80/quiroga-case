"use client";
import React, { useState } from "react";
import QrScanner from "@/components/QrScanner";
import { useQrClaim, QrClaimResponse } from "@/hooks/useQrClaim";

export default function QrClaimScanner({
  onClaimed,
  onClose,
}: {
  onClaimed?: (res: QrClaimResponse) => void;
  onClose?: () => void;
}) {
  const [err, setErr] = useState<string | null>(null);

  const { claim, loading } = useQrClaim({
    onSuccess: (res) => { setErr(null); onClaimed?.(res); },
    onError: (res) => { setErr(res.error ?? "Error"); alert(res.error) },
  });

  return (
    <>
      {/* podés mostrar err/loading arriba */}
      <QrScanner
        onClose={onClose}
        stopOnSuccess={true}
        onCode={async (code) => {
          if (loading) return;
          await claim(code);
        }}
      />
    </>
  );
}
