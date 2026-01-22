import ProloguePhoneScene from "@/story/scenes/ViajeCentragoloScene";
import LlamadaMamaHectorScene from "./LlamadaMamaHector";

export type SceneProps = { onDone: () => void };

export type SceneEntry = {
  id: string;

  /**
   * Cuando el player termina la escena, a qué storyNode debe avanzar el backend.
   * El frontend NO aplica patches: solo notifica "terminé escena X".
   */
  advancesToStoryNode: string;
};

export const SCENES: Record<string, SceneEntry> = {
  "prologue-1": {
    id: "prologue-1",
    advancesToStoryNode: "res-prologue",
  },

  // vas sumando:
  // "restaurant-prologue": { Component: RestaurantScene, advancesToStoryNode: "hospital" },
  // "hospital-act1": { Component: HospitalScene, advancesToStoryNode: "hector-house" },
};
