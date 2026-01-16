"use client";

import { AudioVizConfig } from "@/data/packs";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export type AudioMeterHandle = {
  resume: () => Promise<void>;
};

type Props = {
  audioEl: HTMLAudioElement | null;
  height?: number;
  barCount?: number;
  viz: AudioVizConfig;
};

export default forwardRef<AudioMeterHandle, Props>(function AudioMeter(
  { audioEl, height = 128, barCount = 110, viz },
  ref
) {
	const { gain, minBinFrac, gate, gateSoft } = viz
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  async function ensureGraph() {
    if (!audioEl) return;

    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new Ctx();
    }

    const ctx = ctxRef.current;

    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.6;
    }

    // MediaElementSource SOLO se puede crear una vez por elemento
    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(audioEl);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
    }
  }

  async function resume() {
    await ensureGraph();
    const ctx = ctxRef.current;
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  useImperativeHandle(ref, () => ({ resume }), [audioEl]);

  useEffect(() => {
    if (!audioEl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const resize = () => {
      const cssWidth = canvas.parentElement?.clientWidth ?? 600;
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = "100%";
      canvas.style.height = `${height}px`;
    };

    resize();

    const g = canvas.getContext("2d");
    if (!g) return;

    const draw = () => {
      const analyser = analyserRef.current;
      if (!analyser) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);

      const W = canvas.width;
			const H = canvas.height;
			g.clearRect(0, 0, W, H);

			const step = Math.max(1, Math.floor(freqData.length / barCount));
			const gap = Math.max(1, Math.floor(2 * dpr));
			const barW = Math.max(1, Math.floor((W - gap * (barCount - 1)) / barCount));

			const centerY = Math.floor(H / 2);
			const mid = Math.floor(barCount / 2);

			const minBin = Math.floor(minBinFrac * (freqData.length - 1));

			function binIndexForBar(distFromCenter: number) {
				const t = distFromCenter / Math.max(1, mid);
				const curved = Math.pow(t, 1.2);
				const bin = Math.floor(curved * (freqData.length - 1));
				return Math.min(freqData.length - 1, minBin + bin);
			}

			for (let i = 0; i < barCount; i++) {
				// distancia al centro: 0 en el medio, crece hacia afuera
				const dist = Math.abs(i - mid);

				const bin = binIndexForBar(dist);
				const b0 = bin;
				const b1 = Math.min(freqData.length - 1, bin + 1);
				const b2 = Math.min(freqData.length - 1, bin + 2);
				const raw = (freqData[b0] + freqData[b1] + freqData[b2]) / (3 * 255);
				let v = raw * gain;
				if (v < gate) {
					v = Math.max(0, (v - (gate - gateSoft)) / gateSoft);
				}
				v = v * gain;

				const totalH = Math.max(1, Math.floor(v * H));
				const halfH = Math.floor(totalH / 2);

				const x = i * (barW + gap);

				g.fillStyle = "rgba(130, 32, 145, 0.9)";

				// arriba desde el centro
				g.fillRect(x, centerY - halfH, barW, halfH);
				// abajo desde el centro
				g.fillRect(x, centerY, barW, halfH);
			}

      rafRef.current = requestAnimationFrame(draw);
    };

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;

      // NO cerramos el AudioContext acá para no matar audio accidentalmente.
      // Si querés cerrar cuando desmonta el player, lo hacemos a nivel AudioPlayer.
    };
  }, [audioEl, height, barCount]);

  return <canvas ref={canvasRef} />;
});
