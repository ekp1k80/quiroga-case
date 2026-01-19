"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import styled from "styled-components";
import { Html5Qrcode } from "html5-qrcode";
import { useQrClaim, QrClaimResponse } from "@/hooks/useQrClaim";

type Props = {
  onClaimed?: (res: QrClaimResponse) => void;
  onClose?: () => void;
  stopOnSuccess?: boolean;
};

export default function QrScanner({
  onClaimed,
  onClose,
  stopOnSuccess = true,
}: Props) {
  /* ================= SSR-safe ID ================= */
  const reactId = useId();
  const readerId = `qr-reader-${reactId}`;

  const qrRef = useRef<Html5Qrcode | null>(null);

  const [status, setStatus] = useState<"starting" | "scanning" | "claiming" | "done" | "error">(
    "starting"
  );

  const [lastCode, setLastCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const isDev = process.env.NODE_ENV !== "production";
  const [debugCode, setDebugCode] = useState("");

  const { claim, loading } = useQrClaim({
    onSuccess: (res) => {
      setStatus("done");
      onClaimed?.(res);
      if (stopOnSuccess) stopCamera();
    },
    onError: () => {
      setStatus("scanning");
    },
  });

  /* ================= Camera ================= */

  const stopCamera = async () => {
    try {
      const inst = qrRef.current;
      if (inst) {
        if (inst.isScanning) await inst.stop();
        inst.clear();
      }
    } catch {
      // noop
    }
  };

  useEffect(() => {
    if (isDev) return;

    let cancelled = false;

    async function start() {
      try {
        const inst = new Html5Qrcode(readerId);
        qrRef.current = inst;

        const devices = await Html5Qrcode.getCameras();
        if (!devices?.length) throw new Error("No camera");

        await inst.start(
          devices[0].id,
          { fps: 12, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            if (cancelled || cooldown) return;

            const code = decodedText?.trim();
            if (!code || code === lastCode) return;

            setCooldown(true);
            setTimeout(() => setCooldown(false), 900);

            setLastCode(code);
            setStatus("claiming");
            await claim(code);
          },
          () => {}
        );

        if (!cancelled) setStatus("scanning");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    start();

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= DEV simulate ================= */

  const simulate = async () => {
    if (!debugCode || loading) return;
    setStatus("claiming");
    await claim(debugCode.trim());
  };

  /* ================= Render ================= */

  return (
    <Wrap>
      {onClose && (
        <CloseBtn onClick={onClose} aria-label="Cerrar">
          ✕
        </CloseBtn>
      )}

      <ScannerArea>
        {isDev ? (
          <DevBox>
            <DevInput
              value={debugCode}
              onChange={(e) => setDebugCode(e.target.value)}
              placeholder="QR CODE"
            />
            <DevButton onClick={simulate}>Simular</DevButton>
          </DevBox>
        ) : (
          <>
            <CameraArea id={readerId} />
            <Overlay>
              {status === "claiming" && <Spinner />}
              <Reticle />
            </Overlay>
          </>
        )}
      </ScannerArea>
    </Wrap>
  );
}

/* ================= styles ================= */

const Wrap = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: #fff;
  border-radius: 999px;
  width: 36px;
  height: 36px;
  font-size: 18px;
`;

const ScannerArea = styled.div`
  width: 100%;
  height: 100%;
`;

const CameraArea = styled.div`
  width: 100%;
  height: 100%;

  & video,
  & canvas {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
`;

const Overlay = styled.div`
  pointer-events: none;
  position: absolute;
  inset: 0;
`;

const Reticle = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 240px;
  height: 240px;
  transform: translate(-50%, -50%);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.35);
`;

const Spinner = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 36px;
  height: 36px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
`;

const DevBox = styled.div`
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
`;

const DevInput = styled.input`
  padding: 14px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
`;

const DevButton = styled.button`
  padding: 14px;
  border-radius: 12px;
  border: none;
  font-weight: 800;
  font-size: 16px;
`;
