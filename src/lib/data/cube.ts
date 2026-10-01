import type { Group } from "./labels.ts";

export type RowKind = "nation" | "bundle";

export interface NationRow {
  name: string;
  kind: RowKind;
}

/**
 * 配信データ。年は10月末時点。
 * byNation[n][y] は groups と同じ並び。その年の国籍表に行がなければ null。
 * byPrefecture[p][y] も groups と同じ並びで、47都道府県の順。
 * offices は外国人を雇用する事業所数。
 */
export interface WorkersJson {
  years: number[];
  groups: Group[];
  nations: NationRow[];
  byNation: (number[] | null)[][];
  total: number[][];
  prefectures: string[];
  byPrefecture: number[][][];
  offices: number[][];
  totalOffices: number[];
}
