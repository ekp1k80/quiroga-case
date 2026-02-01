// src/hooks/useLoaderTips.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Tip = { id: string; text: string };

const LS_SEEN_KEY = "cq_loader_seen_tip_ids_v1";

const TIPS: Tip[] = [
  { id: "abuela", text: "Al recibir la bendición de tu abuela asegurás inmunidad" },
  { id: "mendigos", text: "Al darle plata a los mendigos asegurás protección en zonas no exploradas" },
  { id: "colectivo", text: "Dormirte en el colectivo omite la cinemática, pero es posible perder objetos de tu inventario" },
  { id: "electricidad", text: "Aprovechá la electricidad: no siempre contarás con este recurso" },
  { id: "misiones", text: "No olvides realizar misiones secundarias como trabajar, a veces te pagan" },
  { id: "lluvia", text: "Al llover el mapa cambia a bioma acuático" },
  { id: "marcelo", text: "Presioná Ctrl para conocer a Marcelo" },
  { id: "motos", text: "Podés encubrir el ruido de tus disparos entre los cortes de las motos" },
  { id: "villa", text: "La policía no te perseguirá dentro de la Villa. Pero allí encontrarás otros desafíos" },
  {
    id: "altas-llantas",
    text: 'El ítem "Altas Llantas" bonifica velocidad y carisma con NPCs femeninos clase turra. Pero ojo: sube la chance del encuentro "Te regalaste gato"',
  },
  { id: "dlc", text: 'El modo fácil solo está disponible con el DLC "amigo en el gobierno"' },
  { id: "mate", text: "Recordá que el mate recupera vida progresivamente, pero si consumís muchos… re-cagaste" },
  { id: "fernet-70-30", text: "El fernet se prepara 70-30 y con hielo" },
  { id: "tren", text: "En el tren podés encontrar de todo, pero con una baja probabilidad" },
  { id: "deposito", text: "Asegurate de poner dólares: el que ponga dólares, recibirá dólares" },
  { id: "pedidoya", text: "Laburar para Pedidoya te permite pasar el semáforo en rojo" },
  { id: "amasijar", text: "Si entra el chorro, no lo podés amasijar en el patio, porque después dicen que se cayó de la medianera" },
  { id: "hora-noche", text: "Si te piden la hora de noche, presioná Shift" },
  { id: "buff-fernet", text: 'El consumible "Fernet" tiene probabilidad de darte un buff temporal de carisma' },
  { id: "carpinchos", text: "Los carpinchos son seres sociales: acariciarlos reduce significativamente tu estrés" },
  { id: "flequillo", text: "No te acerques a gente con flequillo, aros y pelo de colores" },
  {
    id: "salir-juego",
    text: "Salir del juego te abre la carga como inmigrante: según tus acciones, arrancás como ilegal, residente o repatriado. Cualquiera baja la dificultad",
  },
  { id: "guardar-sillas", text: "Si estás en una fiesta familiar, podés guardar partida en 3 sillas juntas" },
  { id: "mapa", text: "La dificultad del mapa no está distribuida equitativamente" },
  { id: "piedra-fantasma", text: 'Podés ahuyentar perros callejeros con la habilidad "Piedra fantasma"' },
  { id: "acompanante", text: "Si querés un fiel acompañante, acariciá a un perro de la calle: será tu guardián" },
  { id: "audi", text: 'El transporte público disminuye tu barra de cordura; se previene con el ítem "Audífonos"' },
];

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function readSeen(): string[] {
  if (typeof window === "undefined") return [];
  return safeParseJson<string[]>(window.localStorage.getItem(LS_SEEN_KEY), []);
}

function writeSeen(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_SEEN_KEY, JSON.stringify(ids));
}

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

export function useLoaderTips(opts?: { debug?: boolean; debugTag?: string }) {
  const debug = !!opts?.debug && process.env.NODE_ENV !== "production";
  const tag = opts?.debugTag ? `:${opts.debugTag}` : "";

  const log = useCallback(
    (...args: any[]) => {
      if (!debug) return;
      console.log(`[useLoaderTips${tag}]`, ...args);
    },
    [debug, tag]
  );

  const tipIds = useMemo(() => new Set(TIPS.map((t) => t.id)), []);
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = readSeen();
    const cleaned = raw.filter((id) => tipIds.has(id));
    if (cleaned.length !== raw.length) {
      writeSeen(cleaned);
      log("cleaned seen ids", { before: raw.length, after: cleaned.length, t: now() });
    }
    setBootReady(true);
  }, [log, tipIds]);

  const pickTips = useCallback(
    (count: number) => {
      const seen = readSeen().filter((id) => tipIds.has(id));
      let unseen = TIPS.filter((t) => !seen.includes(t.id));
      let nextSeen = [...seen];

      const picked: Tip[] = [];

      for (let i = 0; i < count; i++) {
        if (unseen.length === 0) {
          nextSeen = [];
          unseen = [...TIPS];
          log("cycle reset", { t: now() });
        }
        const chosen = pickRandom(unseen);
        picked.push(chosen);
        nextSeen.push(chosen.id);
        unseen = unseen.filter((t) => t.id !== chosen.id);
      }

      writeSeen(nextSeen);

      log("pickTips", {
        t: now(),
        count,
        picked: picked.map((p) => p.id),
        seenBefore: seen.length,
        seenAfter: nextSeen.length,
      });

      return picked.map((p) => p.text);
    },
    [log, tipIds]
  );

  return { bootReady, pickTips };
}
