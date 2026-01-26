// src/data/puzzles/index.ts
import { puzzleKey } from "@/data/puzzles/puzzleFlows";
import type { PuzzleFlow } from "@/data/puzzles/puzzleFlows";

import { QR2_FLOW } from "./qr2";
import { EXAMPLE_FLOW } from "./example";
import { CHAT_TO_SCHOOL_1_CHAT_FLOW } from "./chatToSchool1";
import { CHAT_TO_SCHOOL_2_CHAT_FLOW } from "./chatToSchool2";
import { BEFORE_SCAN_QR1_CHAT_FLOW, CHAT_QR1_CHAT_FLOW } from "./qr1_school_chats";
import { BEFORE_SCAN_QR2_CHAT_FLOW, QR2_CHAT_FLOW } from "./qr2_return_chats";
import { AFTER_CASA_EDUARDO_CHAT_FLOW } from "./after_casa_eduardo_chat";
import { EDUARDO_HOUSE_CHAT_FLOW } from "./eduardo_house_chat";
import { EDUARDO_HOUSE_BOARD_CHAT_FLOW } from "./eduardo_house_board_chat";
import { EDUARDO_HOUSE_NEXT_CHAT_FLOW } from "./eduardo_house_next_chat";
import { THE_RADIO_CHAT_FLOW } from "./theRadioChat";
import { BEFORE_SCAN_QR3_CHAT_FLOW } from "./before_scan_qr3_chat";
import { INVESTIGATION_CHAT_FLOW } from "./investigation_chat";

export const PUZZLE_FLOWS: Record<string, PuzzleFlow> = {
  [puzzleKey(EXAMPLE_FLOW.packId, EXAMPLE_FLOW.puzzleId)]: EXAMPLE_FLOW,
  [puzzleKey(CHAT_TO_SCHOOL_1_CHAT_FLOW.packId, CHAT_TO_SCHOOL_1_CHAT_FLOW.puzzleId)]: CHAT_TO_SCHOOL_1_CHAT_FLOW,
  [puzzleKey(CHAT_TO_SCHOOL_2_CHAT_FLOW.packId, CHAT_TO_SCHOOL_2_CHAT_FLOW.puzzleId)]: CHAT_TO_SCHOOL_2_CHAT_FLOW,
  [puzzleKey(THE_RADIO_CHAT_FLOW.packId, THE_RADIO_CHAT_FLOW.puzzleId)]: THE_RADIO_CHAT_FLOW,
  [puzzleKey(BEFORE_SCAN_QR1_CHAT_FLOW.packId, BEFORE_SCAN_QR1_CHAT_FLOW.puzzleId)]: BEFORE_SCAN_QR1_CHAT_FLOW,
  [puzzleKey(CHAT_QR1_CHAT_FLOW.packId, CHAT_QR1_CHAT_FLOW.puzzleId)]: CHAT_QR1_CHAT_FLOW,
  [puzzleKey(BEFORE_SCAN_QR2_CHAT_FLOW.packId, BEFORE_SCAN_QR2_CHAT_FLOW.puzzleId)]: BEFORE_SCAN_QR2_CHAT_FLOW,
  [puzzleKey(QR2_CHAT_FLOW.packId, QR2_CHAT_FLOW.puzzleId)]: QR2_CHAT_FLOW,
  [puzzleKey(QR2_FLOW.packId, QR2_FLOW.puzzleId)]: QR2_FLOW,
  [puzzleKey(EDUARDO_HOUSE_CHAT_FLOW.packId, EDUARDO_HOUSE_CHAT_FLOW.puzzleId)]: EDUARDO_HOUSE_CHAT_FLOW,
  [puzzleKey(EDUARDO_HOUSE_BOARD_CHAT_FLOW.packId, EDUARDO_HOUSE_BOARD_CHAT_FLOW.puzzleId)]: EDUARDO_HOUSE_BOARD_CHAT_FLOW,
  [puzzleKey(EDUARDO_HOUSE_NEXT_CHAT_FLOW.packId, EDUARDO_HOUSE_NEXT_CHAT_FLOW.puzzleId)]: EDUARDO_HOUSE_NEXT_CHAT_FLOW,
  [puzzleKey(AFTER_CASA_EDUARDO_CHAT_FLOW.packId, AFTER_CASA_EDUARDO_CHAT_FLOW.puzzleId)]: AFTER_CASA_EDUARDO_CHAT_FLOW,
  [puzzleKey(BEFORE_SCAN_QR3_CHAT_FLOW.packId, BEFORE_SCAN_QR3_CHAT_FLOW.puzzleId)]: BEFORE_SCAN_QR3_CHAT_FLOW,
  [puzzleKey(INVESTIGATION_CHAT_FLOW.packId, INVESTIGATION_CHAT_FLOW.puzzleId)]: INVESTIGATION_CHAT_FLOW,
};
