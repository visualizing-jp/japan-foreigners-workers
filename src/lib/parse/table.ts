/**
 * 各年の別表を読む。
 *
 * - 別表1: 国籍 × 在留資格のまとまり。構成比の行と「うち」の内数は読まない。
 * - 別表2: 都道府県の事業所数と労働者数。
 * - 別表3: 都道府県 × 在留資格のまとまり。
 *
 * 6つのまとまりの和が、その行の総数と一致する。
 */

import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { BUNDLES, GROUPS, PREFECTURES, TOTAL, type Group } from "../data/labels.ts";

type Cell = string | number | boolean | null | undefined;

export interface CountRow {
  name: string;
  values: Record<Group, number>;
}

export interface YearTable {
  year: number;
  nations: CountRow[];
  total: Record<Group, number>;
  prefectures: CountRow[];
  offices: Record<string, number>;
  totalOffices: number;
}

export function clean(value: Cell): string {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\s/g, "");
}

function isCount(value: Cell): boolean {
  if (typeof value === "number") return Number.isInteger(value);
  return /^-?\d+$/.test(clean(value).replace(/,/g, ""));
}

function integer(value: Cell, where: string): number {
  if (!isCount(value)) throw new Error(`${where}: 数でない「${value}」`);
  return typeof value === "number" ? value : Number(clean(value).replace(/,/g, ""));
}

function sheetNamed(book: XLSX.WorkBook, mark: string): Cell[][] {
  const name = book.SheetNames.find((sheet) => sheet.includes(mark));
  const sheet = name === undefined ? undefined : book.Sheets[name];
  if (sheet === undefined) throw new Error(`シートがない: ${mark}`);
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
}

function yearOf(rows: Cell[][], expected: number): void {
  const text = rows
    .slice(0, 8)
    .flat()
    .map((cell) => clean(cell))
    .join("");
  const heisei = text.match(/平成(\d+)年/);
  const reiwa = text.match(/令和(?:元年|(\d+)年)/);
  const year = heisei !== null ? 1988 + Number(heisei[1]) : reiwa !== null ? 2018 + Number(reiwa[1] ?? 1) : null;
  if (year !== expected) throw new Error(`${expected}年の表に ${year}年 とある`);
}

function groupOf(label: string): Group | "total" | null {
  if (label.startsWith("総数") || label.startsWith("全在留資格計")) return "total";
  if (label.includes("専門的")) return "専門的・技術的分野";
  if (label.includes("特定活動")) return "特定活動";
  if (label.includes("技能実習")) return "技能実習";
  if (label.includes("資格外活動")) return "資格外活動";
  if (label.includes("身分に基づく")) return "身分に基づく在留資格";
  if (label.includes("不明")) return "不明";
  return null;
}

/** 在留資格のまとまりの列。構成比と「うち」は除き、まとまりごとに最初の列だけ取る。 */
function groupColumns(rows: Cell[][]): { total: number; groups: Record<Group, number> } {
  const header = rows.findIndex((row) => row.some((cell) => groupOf(clean(cell)) === "total"));
  if (header < 0) throw new Error("在留資格の見出しがない");
  const sub = rows[header + 1] ?? [];
  let current = "";
  let total = -1;
  const groups = {} as Record<Group, number>;
  const width = Math.max(rows[header]?.length ?? 0, sub.length);
  for (let i = 0; i < width; i++) {
    const label = clean(rows[header]?.[i]);
    if (label !== "") current = label;
    const under = clean(sub[i]);
    // 「計（構成比）」は人数の列。構成比そのものと「うち」の内数は隣の列。
    if (under.startsWith("うち") || under.startsWith("構成比")) continue;
    if (under !== "" && !under.startsWith("計")) continue;
    const group = groupOf(current);
    if (group === "total" && total < 0) total = i;
    else if (group !== null && group !== "total" && groups[group] === undefined) groups[group] = i;
  }
  if (total < 0) throw new Error("総数の列がない");
  for (const group of GROUPS) {
    if (groups[group] === undefined) throw new Error(`列がない: ${group}`);
  }
  return { total, groups };
}

function valuesAt(row: Cell[], columns: { total: number; groups: Record<Group, number> }, where: string): Record<Group, number> {
  const values = {} as Record<Group, number>;
  for (const group of GROUPS) values[group] = integer(row[columns.groups[group]], `${where} ${group}`);
  const sum = GROUPS.reduce((acc, group) => acc + values[group], 0);
  const total = integer(row[columns.total], `${where} 総数`);
  if (sum !== total) throw new Error(`${where}: 在留資格の和 ${sum} が総数 ${total} と違う`);
  return values;
}

function nationName(label: string): string | null {
  if (label === "" || label.startsWith("注") || label.startsWith("(")) return null;
  if (label.startsWith("全国籍計") || label === TOTAL) return TOTAL;
  if (label.startsWith("中国")) return "中国";
  if (label.startsWith("G7")) return "G7等";
  if (label === "その他") return "その他";
  return label;
}

function placeName(label: string): string | null {
  if (label === "全国計" || label === TOTAL) return TOTAL;
  return PREFECTURES.find((name) => name === label || (name.startsWith(label) && name.length === label.length + 1)) ?? null;
}

function readNations(rows: Cell[][]): { nations: CountRow[]; total: Record<Group, number> } {
  const columns = groupColumns(rows);
  const nations: CountRow[] = [];
  let total: Record<Group, number> | null = null;
  for (const row of rows) {
    const name = nationName(clean(row[0]));
    if (name === null || !isCount(row[columns.total])) continue;
    const values = valuesAt(row, columns, name);
    if (name === TOTAL) total = values;
    else nations.push({ name, values });
  }
  if (total === null) throw new Error("全国籍計がない");
  const seen = new Set<string>();
  for (const row of nations) {
    if (seen.has(row.name)) throw new Error(`国籍が重複: ${row.name}`);
    seen.add(row.name);
  }
  for (const bundle of BUNDLES) {
    if (!seen.has(bundle)) throw new Error(`まとまりの行がない: ${bundle}`);
  }
  return { nations, total };
}

function columnOf(rows: Cell[][], label: string): number {
  for (const row of rows.slice(0, 8)) {
    const index = row.findIndex((cell) => clean(cell).startsWith(label));
    if (index >= 0) return index;
  }
  throw new Error(`列がない: ${label}`);
}

function readOffices(rows: Cell[][]): { offices: Record<string, number>; totalOffices: number; workers: Record<string, number> } {
  const officeCol = columnOf(rows, "事業所数");
  const workerCol = columnOf(rows, "外国人労働者数");
  const offices: Record<string, number> = {};
  const workers: Record<string, number> = {};
  let totalOffices = -1;
  for (const row of rows) {
    const head = clean(row[0]);
    const name = head === "" ? null : placeName(head) ?? placeName(clean(row[1]));
    if (name === null) continue;
    const office = integer(row[officeCol], `${name} 事業所`);
    const worker = integer(row[workerCol], `${name} 労働者`);
    if (name === TOTAL) totalOffices = office;
    else {
      offices[name] = office;
      workers[name] = worker;
    }
  }
  if (totalOffices < 0) throw new Error("事業所の全国計がない");
  for (const name of PREFECTURES) {
    if (offices[name] === undefined) throw new Error(`事業所の行がない: ${name}`);
  }
  return { offices, totalOffices, workers };
}

function readPrefectures(rows: Cell[][], workers: Record<string, number>): CountRow[] {
  const columns = groupColumns(rows);
  const prefectures: CountRow[] = [];
  for (const row of rows) {
    const head = clean(row[0]);
    if (!/^\d+$/.test(head)) continue;
    const name = placeName(clean(row[1]));
    if (name === null || name === TOTAL) throw new Error(`都道府県でない「${row[1]}」`);
    const values = valuesAt(row, columns, name);
    const sum = GROUPS.reduce((acc, group) => acc + values[group], 0);
    if (sum !== workers[name]) throw new Error(`${name}: 別表3の ${sum} が別表2の ${workers[name]} と違う`);
    prefectures.push({ name, values });
  }
  if (prefectures.length !== PREFECTURES.length) throw new Error(`都道府県が ${prefectures.length} 行`);
  return prefectures;
}

export function readAnnual(path: string, year: number): YearTable {
  const book = XLSX.read(readFileSync(path));
  const nationsSheet = sheetNamed(book, "表１").length > 0 ? sheetNamed(book, "表１") : sheetNamed(book, "表1");
  const officesSheet = sheetNamed(book, "表２").length > 0 ? sheetNamed(book, "表２") : sheetNamed(book, "表2");
  const placesSheet = sheetNamed(book, "表３").length > 0 ? sheetNamed(book, "表３") : sheetNamed(book, "表3");
  yearOf(nationsSheet, year);
  const { nations, total } = readNations(nationsSheet);
  const { offices, totalOffices, workers } = readOffices(officesSheet);
  const nationalWorkers = GROUPS.reduce((acc, group) => acc + total[group], 0);
  const placeWorkers = PREFECTURES.reduce((acc, name) => acc + workers[name]!, 0);
  if (placeWorkers !== nationalWorkers) {
    throw new Error(`${year}: 都道府県の和 ${placeWorkers} が全国 ${nationalWorkers} と違う`);
  }
  return {
    year,
    nations,
    total,
    prefectures: readPrefectures(placesSheet, workers),
    offices,
    totalOffices,
  };
}
