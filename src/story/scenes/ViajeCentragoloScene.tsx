"use client";

import { useEffect, useState } from "react";
import ViewportWrapper from "@/components/ViewportWrapper";
import AudioPlayer from "@/components/AudioPlayer";
import AndroidLocked from "@/components/AndroidLocked";
import CarTravel from "@/components/CarTravelSprite";
import PulsingText from "@/components/PulsingText";
import { useSoundUnlock } from "@/hooks/useSoundUnlock";
import { preloadBufferSound } from "@/components/playBufferSound";
import { usePublicAudio } from "@/hooks/usePublicAudio";
import type { AudioVizConfig } from "@/data/packs";

type Scene =
  | "start"
  | "viaje"
  | "viaje-audio"
  | "audio-only"
  | "idle1"
  | "idle2"
  | "mainAudio";

const viz: AudioVizConfig = {
  gain: 1.6,
  gate: 0.1,
  gateSoft: 0.11,
  minBinFrac: 0.08,
};

type Props = {
  onDone: () => void;

  viaje: { src: string; blob: Blob } | undefined;
  hospital: { src: string; blob: Blob } | undefined;
};

export default function ViajeCentragoloScene({ onDone, viaje, hospital }: Props) {
  const [scene, setScene] = useState<Scene>("viaje");

  // useEffect(() => {
  //   setTimeout(() => { onDone() }, 3000)
  // }, [])

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {(scene === "viaje" || scene === "viaje-audio" || scene === "audio-only") && (
        <ViewportWrapper fixedTime="09:08">
          <>
            {scene !== "audio-only" && (
              <>
                <PulsingText text="Viajando al Centrólogo" sizePx={26} pulseMs={2600} minOpacity={0.6} />
                <CarTravel
                  cruiseSrc="/sprites/car/car-viajando.png"
                  accelFrames={["/sprites/car/car-lose-hat1.png", "/sprites/car/car-lose-hat2.png"]}
                  accelAfterMs={18000}
                  cruiseLoopMs={20200}
                  accelExitMs={5000}
                  onStart={() => setScene("viaje-audio")}
                  onFinished={() => setScene("audio-only")}
                  startXVw={-35}
                  endXVw={120}
                  yVh={2}
                  widthPx={280}
                />
              </>
            )}

            {(scene === "viaje-audio" || scene === "audio-only") && (
              <AudioPlayer
                src={viaje?.src as string}
                blob={viaje?.blob as Blob}
                title={" "}
                viz={viz}
                showControls={false}
                autoPlay
                barCount={50}
                onEnded={() => setScene("idle1")}
                audioKey="viaje_centragolo_1"
              />
            )}
          </>
        </ViewportWrapper>
      )}

      {scene === "idle1" && <AndroidLocked black fixedTime="" timerEnd={2000} onEnd={() => setScene("idle2")} />}

      {scene === "idle2" && (
        <AndroidLocked fixedTime="09:30" timerEnd={4000} onEnd={() => setScene("mainAudio")} />
      )}

      {scene === "mainAudio" && (
        <ViewportWrapper fixedTime="09:30" showStatusBar>
          <AudioPlayer
            src={hospital?.src as string}
            blob={hospital?.blob as Blob}
            title={" "}
            viz={viz}
            showControls={false}
            autoPlay
            barCount={50}
            onEnded={onDone}
            audioKey="viaje_centragolo_2"
          />
        </ViewportWrapper>
      )}
    </div>
  );
}
