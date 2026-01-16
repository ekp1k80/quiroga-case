"use client";

const bufferCache = new Map<string, AudioBuffer>();

export async function preloadBufferSound(audioContext: AudioContext, url: string) {
  if (bufferCache.has(url)) return;

  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  const buf = await audioContext.decodeAudioData(arr);
  bufferCache.set(url, buf);
}

export async function playBufferSound(
  audioContext: AudioContext,
  url: string,
  volume = 1.0
) {
  const buf = bufferCache.get(url);
  if (!buf) {
    await preloadBufferSound(audioContext, url);
  }

  const finalBuf = bufferCache.get(url);
  if (!finalBuf) return;

  const source = audioContext.createBufferSource();
  source.buffer = finalBuf;

  const gain = audioContext.createGain();
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(audioContext.destination);

  source.start(0);
}
