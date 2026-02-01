"use client";

import { useEffect, useState } from "react";
import ViewportWrapper from "@/components/ViewportWrapper";
import AudioPlayer from "@/components/AudioPlayer";
import type { AudioVizConfig } from "@/data/packs";
import AndroidIncomingCall from "@/components/AndroidIncomingCall";
import AndroidInCall from "@/components/AndroidInCall";
import { styled } from "styled-components";

type Scene = "start" | "call" | "inCall" | "afterCall" | "lastAudio" | "done";

const viz = {
	gain: 1.6,
	gate: 0.1,
	gateSoft: 0.11,
	minBinFrac: 0.08
}

type Props = {
  onDone: () => void;
  audios: {
    llamadaAdiosHector: { src: string; blob: Blob } | undefined;
    afterLlamadaAdiosHector: { src: string; blob: Blob } | undefined;
    adiosHector: { src: string; blob: Blob } | undefined;
    colgarLlamada: string;
    incomingCall: string;
  }
};

export default function LlamadaFinalMamaHectorScene({
  onDone,
  audios: {
    llamadaAdiosHector,
    afterLlamadaAdiosHector,
    adiosHector,
    colgarLlamada,
    incomingCall,
  }
}: Props) {
  const [scene, setScene] = useState<Scene>("call");

  console.log("LlamadaFinalMamaHectorScene", llamadaAdiosHector)

  // useEffect(() => {
  //     setTimeout(() => { onDone() }, 3000)
  //   }, [])

  return (
    <Root>
      {scene === "call" && (
        <AndroidIncomingCall
          fixedTime={"15:12"}
          callerName="Mama Hector"
          callerSubtitle="Llamada entrante"
          ringSrc={incomingCall}
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
					fixedTime="15:12"
					callAudioSrc={llamadaAdiosHector?.src as string}
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
					fixedTime="15:15"
				>
					<AudioPlayer
						src={afterLlamadaAdiosHector?.src as string}
						blob={afterLlamadaAdiosHector?.blob as Blob}
						title={" "}
						viz={viz as AudioVizConfig}
						showControls={false}
						autoPlay
						barCount={50}
            audioKey="after_llamada_adios_hector"
						onEnded={() => {
              setScene("lastAudio");
            }}
					/>
				</ViewportWrapper>
			)}
      
      {scene === "lastAudio" && (
				<ViewportWrapper
					fixedTime="15:40"
				>
					<AudioPlayer
						src={adiosHector?.src as string}
						blob={adiosHector?.blob as Blob}
						title={" "}
						viz={viz as AudioVizConfig}
						showControls={false}
						autoPlay
						barCount={50}
						onEnded={onDone}
            audioKey="adios_hector"
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
