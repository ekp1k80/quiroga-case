"use client";

import { useEffect, useState } from "react";
import ViewportWrapper from "@/components/ViewportWrapper";
import AudioPlayer from "@/components/AudioPlayer";
import type { AudioVizConfig } from "@/data/packs";

type Scene =
  | "start"
  | "mainAudio";

const viz: AudioVizConfig = {
  gain: 1.6,
  gate: 0.1,
  gateSoft: 0.11,
  minBinFrac: 0.08,
};

type Props = {
  onDone: () => void;

  audio: { src: string; blob: Blob } | undefined;
};

export default function RecapitulacionScene({ onDone, audio }: Props) {
  const [scene, setScene] = useState<Scene>("mainAudio");

  // useEffect(() => {
  //   const debugMode = process.env.NEXT_PUBLIC_SKIP_VIDEO_DEV === '1'
  //   console.log(process.env.NEXT_PUBLIC_SKIP_VIDEO_DEV)
  //   if(debugMode){
  //     setTimeout(() => { onDone() }, 1000)
  //   }
  // }, [])

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {scene === "mainAudio" && (
        <ViewportWrapper fixedTime="13:10" showStatusBar>
          <AudioPlayer
            src={audio?.src as string}
            blob={audio?.blob as Blob}
            title={" "}
            viz={viz}
            showControls={false}
            autoPlay
            barCount={50}
            onEnded={onDone}
            audioKey="recapitulacion_maria"
          />
        </ViewportWrapper>
      )}
    </div>
  );
}
