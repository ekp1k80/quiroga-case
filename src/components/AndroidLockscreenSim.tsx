"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { playBufferSound } from "./playBufferSound";
import { useSoundUnlock } from "@/hooks/useSoundUnlock";

type AndroidScreenProps = {
  notificationText: string;
  notificationTitle?: string;
  notificationApp?: string;

  fixedTime?: string; // "03:12"
  mode?: "auto" | "manual";
  autoDelayMs?: number;

  soundSrc?: string; // "/sfx/notif.mp3"
  visibleForMs?: number; // 0 => no auto-hide

  onShown?: () => void;
  onHidden?: () => void;
};

export default function AndroidScreen({
  notificationText,
  notificationTitle = "Mensaje nuevo",
  notificationApp = "Mensajes",
  fixedTime = "03:12",
  mode = "auto",
  autoDelayMs = 1200,
  soundSrc = "/sfx/notif.mp3",
  visibleForMs = 6000,
  onShown,
  onHidden,
}: AndroidScreenProps) {
  const [notifMounted, setNotifMounted] = useState(false);
	const [notifVisible, setNotifVisible] = useState(false);
	const exitTimerRef = useRef<number | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const ENTER_MS = 280;
	const EXIT_MS = 280;

  const [started, setStarted] = useState(true); // <- nuevo
  const hideTimerRef = useRef<number | null>(null);

  const { unlocked, audioContextRef, unlockNow } = useSoundUnlock();

  const timeParts = useMemo(() => {
    const [hh, mm] = fixedTime.split(":");
    return { hh: hh ?? "03", mm: mm ?? "12" };
  }, [fixedTime]);

  const clearTimers = () => {
		if (hideTimerRef.current != null) window.clearTimeout(hideTimerRef.current);
		if (exitTimerRef.current != null) window.clearTimeout(exitTimerRef.current);
		hideTimerRef.current = null;
		exitTimerRef.current = null;
	};

	const hideNotification = () => {
		// dispara animación de salida
		setNotifVisible(false);

		// desmonta cuando termina
		exitTimerRef.current = window.setTimeout(() => {
			setNotifMounted(false);
			onHidden?.();
		}, EXIT_MS);
	};

const startRingtone = async () => {
    // Aseguramos unlock (por si lo llamás sin pasar por tu overlay)
    if (!unlocked) {
      await unlockNow();
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(soundSrc);
      audioRef.current.loop = false;
      audioRef.current.preload = "auto";
      // Opcional: volumen
      audioRef.current.volume = 1.0;
    } else {
      audioRef.current.src = soundSrc;
      audioRef.current.loop = false;
    }

    try {
      await audioRef.current.play();
    } catch {
      // Si esto falla, todavía no hubo gesto válido.
      // En tu juego, debería estar ok si ya tocó "Tap para continuar".
    }
  };

  const showNotification = async () => {
		clearTimers();

		// 1) montar (no se ve aún)
		setNotifMounted(true);

		// 2) próximo tick => activar animación de entrada
		requestAnimationFrame(() => setNotifVisible(true));

		onShown?.();

		await startRingtone();

		if (visibleForMs > 0) {
			hideTimerRef.current = window.setTimeout(() => {
				hideNotification();
			}, visibleForMs);
		}
	};

  useEffect(() => {
    if (!started) return;
    if (mode !== "auto") return;

    const t = window.setTimeout(() => void showNotification(), autoDelayMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, mode, autoDelayMs]);

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

        <LockContent>
          <BigTime>
            {timeParts.hh}:{timeParts.mm}
          </BigTime>
          <DayText>Jueves</DayText>
        </LockContent>

        {notifMounted && (
					<NotifWrap $visible={notifVisible} onAnimationEnd={(e) => {
						// Por si querés robustez extra: cuando termina exit, desmontar acá también
						// (opcional, yo ya lo manejo con timer)
					}}>
						<NotifCard $shake={notifVisible}>
							<NotifHeader>
								<AppName>{notificationApp}</AppName>
								<TimeTiny>
									{timeParts.hh}:{timeParts.mm}
								</TimeTiny>
							</NotifHeader>

							<NotifBody>
								<Avatar>💬</Avatar>
								<TextCol>
									<Title>{notificationTitle}</Title>
									<Message>{notificationText}</Message>
									<NotifActions>
										<MiniButton onClick={() => setNotifVisible(false)}>Cerrar</MiniButton>
									</NotifActions>
								</TextCol>
							</NotifBody>
						</NotifCard>
					</NotifWrap>
				)}

        <GestureBar />
      </PhoneFrame>
    </Viewport>
  );
}

/* ===================== styled-components ===================== */

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
`;

const LockContent = styled.div`
  position: absolute;
  inset: 0;
  padding-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const BigTime = styled.div`
  font-size: 64px;
  font-weight: 700;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  color: #fff;
`;

const DayText = styled.div`
  margin-top: 8px;
  font-size: 14px;
  opacity: 0.75;
  color: #fff;
`;

const slideIn = keyframes`
  from { transform: translateY(-140%); }
  to   { transform: translateY(0%); }
`;

const slideOut = keyframes`
  from { transform: translateY(0%); }
  to   { transform: translateY(-140%); }
`;

const shake = keyframes`
  0% { transform: translateX(0); }
  20% { transform: translateX(-2px); }
  40% { transform: translateX(2px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
  100% { transform: translateX(0); }
`;

const NotifWrap = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  padding: 10px 10px 0;
  z-index: 4;

  animation: ${({ $visible }) => ($visible ? slideIn : slideOut)} 280ms ease-out forwards;
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
`;

const NotifCard = styled.div<{ $shake?: boolean }>`
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(20, 20, 20, 0.92);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.55);
  padding: 12px 12px 10px;

  ${({ $shake }) =>
    $shake &&
    css`
      animation: ${shake} 220ms ease-in-out;
    `}
`;

const NotifHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const AppName = styled.div`
  font-size: 12px;
  opacity: 0.8;
  color: #fff;
`;

const TimeTiny = styled.div`
  font-size: 12px;
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
  color: #fff;
`;

const NotifBody = styled.div`
  margin-top: 8px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

const Avatar = styled.div`
  height: 40px;
  width: 40px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  display: grid;
  place-items: center;
  font-size: 18px;
`;

const TextCol = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 14px;
  color: #fff;
`;

const Message = styled.div`
  margin-top: 4px;
  font-size: 14px;
  line-height: 1.25;
  opacity: 0.92;
  color: #fff;
`;

const NotifActions = styled.div`
  margin-top: 10px;
  display: flex;
  gap: 8px;
`;

const MiniButton = styled.button`
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 10px;
  padding: 7px 10px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.11);
  }
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

/* ===== Start overlay ===== */

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const StartOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 10;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.72);
  animation: ${fadeIn} 180ms ease-out;
`;

const StartCard = styled.div`
  width: min(320px, 86%);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(20, 20, 20, 0.92);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6);
  padding: 18px 16px;
  text-align: center;
`;

const StartTitle = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #fff;
`;

const StartSub = styled.div`
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.85;
  color: #fff;
  min-height: 18px;
`;

const StartHint = styled.div`
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.65;
  color: #fff;
`;
