import type { Group } from "../../lib/data/labels.ts";

/** 身分は青のまま。資格外活動は隣の帯なので、青紫ではなく薔薇色にする。 */
export const GROUP_COLORS: Record<Group, string> = {
  "専門的・技術的分野": "#b0392a",
  特定活動: "#3f8f8f",
  技能実習: "#c9a03a",
  資格外活動: "#a0606a",
  身分に基づく在留資格: "#2f5d8a",
  不明: "#a8a299",
};

export const RANK_COLORS = [
  "#b0392a",
  "#2f5d8a",
  "#c9893a",
  "#4f7d5c",
  "#7a5a8c",
  "#3f8f8f",
  "#a0606a",
  "#7b7a3a",
];

export const REST_COLOR = "#d9d4ca";
export const PICK_COLOR = "#16140f";
