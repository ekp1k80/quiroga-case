"use client";

import { useEffect, useRef, useState } from "react";
import ViewportWrapper from "@/components/ViewportWrapper";
import AudioPlayer from "@/components/AudioPlayer";
import AndroidLocked from "@/components/AndroidLocked";
import type { AudioVizConfig } from "@/data/packs";
import AndroidLockScreen from "@/components/AndroidLockscreenSim";
import PlayAudio from "@/components/PlayAudio";
import AndroidIncomingCall from "@/components/AndroidIncomingCall";
import AndroidInCall from "@/components/AndroidInCall";
import { styled } from "styled-components";

type Scene = "start" | "lock" | "religiousSpam" | "idle1"| "idle2" | "call" | "inCall" | "afterCall" | "done";

const viz = {
	gain: 1.6,
	gate: 0.1,
	gateSoft: 0.11,
	minBinFrac: 0.08
}

type Props = {
  onDone: () => void;
  audios: {
    afterCallAudio: { src: string; blob: Blob } | undefined;
    colgarLlamada: string;
    incomingCall: string;
    llamadaMamaHector: string;
    notificationPhoneMsg: string;
    spamReligioso: string;
  }
};

export default function LlamadaMamaHectorScene({
  onDone,
  audios: {
    afterCallAudio,
    colgarLlamada,
    incomingCall,
    llamadaMamaHector,
    notificationPhoneMsg,
    spamReligioso
  }
}: Props) {
  const [scene, setScene] = useState<Scene>("afterCall");

   // Control de tiempos (ajustá a gusto)
  const NOTIF_DELAY_MS = 1800;   // cuando aparece la notificación
  const NOTIF_VISIBLE_MS = 4500; // cuánto dura antes de pasar a llamada

  const timersRef = useRef<number[]>([]);
  const clearAllTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
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
      {(scene === "lock" || scene === "religiousSpam") && (
        <AndroidLockScreen
          fixedTime={"03:12"}
          notificationText="Salmos 40:12"
					notificationTitle="+54 9 11 2535-9898"
					notificationApp="WhatsApp"
          soundSrc={notificationPhoneMsg}
          visibleForMs={20000}
          // cuando termine la notificación, no cambiamos acá porque lo controla el timer,
          // pero si preferís hacerlo por callback, también se puede:
          // onHidden={() => setScene("call")}
        />
      )}
			
			{(scene === "religiousSpam") && (
        <PlayAudio
         	src={spamReligioso}
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
          ringSrc={incomingCall}
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
					callAudioSrc={llamadaMamaHector}
					endAudioSrc={colgarLlamada}
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
						src={afterCallAudio.src}
						blob={afterCallAudio.blob}
						title={" "}
						viz={viz as AudioVizConfig}
						showControls={false}
						autoPlay
						barCount={50}
						onEnded={onDone}
					/>
				</ViewportWrapper>
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
