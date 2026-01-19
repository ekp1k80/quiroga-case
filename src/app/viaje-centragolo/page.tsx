"use client";

import { useRef, useState } from "react";
import styled from "styled-components";
import { useSoundUnlock } from "@/hooks/useSoundUnlock";
import { preloadBufferSound } from "@/components/playBufferSound";
import AndroidLocked from "@/components/AndroidLocked";
import ViewportWrapper from "@/components/ViewportWrapper";
import AudioPlayer from "@/components/AudioPlayer";
import { usePublicAudio } from "@/hooks/usePublicAudio";
import { AudioVizConfig } from "@/data/packs";
import { useFullscreen } from "@/hooks/useFullscreen";
import CarTravel from "@/components/CarTravelSprite";
import PulsingText from "@/components/PulsingText";

type Scene = "start" | "viaje" | "viaje-audio" | "audio-only" | "idle1" | "idle2" | "mainAudio" | "done";

const viz = {
	gain: 1.6,
	gate: 0.1,
	gateSoft: 0.11,
	minBinFrac: 0.08
}

export default function PhoneScenePage() {
  const [scene, setScene] = useState<Scene>("start");
  const { src, blob, } = usePublicAudio("ViajeCentragolo.mp3");
  const { src: srcHospitalMain, blob: blobHospitalMain } = usePublicAudio("hospital_main.mp3");
	const { enter } = useFullscreen();
  const { unlockNow, audioContextRef } = useSoundUnlock();


  const mainAudio = "ViajeCentragolo.mp3";

  const handleStart = async () => {
		// await enter()
    const ok = await unlockNow();
    // Preload notificación (WebAudio) para que salga instant
    if (ok && audioContextRef.current) {
      try {
        await preloadBufferSound(audioContextRef.current, mainAudio);
      } catch {}
    }
    // No pre-cargamos el ringtone con WebAudio porque lo reproducimos con <audio loop>,
    // pero podrías hacer un fetch “calentón” si querés.
    setScene("viaje");
  };

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
			
			{(scene === "viaje" || scene ===  "viaje-audio" || scene === "audio-only") && (
        <ViewportWrapper
					fixedTime="09:08"
				>
          <>
            
            {
              scene !== "audio-only" && (
                <>
                  <PulsingText
                    text="Viajando al Centrólogo"
                    sizePx={26}
                    pulseMs={2600}
                    minOpacity={0.6}
                  />
                  <CarTravel
                    cruiseSrc="/sprites/car/car-viajando.png"
                    accelFrames={[
                      "/sprites/car/car-lose-hat1.png",
                      "/sprites/car/car-lose-hat2.png",
                    ]}
                    accelAfterMs={18000}
                    cruiseLoopMs={20200}
                    accelExitMs={5000}
                    onStart={() => { setScene("viaje-audio"); }}
                    onFinished={() => { setScene("audio-only"); }}
                    startXVw={-35}
                    endXVw={120}
                    yVh={2}
                    widthPx={280}
                  />
                </>
              )
            }
            
            {(scene ===  "viaje-audio" || scene === "audio-only") && (
            
              <AudioPlayer
                src={src as string}
                blob={blob as Blob}
                title={" "}
                viz={viz as AudioVizConfig}
                showControls={false}
                autoPlay
                barCount={50}
                onEnded={() => { setScene("idle1"); }}
              />
            )}
          </>

      </ViewportWrapper>
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
          fixedTime="09:30"
          timerEnd={4000}
          onEnd={() => { setScene("mainAudio"); }}
        />
      )}
      
      {(scene === "mainAudio") && (
        <ViewportWrapper
					fixedTime="09:30"
          showStatusBar
				>
          <AudioPlayer
            src={srcHospitalMain as string}
            blob={blobHospitalMain as Blob}
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
