// src/components/QrScanner.tsx
"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import styled from "styled-components";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onCode: (code: string) => void | Promise<void>;
  onClose?: () => void;

  /**
   * Si true, para la cámara después de que onCode resuelve sin tirar error.
   * Default true.
   */
  stopOnSuccess?: boolean;

  /**
   * Cooldown entre lecturas (ms). Default 900.
   */
  cooldownMs?: number;

  /**
   * Para dev: permite simular código (solo en NODE_ENV !== "production").
   */
  devSimulate?: boolean;
};

export default function QrScanner({
  onCode,
  onClose,
  stopOnSuccess = true,
  cooldownMs = 900,
  devSimulate = true,
}: Props) {
  /* ================= SSR-safe ID ================= */
  const reactId = useId();
  const readerId = `qr-reader-${reactId}`;

  const qrRef = useRef<Html5Qrcode | null>(null);

  const [status, setStatus] = useState<"starting" | "scanning" | "processing" | "done" | "error">(
    "starting"
  );

  const [lastCode, setLastCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const isDev = process.env.NODE_ENV !== "production";
  const [debugCode, setDebugCode] = useState("");

  /* ================= Camera ================= */

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

  useEffect(() => {
    // en dev podés usar simulación (si querés igual arrancar cámara en dev, poné devSimulate=false)
    if (isDev && devSimulate) return;

    let cancelled = false;

    async function start() {
      try {
        const inst = new Html5Qrcode(readerId);
        qrRef.current = inst;

        const config = { fps: 12, qrbox: { width: 240, height: 240 } };

        // 1) Intento principal: pedir cámara trasera por facingMode
        try {
          await inst.start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
              if (cancelled || cooldown) return;

              const code = decodedText?.trim();
              if (!code) return;
              if (code === lastCode) return;

              setCooldown(true);
              setTimeout(() => setCooldown(false), cooldownMs);

              setLastCode(code);
              setStatus("processing");

              try {
                await onCode(code);
                if (cancelled) return;

                setStatus("done");
                if (stopOnSuccess) await stopCamera();
                else setStatus("scanning");
              } catch {
                if (cancelled) return;
                setStatus("scanning");
              }
            },
            () => {}
          );

          if (!cancelled) setStatus("scanning");
          return;
        } catch {
          // si falla el facingMode (algunos browsers raros), caemos a enumeración
        }

        // 2) Fallback: elegir “la más trasera” por label (cuando está disponible)
        const devices = await Html5Qrcode.getCameras();
        if (!devices?.length) throw new Error("No camera");

        const pickBack =
          devices.find((d) => /back|rear|environment/i.test(d.label || "")) ??
          devices[devices.length - 1]; // último suele ser trasera en Android

        await inst.start(
          pickBack.id,
          config,
          async (decodedText) => {
            if (cancelled || cooldown) return;

            const code = decodedText?.trim();
            if (!code) return;
            if (code === lastCode) return;

            setCooldown(true);
            setTimeout(() => setCooldown(false), cooldownMs);

            setLastCode(code);
            setStatus("processing");

            try {
              await onCode(code);
              if (cancelled) return;

              setStatus("done");
              if (stopOnSuccess) await stopCamera();
              else setStatus("scanning");
            } catch {
              if (cancelled) return;
              setStatus("scanning");
            }
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

  /* ================= DEV simulate ================= */

  const simulate = async () => {
    if (!debugCode) return;
    console.log("test")
    setStatus("processing");
    try {
      await onCode(debugCode.trim());
      setStatus("done");
    } catch {
      setStatus("scanning");
    }
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
        {isDev && devSimulate ? (
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
              {status === "processing" && <Spinner />}
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
