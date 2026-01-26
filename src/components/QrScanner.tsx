// src/components/QrScanner.tsx
"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import styled from "styled-components";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onCode: (code: string) => void | Promise<void>;
  onClose?: () => void;
  stopOnSuccess?: boolean;
  cooldownMs?: number;
  devSimulate?: boolean;

  /**
   * Si true: para esta sesión, un mismo QR solo dispara 1 vez (aunque vuelvas a apuntarlo).
   * Default false (solo dedupe por cooldown + lastCode).
   */
  oncePerCode?: boolean;
};

export default function QrScanner({
  onCode,
  onClose,
  stopOnSuccess = true,
  cooldownMs = 900,
  devSimulate = true,
  oncePerCode = false,
}: Props) {
  const reactId = useId();
  const readerId = `qr-reader-${reactId}`;

  const qrRef = useRef<Html5Qrcode | null>(null);

  const [status, setStatus] = useState<"starting" | "scanning" | "processing" | "done" | "error">(
    "starting"
  );

  const isDev = process.env.NODE_ENV !== "production";
  const [debugCode, setDebugCode] = useState("");

  // ✅ refs para evitar closures viejas
  const cooldownUntilRef = useRef<number>(0);
  const lastCodeRef = useRef<string | null>(null);
  const processingRef = useRef<boolean>(false);
  const seenRef = useRef<Set<string>>(new Set());

  const stopCamera = async () => {
    try {
      const inst = qrRef.current;
      if (inst) {
        if ((inst as any).isScanning) await inst.stop();
        inst.clear();
      }
    } catch {
      // noop
    }
  };

  const handleDecoded = async (decodedText: string) => {
    const now = Date.now();
    if (processingRef.current) return;
    if (now < cooldownUntilRef.current) return;

    const code = decodedText?.trim();
    if (!code) return;

    // dedupe inmediato
    if (code === lastCodeRef.current) return;

    // dedupe fuerte opcional (una vez por código por sesión)
    if (oncePerCode && seenRef.current.has(code)) return;

    // lock
    processingRef.current = true;
    cooldownUntilRef.current = now + cooldownMs;
    lastCodeRef.current = code;
    if (oncePerCode) seenRef.current.add(code);

    setStatus("processing");

    try {
      await onCode(code);
      setStatus("done");
      if (stopOnSuccess) {
        await stopCamera();
      } else {
        setStatus("scanning");
      }
    } catch {
      // si falla, permitimos reintentar después del cooldown
      setStatus("scanning");
    } finally {
      // soltamos lock (pero cooldown sigue por tiempo)
      processingRef.current = false;
    }
  };

  useEffect(() => {
    if (isDev && devSimulate) return;

    let cancelled = false;

    async function start() {
      try {
        const inst = new Html5Qrcode(readerId);
        qrRef.current = inst;

        const config = { fps: 12, qrbox: { width: 240, height: 240 } };

        // Back cam preferida
        try {
          await inst.start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
              if (cancelled) return;
              await handleDecoded(decodedText);
            },
            () => {}
          );
          if (!cancelled) setStatus("scanning");
          return;
        } catch {
          // fallback
        }

        const devices = await Html5Qrcode.getCameras();
        if (!devices?.length) throw new Error("No camera");

        const pickBack =
          devices.find((d) => /back|rear|environment/i.test(d.label || "")) ?? devices[devices.length - 1];

        await inst.start(
          pickBack.id,
          config,
          async (decodedText) => {
            if (cancelled) return;
            await handleDecoded(decodedText);
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
      void stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DEV simulate (también con lock)
  const simulate = async () => {
    if (!debugCode) return;
    await handleDecoded(debugCode);
  };

  return (
    <Wrap>
      {onClose && (
        <CloseBtn onClick={onClose} aria-label="Cerrar">
          ✕
        </CloseBtn>
      )}

      <ScannerArea>
        {isDev && devSimulate ? (
          <DevBox>
            <DevInput value={debugCode} onChange={(e) => setDebugCode(e.target.value)} placeholder="QR CODE" />
            <DevButton onClick={simulate}>Simular</DevButton>
          </DevBox>
        ) : (
          <>
            <CameraArea id={readerId} />
            <Overlay>
              {status === "processing" && <Spinner />}
              <Reticle />
            </Overlay>
          </>
        )}
      </ScannerArea>
    </Wrap>
  );
}

/* styles igual que los tuyos */
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
  cursor: pointer;
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
  cursor: pointer;
`;
