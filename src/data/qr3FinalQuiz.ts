// src/data/finalQr3Quiz.ts
export type QChoice = { id: string; label: string };
export type QQuestion = { id: string; text: string; choices: QChoice[]; correctChoiceId: string };

export const QR3_PASS_SCORE = 10;

export const QR3_QUESTIONS: QQuestion[] = [
  {
    id: "q1",
    text: "¿Cuál era la dirección indicada en el recorte?",
    choices: [
      { id: "a", label: "J. M. Campos 1918, San Andrés" },
      { id: "b", label: "Pico 3078, Saavedra" },
      { id: "c", label: "Av. Maipú 1700, Vicente López" },
      { id: "d", label: "Córdoba 1200, CABA" },
    ],
    correctChoiceId: "a",
  },
  // ... agregás el resto (mínimo 12 si querés 10/12)
];
