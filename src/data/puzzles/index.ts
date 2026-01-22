// src/data/puzzles/index.ts
import { puzzleKey } from "@/data/puzzles/puzzleFlows";
import type { PuzzleFlow } from "@/data/puzzles/puzzleFlows";

import { QR2_FLOW } from "./qr2";
import { EXAMPLE_FLOW } from "./example";
import { CHAT_TO_SCHOOL_1_CHAT_FLOW } from "./chatToSchool1";
import { CHAT_TO_SCHOOL_2_CHAT_FLOW } from "./chatToSchool2";
import { BEFORE_SCAN_QR1_CHAT_FLOW, CHAT_QR1_CHAT_FLOW } from "./qr1_school_chats";

export const PUZZLE_FLOWS: Record<string, PuzzleFlow> = {
  [puzzleKey(QR2_FLOW.packId, QR2_FLOW.puzzleId)]: QR2_FLOW,
  [puzzleKey(EXAMPLE_FLOW.packId, EXAMPLE_FLOW.puzzleId)]: EXAMPLE_FLOW,
  [puzzleKey(CHAT_TO_SCHOOL_1_CHAT_FLOW.packId, CHAT_TO_SCHOOL_1_CHAT_FLOW.puzzleId)]: CHAT_TO_SCHOOL_1_CHAT_FLOW,
  [puzzleKey(CHAT_TO_SCHOOL_2_CHAT_FLOW.packId, CHAT_TO_SCHOOL_2_CHAT_FLOW.puzzleId)]: CHAT_TO_SCHOOL_2_CHAT_FLOW,
  [puzzleKey(BEFORE_SCAN_QR1_CHAT_FLOW.packId, BEFORE_SCAN_QR1_CHAT_FLOW.puzzleId)]: BEFORE_SCAN_QR1_CHAT_FLOW,
  [puzzleKey(CHAT_QR1_CHAT_FLOW.packId, CHAT_QR1_CHAT_FLOW.puzzleId)]: CHAT_QR1_CHAT_FLOW,
};
