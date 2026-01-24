// src/data/final/qr3FinalQuiz.ts
export type FinalQuizChoice = { id: string; label: string };
export type FinalQuizQuestion = {
  id: string;
  prompt: string;
  choices: FinalQuizChoice[];
  correctChoiceId: string; // validar por id
};

export const QR3_FINAL_QUIZ = {
  threshold: 10,
  totalQuestions: 12,
  questions: [
    {
      id: "q1",
      prompt: "Pregunta 1 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "q2",
      prompt: "Pregunta 2 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "b",
    },
    {
      id: "q3",
      prompt: "Pregunta 3 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "c",
    },
    {
      id: "q4",
      prompt: "Pregunta 4 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "d",
    },
    {
      id: "q5",
      prompt: "Pregunta 5 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "q6",
      prompt: "Pregunta 6 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "b",
    },
    {
      id: "q7",
      prompt: "Pregunta 7 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "c",
    },
    {
      id: "q8",
      prompt: "Pregunta 8 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "d",
    },
    {
      id: "q9",
      prompt: "Pregunta 9 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "a",
    },
    {
      id: "q10",
      prompt: "Pregunta 10 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "b",
    },
    {
      id: "q11",
      prompt: "Pregunta 11 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "c",
    },
    {
      id: "q12",
      prompt: "Pregunta 12 (placeholder)",
      choices: [
        { id: "a", label: "Opción A" },
        { id: "b", label: "Opción B" },
        { id: "c", label: "Opción C" },
        { id: "d", label: "Opción D" },
      ],
      correctChoiceId: "d",
    },
  ] as const satisfies readonly FinalQuizQuestion[],
};

export type Qr3FinalQuizAnswers = Record<string, string>; // questionId -> choiceId

export function scoreAnswers(answers: Qr3FinalQuizAnswers) {
  let score = 0;
  for (const q of QR3_FINAL_QUIZ.questions) {
    if (answers[q.id] === q.correctChoiceId) score++;
  }
  return score;
}
