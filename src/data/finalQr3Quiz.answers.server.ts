import "server-only";

const DEBUG = false;

export const QR3_ANSWER_KEY: Record<string, string> = {
  A1: "C", A2: "B", A3: "C", A4: "B", A5: "B", A6: "C",
  B1: "B", B2: "C", B3: "B", B4: "B", B5: "B", B6: "A",
  D1: "B", D2: "C", D3: "B", D4: "B", D5: "A", D6: "B",
  E1: "B", "E1.5": "D", E2: "B", E3: "B", E4: "C", E5: "B", E6: "B",
  F1: "B", F2: "B", F3: "B", F4: "B", F5: "B", F6: "B",
};

export function scoreQr3Answers(answers: Record<string, string>): number {
  let score = 0;

  if(DEBUG) return Object.keys(QR3_ANSWER_KEY).length

  for (const [qid, correct] of Object.entries(QR3_ANSWER_KEY)) {
    if (answers[qid] === correct) score += 1;
  }
  return score;
}
