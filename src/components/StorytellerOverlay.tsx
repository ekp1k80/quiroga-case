// src/components/StorytellerOverlay.tsx
"use client";

import React, { useMemo } from "react";
import styled from "styled-components";

import HectorElHorrorScene from "@/story/scenes/HectorElHorror";
import HectorLaCamaraScene from "@/story/scenes/HectorLaCamara";
import HectorLaCasaScene from "@/story/scenes/HectorLaCasa";
import HectorSofiaScene from "@/story/scenes/HectorSofia";
import LlamadaMamaHectorScene from "@/story/scenes/LlamadaMamaHector";
import PrologueRestauranteScene from "@/story/scenes/PrologoRestaurante";
import PrologueScene from "@/story/scenes/Prologue1";
import ViajeCentragoloScene from "@/story/scenes/ViajeCentragoloScene";
import WiFiRouterHackScene from "./WiFiRouterHackScene";
import TheRadioAudioScene from "@/story/scenes/TheRadioAudio";
import CasaMariaCordobaScene from "@/story/scenes/CasaMariaCordoba";
import RecapitulacionScene from "@/story/scenes/RecapitulacionMaria";
import LlegadaCasaBeatrizScene from "@/story/scenes/LlegadaCasaBeatriz";
import BeatrizAbreLaPuertaScene from "@/story/scenes/BeatrizAbreLaPuerta";
import MartinEntraHabitacionEduardoScene from "@/story/scenes/MartinEntraHabitacionEduardo";
import LlamadaFinalMamaHectorScene from "@/story/scenes/LlamadaFinalMamaHector";
import SocialStormScene from "./SocialStorm/SocialStormScene";
import EduardoLeakedScene from "@/story/scenes/EduardoLeaked";

type Asset = { src: string; blob: Blob };
type AssetMap = Record<string, Asset | undefined>;

type SceneProps = {
  onDone: () => void;
  assets: AssetMap;
};

type SceneComponent = (props: SceneProps) => React.ReactNode;

function findFirstAudioAsset(assets: AssetMap): Asset | undefined {
  for (const a of Object.values(assets)) {
    if (!a) continue;
    const t = a.blob?.type ?? "";
    if (t.startsWith("audio/")) return a;
  }
  return undefined;
}

const SCENES: Record<string, SceneComponent> = {
  "prologue-1": ({ onDone, assets }) => (
    <PrologueScene onDone={onDone} audio={assets["/media/prologue/prologo_del_prologo.mp3"]} />
  ),

  "res-prologue": ({ onDone, assets }) => (
    <PrologueRestauranteScene onDone={onDone} audio={assets["/media/prologue/prologo_restaurante.mp3"]} />
  ),

  "hector-mom-call": ({ onDone, assets }) => (
    <LlamadaMamaHectorScene
      onDone={onDone}
      audios={{
        afterCallAudio: assets["/media/act1/llamada/after_llamada_mama_hector.mp3"],
        colgarLlamada: assets["/media/act1/llamada/colgar_llamada.mp3"]?.src as string,
        incomingCall: assets["/media/act1/llamada/incoming_call.mp3"]?.src as string,
        llamadaMamaHector: assets["/media/act1/llamada/llamada_mama_hector.mp3"]?.src as string,
        notificationPhoneMsg: assets["/media/act1/llamada/notification_phone_msg.mp3"]?.src as string,
        spamReligioso: assets["/media/act1/llamada/spam_religioso.mp3"]?.src as string,
      }}
    />
  ),

  "viaje-centragolo-hospital": ({ onDone, assets }) => (
    <ViajeCentragoloScene
      onDone={onDone}
      viaje={assets["/media/act1/viaje_centragolo.mp3"]}
      hospital={assets["/media/act1/hospital.mp3"]}
    />
  ),

  "hector-house": ({ onDone, assets }) => <HectorLaCasaScene onDone={onDone} audio={assets["/media/act2/la_casa.mp3"]} />,

  "the-horror": ({ onDone, assets }) => <HectorElHorrorScene onDone={onDone} audio={assets["/media/act2/el_horror.mp3"]} />,

  "act2-sofia": ({ onDone, assets }) => <HectorSofiaScene onDone={onDone} audio={assets["/media/act2/sofia.mp3"]} />,

  "act2-the-camera-game": ({ onDone }) => <WiFiRouterHackScene onAfter={onDone} fixedTime="10:40" />,

  "act2-the-camera-audio": ({ onDone, assets }) => (
    <HectorLaCamaraScene onDone={onDone} audio={assets["/media/act2/la_camara.mp3"]} />
  ),

  // ✅ Este node trae assets por PACK (assetRequirements: packs: ["the-radio-audio"])
  // Por lo tanto NO podemos usar "/media/..." acá.
  "the-radio-audio": ({ onDone, assets }) => {
    const audio = findFirstAudioAsset(assets);

    return <TheRadioAudioScene onDone={onDone} audio={audio} />;
  },

  "casa-maria-cordoba": ({ onDone, assets }) => {
    console.log("assets", assets)
    return <CasaMariaCordobaScene onDone={onDone} audio={assets["act4/interrogatorio_maria.mp3"]} />
  },
  
  "recapitulacion-maria": ({ onDone, assets }) => {
    console.log("assets", assets)
    return <RecapitulacionScene onDone={onDone} audio={assets["act4/recapitulacion_maria.mp3"]} />
  },
  
  "llegada-casa-beatriz": ({ onDone, assets }) => {
    console.log("assets", assets)
    return <LlegadaCasaBeatrizScene onDone={onDone} audio={assets["act4/llegada_casa_beatriz.mp3"]} />
  },
  
  "beatriz-abre-puerta": ({ onDone, assets }) => {
    console.log("assets", assets)
    return <BeatrizAbreLaPuertaScene onDone={onDone} audio={assets["act4/beatriz_abre_la_puerta.mp3"]} />
  },
  
  "martin-entra-habitacion-eduardo": ({ onDone, assets }) => {
    console.log("assets", assets)
    return <MartinEntraHabitacionEduardoScene onDone={onDone} audio={assets["act4/martin_entra_habitacion_eduardo.mp3"]} />
  },
  
  "hector-mom-final-call": ({ onDone, assets }) => {
    console.log("hector-mom-final-call assets", assets)
    return (
      <LlamadaFinalMamaHectorScene
      onDone={onDone}
      audios={{
        colgarLlamada: assets["/media/act1/llamada/colgar_llamada.mp3"]?.src as string,
        incomingCall: assets["/media/act1/llamada/incoming_call.mp3"]?.src as string,
        adiosHector: assets["act5/adios_hector.mp3"],
        afterLlamadaAdiosHector: assets["act5/after_llamada_adios_hector.mp3"],
        llamadaAdiosHector: assets["act5/llamada_adios_hector.mp3"],
      }}
      />
    )
  },
  "social-app-noise": ({ onDone, assets }) => {
    return <SocialStormScene seed={1337} onDone={onDone} />;
  },
  "eduardo-leaked": ({ onDone, assets }) => {
    console.log("eduardo-leaked", assets)
    return (
      <EduardoLeakedScene
        onDone={onDone}
        audios={{
          audio1: assets["leaked/el_inicio.mp3"],
          audio2: assets["leaked/captura.mp3"],
        }}
      />
    )
  },
  
};

type Props = {
  sceneId: string;
  assets: AssetMap;
  onDone: () => void;
};

export default function StorytellerOverlay({ sceneId, assets, onDone }: Props) {
  const Scene = useMemo(() => SCENES[sceneId], [sceneId]);

  return <Full>{Scene ? Scene({ onDone, assets }) : <Missing>Scene desconocida: {sceneId}</Missing>}</Full>;
}

const Full = styled.div`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100svh;
  background: #000;
  z-index: 9000;
  display: grid;
  place-items: center;
`;

const Missing = styled.div`
  color: #fff;
  opacity: 0.9;
  font-weight: 900;
`;
