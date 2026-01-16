"use client";

import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import AndroidLockScreen from "@/components/AndroidLockscreenSim";
import AndroidIncomingCall from "@/components/AndroidIncomingCall";
import { useSoundUnlock } from "@/hooks/useSoundUnlock";
import { preloadBufferSound } from "@/components/playBufferSound";
import AndroidInCall from "@/components/AndroidInCall";
import PlayAudio from "@/components/PlayAudio";
import AndroidLocked from "@/components/AndroidLocked";
import ViewportWrapper from "@/components/ViewportWrapper";
import AudioPlayer from "@/components/AudioPlayer";
import { usePublicAudio } from "@/hooks/usePublicAudio";
import { AudioVizConfig } from "@/data/packs";
import { useFullscreen } from "@/hooks/useFullscreen";

type Scene = "start" | "lock" | "religiousSpam" | "idle1"| "idle2" | "call" | "inCall" | "afterCall" | "done";

const viz = {
	gain: 1.6,
	gate: 0.1,
	gateSoft: 0.11,
	minBinFrac: 0.08
}

export default function PhoneScenePage() {
  const [scene, setScene] = useState<Scene>("start");
  const { src, blob, loading, error } = usePublicAudio("AfterLlamadaMamaHector.mp3");

  // Control de tiempos (ajustá a gusto)
  const NOTIF_DELAY_MS = 1800;   // cuando aparece la notificación
  const NOTIF_VISIBLE_MS = 4500; // cuánto dura antes de pasar a llamada
	const { enter } = useFullscreen();
  const { unlockNow, audioContextRef } = useSoundUnlock();

  const timersRef = useRef<number[]>([]);
  const clearAllTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  // assets
  const notifSound = "notification-phone-msg.mp3";
  const ringSound = "incoming-call.mp3";

  const handleStart = async () => {
		await enter()
    const ok = await unlockNow();
    // Preload notificación (WebAudio) para que salga instant
    if (ok && audioContextRef.current) {
      try {
        await preloadBufferSound(audioContextRef.current, notifSound);
      } catch {}
    }
    // No pre-cargamos el ringtone con WebAudio porque lo reproducimos con <audio loop>,
    // pero podrías hacer un fetch “calentón” si querés.
    setScene("lock");
  };

  // Secuencia lock -> notif -> call
  useEffect(() => {
    clearAllTimers();
    if (scene !== "lock") return;

    // En lock, programamos:
    // - disparar notificación a los NOTIF_DELAY_MS
    // - cambiar a llamada cuando termine (delay + visible)
    const t1 = window.setTimeout(() => {
      // Le decimos al lock que muestre la notificación
      window.dispatchEvent(new CustomEvent("PHONE_SHOW_NOTIF"));
    }, NOTIF_DELAY_MS);

    const t2 = window.setTimeout(() => {
      setScene("religiousSpam");
    }, NOTIF_DELAY_MS + NOTIF_VISIBLE_MS); // +350 para dejar terminar slide-out

    timersRef.current.push(t1, t2);

    return () => clearAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  return (
    <Root>
      {scene === "start" && (
        <StartOverlay onClick={handleStart}>
          <StartCard>
            <StartTitle>Tap para desbloquear</StartTitle>
            <StartHint>(toca la pantalla)</StartHint>
          </StartCard>
        </StartOverlay>
      )}

      {(scene === "lock" || scene === "religiousSpam") && (
        <AndroidLockScreen
          fixedTime={"03:12"}
          notificationText="Salmos 40:12"
					notificationTitle="+54 9 11 2535-9898"
					notificationApp="WhatsApp"
          soundSrc={notifSound}
          visibleForMs={20000}
          // cuando termine la notificación, no cambiamos acá porque lo controla el timer,
          // pero si preferís hacerlo por callback, también se puede:
          // onHidden={() => setScene("call")}
        />
      )}
			
			{(scene === "religiousSpam") && (
        <PlayAudio
         	src="spamReligioso.mp3"
					timerEnd={23500}
					onEnd={() => { setScene("idle1"); }}
        />
      )}
			
			{(scene === "idle1") && (
        <AndroidLocked
					black
					fixedTime=""
					timerEnd={2000}
					onEnd={() => { setScene("idle2"); }}
        />
      )}
			
			{(scene === "idle2") && (
        <AndroidLocked
					fixedTime="08:57"
					timerEnd={6000}
					onEnd={() => { setScene("call"); }}
        />
      )}

      {scene === "call" && (
        <AndroidIncomingCall
          fixedTime={"08:57"}
          callerName="Mama Hector"
          callerSubtitle="Llamada entrante"
          ringSrc={ringSound}
          autoDeclineMs={25000}
          onAnswer={() => {
            // acá podrías pasar a "inCall" o a otra escena
            setScene("inCall");
          }}
          onDecline={() => {
            // setScene("done");
          }}
        />
      )}

			{scene === "inCall" && (
				<AndroidInCall
					calleeName="Mamá de Héctor"
					fixedTime="08:57"
					callAudioSrc="LlamadaMamaHector.mp3"
					endAudioSrc="FinLlamadaMamaHector.mp3"
					onCallEnded={(reason) => {
						// reason: "audio-ended" | "user-hangup"
						// podés guardar analytics del jugador si querés
					}}
					onEndAudioFinished={() => {
						setScene("afterCall"); // o lo que siga
					}}
				/>
			)}
			
			{scene === "afterCall" && (
				<ViewportWrapper
					fixedTime="08:57"
				>
					<AudioPlayer
						src={src as string}
						blob={blob as Blob}
						title={" "}
						viz={viz as AudioVizConfig}
						showControls={false}
						autoPlay
						barCount={50}
						onEnded={() => { setScene("done"); }}
					/>
				</ViewportWrapper>
			)}

      {scene === "done" && (
        <DoneOverlay>
          <DoneText>Fin de la escena (seguí con tu juego acá).</DoneText>
        </DoneOverlay>
      )}
    </Root>
  );
}

/* ===== styles simples del wrapper ===== */

const Root = styled.div`
  height: 100svh;
  width: 100%;
  background: #000;
`;

const StartOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.78);
  z-index: 9999;
  cursor: pointer;
`;

const StartCard = styled.div`
  width: min(340px, 86%);
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
  font-weight: 800;
  color: #fff;
`;

const StartHint = styled.div`
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.65;
  color: #fff;
`;

const DoneOverlay = styled.div`
  height: 100svh;
  display: grid;
  place-items: center;
`;

const DoneText = styled.div`
  color: #fff;
  opacity: 0.85;
  font-size: 14px;
`;
