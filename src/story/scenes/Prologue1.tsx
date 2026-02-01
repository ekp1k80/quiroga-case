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

export default function PrologueScene({ onDone, audio }: Props) {
  const [scene, setScene] = useState<Scene>("mainAudio");

  // useEffect(() => {
  //   setTimeout(() => { onDone() }, 3000)
  // }, [])

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {scene === "mainAudio" && (
        <ViewportWrapper fixedTime="15:30" showStatusBar>
          <AudioPlayer
            src={audio?.src as string}
            blob={audio?.blob as Blob}
            title={" "}
            viz={viz}
            showControls={false}
            autoPlay
            barCount={50}
            onEnded={onDone}
            audioKey="prologo_1"
          />
        </ViewportWrapper>
      )}
    </div>
  );
}
