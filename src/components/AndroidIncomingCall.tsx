"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { useSoundUnlock } from "@/hooks/useSoundUnlock";

type AndroidIncomingCallProps = {
  callerName: string;
  callerSubtitle?: string; // ej: "Móvil", "WhatsApp", etc.
  avatarEmoji?: string; // simple para demo: "👤"
  fixedTime?: string; // "03:12"

  // Sonido (colocalo en /public/sfx/ringtone.mp3)
  ringSrc?: string;

  // Si querés que se corte sola si no atiende
  autoDeclineMs?: number; // ej 25000, undefined = no

  onAnswer?: () => void;
  onDecline?: (reason: "declined" | "timeout") => void;
};

export default function AndroidIncomingCall({
  callerName,
  callerSubtitle = "Llamada entrante",
  avatarEmoji = "👤",
  fixedTime = "03:12",
  ringSrc = "/sfx/ringtone.mp3",
  autoDeclineMs,
  onAnswer,
  onDecline,
}: AndroidIncomingCallProps) {
  const { unlocked, unlockNow } = useSoundUnlock();

  const [phase, setPhase] = useState<"ringing" | "answered" | "ended">("ringing");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const timeParts = useMemo(() => {
    const [hh, mm] = fixedTime.split(":");
    return { hh: hh ?? "03", mm: mm ?? "12" };
  }, [fixedTime]);

  const stopRingtone = () => {
    if (!audioRef.current) return;
    try {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    } catch {}
  };

  const startRingtone = async () => {
    // Aseguramos unlock (por si lo llamás sin pasar por tu overlay)
    if (!unlocked) {
      await unlockNow();
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(ringSrc);
      audioRef.current.loop = true;
      audioRef.current.preload = "auto";
      // Opcional: volumen
      audioRef.current.volume = 1.0;
    } else {
      audioRef.current.src = ringSrc;
      audioRef.current.loop = true;
    }

    try {
      await audioRef.current.play();
    } catch {
      // Si esto falla, todavía no hubo gesto válido.
      // En tu juego, debería estar ok si ya tocó "Tap para continuar".
    }
  };

  const answer = () => {
    if (phase !== "ringing") return;
    stopRingtone();
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPhase("answered");
    onAnswer?.();
  };

  const decline = (reason: "declined" | "timeout" = "declined") => {
    if (phase !== "ringing") return;
    stopRingtone();
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setPhase("ended");
    onDecline?.(reason);
  };

  useEffect(() => {
    // Arranca el ringtone al montar la pantalla
    void startRingtone();

    if (autoDeclineMs && autoDeclineMs > 0) {
      timeoutRef.current = window.setTimeout(() => {
        decline("timeout");
      }, autoDeclineMs);
    }

    return () => {
      stopRingtone();
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringSrc]);

  return (
    <Viewport>
      <PhoneFrame>
        <StatusBar>
          <TimeSmall>
            {timeParts.hh}:{timeParts.mm}
          </TimeSmall>
          <Icons>
            <span>📶</span>
            <span>📡</span>
            <span>🔋</span>
          </Icons>
        </StatusBar>

        <CallScreen>
          <TopInfo>
            <CallerAvatar aria-hidden>{avatarEmoji}</CallerAvatar>
            <CallerName>{callerName}</CallerName>
            <CallerSubtitle>{phase === "answered" ? "En llamada…" : callerSubtitle}</CallerSubtitle>
          </TopInfo>

          {phase === "ringing" && (
            <RingingHint>
              <DotPulse />
              <span>Sonando…</span>
            </RingingHint>
          )}

          {phase === "answered" && (
            <AnsweredBox>
              <AnsweredText>Conectado</AnsweredText>
              <SmallText>Podés disparar acá tu UI de “en llamada” o pasar a otra escena.</SmallText>
              <HangUpLarge onClick={() => setPhase("ended")}>Colgar</HangUpLarge>
            </AnsweredBox>
          )}

          {phase === "ringing" && (
            <BottomControls>
              <ControlCol>
                <RoundButtonRed onClick={() => decline("declined")} aria-label="Colgar">
                  ⛔
                </RoundButtonRed>
                <ControlLabel>Colgar</ControlLabel>
              </ControlCol>

              <ControlCol>
                <RoundButtonGreen onClick={answer} aria-label="Contestar">
                  📞
                </RoundButtonGreen>
                <ControlLabel>Contestar</ControlLabel>
              </ControlCol>
            </BottomControls>
          )}

          {phase === "ended" && (
            <EndedBox>
              <EndedText>Llamada finalizada</EndedText>
            </EndedBox>
          )}
        </CallScreen>

        <GestureBar />
      </PhoneFrame>
    </Viewport>
  );
}

/* ===================== styles ===================== */

const Viewport = styled.div`
  height: 100svh;
  width: 100%;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: stretch;
`;

const PhoneFrame = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  height: 100svh;
  background: #0b0b0b;
  overflow: hidden;
`;

const StatusBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
  z-index: 3;
`;

const TimeSmall = styled.div`
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #fff;
`;

const Icons = styled.div`
  display: flex;
  gap: 8px;
  font-size: 12px;
  opacity: 0.9;
  color: #fff;
`;

const CallScreen = styled.div`
  position: absolute;
  inset: 0;
  padding-top: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #fff;
  background: radial-gradient(1200px 800px at 50% 30%, rgba(255,255,255,0.06), transparent 60%),
              linear-gradient(180deg, #0b0b0b, #000);
`;

const TopInfo = styled.div`
  padding: 46px 20px 0;
  text-align: center;
`;

const CallerAvatar = styled.div`
  width: 92px;
  height: 92px;
  border-radius: 28px;
  margin: 0 auto 14px;
  display: grid;
  place-items: center;
  font-size: 40px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
`;

const CallerName = styled.div`
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
`;

const CallerSubtitle = styled.div`
  margin-top: 10px;
  font-size: 14px;
  opacity: 0.75;
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: .55; }
  60% { transform: scale(1.65); opacity: .15; }
  100% { transform: scale(1.65); opacity: 0; }
`;

const DotPulse = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.9);
  position: relative;
  margin-right: 10px;

  &:after {
    content: "";
    position: absolute;
    inset: -10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.45);
    animation: ${pulse} 1.1s ease-out infinite;
  }
`;

const RingingHint = styled.div`
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0.85;
`;

const BottomControls = styled.div`
  padding: 0 34px 48px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const ControlCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const ControlLabel = styled.div`
  font-size: 12px;
  opacity: 0.75;
`;

const btnLift = css`
  cursor: pointer;
  border: none;
  outline: none;
  width: 76px;
  height: 76px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 26px;
  color: #fff;

  box-shadow: 0 16px 30px rgba(0,0,0,0.55);
  transform: translateY(0);
  transition: transform 120ms ease, filter 120ms ease;

  &:active {
    transform: translateY(2px);
  }
`;

const RoundButtonGreen = styled.button`
  ${btnLift};
  background: rgba(50, 205, 90, 0.95);
`;

const RoundButtonRed = styled.button`
  ${btnLift};
  background: rgba(235, 55, 65, 0.95);
`;

const AnsweredBox = styled.div`
  padding: 0 20px;
  text-align: center;
`;

const AnsweredText = styled.div`
  font-size: 18px;
  font-weight: 700;
`;

const SmallText = styled.div`
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.7;
`;

const HangUpLarge = styled.button`
  margin-top: 18px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.08);
  color: #fff;
  cursor: pointer;
`;

const EndedBox = styled.div`
  padding: 0 20px 140px;
  text-align: center;
`;

const EndedText = styled.div`
  font-size: 16px;
  opacity: 0.85;
`;

const GestureBar = styled.div`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  height: 6px;
  width: 120px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
`;
