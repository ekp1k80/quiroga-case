import { useSoundUnlock } from "@/hooks/useSoundUnlock";
import { useEffect, useRef } from "react";

type AndroidScreenProps = {
  src: string;
  onStart?: () => void;
  onEnd?: () => void;
  timerEnd?: number;
};

const PlayAudio = ({src, onStart, onEnd, timerEnd}: AndroidScreenProps) => {
    const { unlocked, audioContextRef, unlockNow } = useSoundUnlock();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    const startRingtone = async () => {
    // Aseguramos unlock (por si lo llamás sin pasar por tu overlay)
    if (!unlocked) {
      await unlockNow();
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.loop = false;
      audioRef.current.preload = "auto";
      // Opcional: volumen
      audioRef.current.volume = 1.0;
    } else {
      audioRef.current.src = src;
      audioRef.current.loop = false;
    }

    try {
      await audioRef.current.play();
      if(onEnd && timerEnd) setTimeout(() => { onEnd() }, timerEnd)
    } catch {
      // Si esto falla, todavía no hubo gesto válido.
      // En tu juego, debería estar ok si ya tocó "Tap para continuar".
    }
  };

  useEffect(() => {
    if(onStart) onStart()
    startRingtone()
  }, [])

  return <></>
}

export default PlayAudio