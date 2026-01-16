"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { useSoundUnlock } from "@/hooks/useSoundUnlock";

type AndroidInCallProps = {
  calleeName: string;
  fixedTime?: string; // "03:12"

  // Audio principal (voz de la madre)
  callAudioSrc: string; // "/sfx/madre_hector.mp3"

  // Audio final al cortar o al terminar el principal (tono / beep / segundo clip)
  endAudioSrc: string; // "/sfx/call_end.mp3"

  // Si querés que el audio principal arranque solo al montar
  autoPlayCallAudio?: boolean;

  // Callbacks
  onCallStarted?: () => void;
  onCallEnded?: (reason: "audio-ended" | "user-hangup") => void;
  onEndAudioFinished?: () => void;
};

export default function AndroidInCall({
  calleeName,
  fixedTime = "03:12",
  callAudioSrc,
  endAudioSrc,
  autoPlayCallAudio = true,
  onCallStarted,
  onCallEnded,
  onEndAudioFinished,
}: AndroidInCallProps) {
  const { unlocked, unlockNow } = useSoundUnlock();

  const [micMuted, setMicMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);

  const [phase, setPhase] = useState<"connecting" | "in-call" | "ending" | "ended">("connecting");
  const [seconds, setSeconds] = useState(0);

  const callAudioRef = useRef<HTMLAudioElement | null>(null);
  const endAudioRef = useRef<HTMLAudioElement | null>(null);

  const timerRef = useRef<number | null>(null);

  const timeParts = useMemo(() => {
    const [hh, mm] = fixedTime.split(":");
    return { hh: hh ?? "03", mm: mm ?? "12" };
  }, [fixedTime]);

  const formatDuration = (s: number) => {
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    const mmStr = String(mm).padStart(2, "0");
    const ssStr = String(ss).padStart(2, "0");
    return `${mmStr}:${ssStr}`;
  };

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = window.setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopAllAudio = () => {
    try {
      if (callAudioRef.current) {
        callAudioRef.current.pause();
        callAudioRef.current.currentTime = 0;
      }
    } catch {}
    try {
      if (endAudioRef.current) {
        endAudioRef.current.pause();
        endAudioRef.current.currentTime = 0;
      }
    } catch {}
  };

  const playEndAudio = async () => {
    if (!endAudioRef.current) return;
    try {
      // speaker: subimos volumen si “altavoz” está on
      endAudioRef.current.volume = speakerOn ? 1.0 : 0.85;
      await endAudioRef.current.play();
    } catch {
      // si el browser bloquea, ya hubo interacción en el juego igual
    }
  };

  const endCall = async (reason: "audio-ended" | "user-hangup") => {
    if (phase === "ending" || phase === "ended") return;

    setPhase("ending");
    clearTimer();

    // cortar voz principal si estaba
    try {
      if (callAudioRef.current) callAudioRef.current.pause();
    } catch {}

    onCallEnded?.(reason);

    // reproducir audio final
    await playEndAudio();
  };

  const startCall = async () => {
    // asegurar unlock por si entran directo acá
    if (!unlocked) await unlockNow();

    // preparar audios
    if (!callAudioRef.current) {
      callAudioRef.current = new Audio(callAudioSrc);
      callAudioRef.current.preload = "auto";
    } else {
      callAudioRef.current.src = callAudioSrc;
    }

    if (!endAudioRef.current) {
      endAudioRef.current = new Audio(endAudioSrc);
      endAudioRef.current.preload = "auto";
    } else {
      endAudioRef.current.src = endAudioSrc;
    }

    // set volumen según speaker
    callAudioRef.current.volume = speakerOn ? 1.0 : 0.85;
    endAudioRef.current.volume = speakerOn ? 1.0 : 0.85;

    // Cuando termina el audio principal => cortar y reproducir endAudio
    callAudioRef.current.onended = () => {
      void endCall("audio-ended");
    };

    // Cuando termina el audio final => fase ended y callback
    endAudioRef.current.onended = () => {
      setPhase("ended");
      onEndAudioFinished?.();
    };

    // “conectando” breve para vibe real
    setPhase("connecting");
    setSeconds(0);

    window.setTimeout(async () => {
      setPhase("in-call");
      startTimer();
      onCallStarted?.();

      if (autoPlayCallAudio && callAudioRef.current) {
        try {
          await callAudioRef.current.play();
        } catch {
          // si falla por policy, en tu flujo ya hubo tap
        }
      }
    }, 600);
  };

  useEffect(() => {
    void startCall();

    return () => {
      clearTimer();
      stopAllAudio();
      if (callAudioRef.current) callAudioRef.current.onended = null;
      if (endAudioRef.current) endAudioRef.current.onended = null;
      callAudioRef.current = null;
      endAudioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callAudioSrc, endAudioSrc]);

  // Al togglear speaker, ajustamos volúmenes actuales
  useEffect(() => {
    try {
      if (callAudioRef.current) callAudioRef.current.volume = speakerOn ? 1.0 : 0.85;
      if (endAudioRef.current) endAudioRef.current.volume = speakerOn ? 1.0 : 0.85;
    } catch {}
  }, [speakerOn]);

  const subtitle = useMemo(() => {
    if (phase === "connecting") return "Conectando…";
    if (phase === "in-call") return formatDuration(seconds);
    if (phase === "ending") return "Finalizando…";
    return "Llamada finalizada";
  }, [phase, seconds]);

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
            <CalleeName>{calleeName}</CalleeName>

            <MetaRow>
              <PersonIcon aria-hidden>👤</PersonIcon>
              <MetaText>{subtitle}</MetaText>
            </MetaRow>
          </TopInfo>

          <Controls>
            <TopGrid>
              <Spacer />

              <ActionButton
                $active={micMuted}
                onClick={() => setMicMuted((v) => !v)}
                aria-label="Micrófono"
                type="button"
              >
                🎙️
                <ActionLabel>Mic</ActionLabel>
              </ActionButton>

              <ActionButton
                $active={speakerOn}
                onClick={() => setSpeakerOn((v) => !v)}
                aria-label="Altavoz"
                type="button"
              >
                🔊
                <ActionLabel>Altavoz</ActionLabel>
              </ActionButton>
              <Spacer />

            </TopGrid>

            <BottomGrid>

              <Spacer />
              <HangupButton
                // onClick={() => void endCall("user-hangup")}
                aria-label="Cortar"
                type="button"
                disabled={phase === "ending" || phase === "ended"}
              >
                📞
              </HangupButton>
              <Spacer />

            </BottomGrid>
          </Controls>

          <FooterHint>
            {phase === "in-call" && <PulseDot />}
            <span>
              {phase === "in-call"
                ? "En llamada"
                : phase === "connecting"
                ? "Estableciendo conexión…"
                : phase === "ending"
                ? "Cerrando llamada…"
                : "Listo"}
            </span>
          </FooterHint>
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
  background: radial-gradient(1000px 700px at 50% 20%, rgba(255,255,255,0.06), transparent 65%),
              linear-gradient(180deg, #0b0b0b, #000);
`;

const TopInfo = styled.div`
  padding: 58px 20px 0;
  text-align: center;
`;

const CalleeName = styled.div`
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.6px;
`;

const MetaRow = styled.div`
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  opacity: 0.85;
`;

const PersonIcon = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 10px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  display: grid;
  place-items: center;
  font-size: 14px;
`;

const MetaText = styled.div`
  font-size: 14px;
  font-variant-numeric: tabular-nums;
`;

const Controls = styled.div`
  padding: 0 26px 60px;
`;

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 14px;
  align-items: center;
  justify-items: center;
`;
const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
  align-items: center;
  justify-items: center;
  margin-top: 4vh;
`;

const Spacer = styled.div`
  width: 1px;
  height: 1px;
`;

const ActionButton = styled.button<{ $active?: boolean }>`
  width: 104px;
  height: 74px;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 22px;
  box-shadow: 0 12px 24px rgba(0,0,0,0.5);
  transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;

  &:active {
    transform: translateY(2px);
  }

  ${({ $active }) =>
    $active &&
    css`
      background: rgba(255, 255, 255, 0.14);
      border-color: rgba(255, 255, 255, 0.22);
    `}
`;

const ActionLabel = styled.div`
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.8;
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
  transition: transform 120ms ease, opacity 120ms ease;

  &:active {
    transform: translateY(2px);
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;

const HangupButton = styled.button`
  ${btnLift};
  background: rgba(235, 55, 65, 0.95);
  transform: rotate(135deg);
`;

const HangupLabel = styled.div`
  grid-column: 2 / 3;
  margin-top: -6px;
  font-size: 12px;
  opacity: 0.75;
  text-align: center;
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: .55; }
  60% { transform: scale(1.7); opacity: .12; }
  100% { transform: scale(1.7); opacity: 0; }
`;

const PulseDot = styled.div`
  width: 9px;
  height: 9px;
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

const FooterHint = styled.div`
  padding: 0 20px 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0px;
  font-size: 13px;
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
