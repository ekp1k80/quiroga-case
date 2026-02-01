"use client";

import { useEffect, useState } from "react";
import ViewportWrapper from "@/components/ViewportWrapper";
import AudioPlayer from "@/components/AudioPlayer";
import type { AudioVizConfig } from "@/data/packs";
import { styled } from "styled-components";

type Scene = "start" | "audio1" | "audio2" | "done";

const viz = {
	gain: 1.6,
	gate: 0.1,
	gateSoft: 0.11,
	minBinFrac: 0.08
}

type Props = {
  onDone: () => void;
  audios: {
    audio1: { src: string; blob: Blob } | undefined;
    audio2: { src: string; blob: Blob } | undefined;
  }
};

export default function EduardoLeakedScene({
  onDone,
  audios: {
    audio1,
    audio2,
  }
}: Props) {
  const [scene, setScene] = useState<Scene>("audio1");

  // useEffect(() => {
  //     setTimeout(() => { onDone() }, 3000)
  //   }, [])

  return (
    <Root>
			
			{scene === "audio1" && (
				<ViewportWrapper
					fixedTime="13:35"
				>
					<AudioPlayer
						src={audio1?.src as string}
						blob={audio1?.blob as Blob}
						title={" "}
						viz={viz as AudioVizConfig}
						showControls={false}
						autoPlay
						barCount={50}
						audioKey="eduardo_leaked_1"
						onEnded={() => {
							setScene("audio2");
						}}
					/>
				</ViewportWrapper>
			)}
      {scene === "audio2" && (
				<ViewportWrapper
					fixedTime="13:38"
				>
					<AudioPlayer
						src={audio2?.src as string}
						blob={audio2?.blob as Blob}
						title={" "}
						viz={viz as AudioVizConfig}
						showControls={false}
						autoPlay
						barCount={50}
            			onEnded={onDone}
						audioKey="audio_leaked_2"
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