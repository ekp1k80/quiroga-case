// src/data/puzzles/index.ts
import { puzzleKey } from "@/data/puzzles/puzzleFlows";
import type { PuzzleFlow } from "@/data/puzzles/puzzleFlows";

import { QR2_FLOW } from "./qr2";
import { EXAMPLE_FLOW } from "./example";

export const PUZZLE_FLOWS: Record<string, PuzzleFlow> = {
  [puzzleKey(QR2_FLOW.packId, QR2_FLOW.puzzleId)]: QR2_FLOW,
  [puzzleKey(EXAMPLE_FLOW.packId, EXAMPLE_FLOW.puzzleId)]: EXAMPLE_FLOW,
};
