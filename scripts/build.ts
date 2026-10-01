/**
 * 正規化 JSON を配信用の配列 public/data/workers.json にする。
 */

import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { WorkersJson } from "../src/lib/data/cube.ts";
import { BUNDLES, GROUPS, PREFECTURES, TOTAL } from "../src/lib/data/labels.ts";
import type { YearTable } from "../src/lib/parse/table.ts";

const SRC = resolve(import.meta.dirname, "../data/normalized/tables.json");
const OUT = resolve(import.meta.dirname, "../public/data/workers.json");

interface Normalized {
  years: number[];
  tables: YearTable[];
}

async function main(): Promise<void> {
  const { years, tables } = JSON.parse(readFileSync(SRC, "utf8")) as Normalized;
  const names = new Set<string>();
  for (const table of tables) {
    for (const row of table.nations) names.add(row.name);
  }
  const bundles = new Set<string>(BUNDLES);
  const latest = tables.at(-1)!;
  const rank = new Map(latest.nations.map((row) => [row.name, GROUPS.reduce((acc, group) => acc + row.values[group], 0)]));
  const nations = [...names]
    .filter((name) => !bundles.has(name))
    .sort((a, b) => (rank.get(b) ?? -1) - (rank.get(a) ?? -1) || a.localeCompare(b, "ja"))
    .concat(BUNDLES.filter((name) => names.has(name)));

  const cube: WorkersJson = {
    years,
    groups: [...GROUPS],
    nations: nations.map((name) => ({ name, kind: bundles.has(name) ? "bundle" : "nation" })),
    byNation: nations.map((name) =>
      tables.map((table) => {
        const row = table.nations.find((item) => item.name === name);
        return row === undefined ? null : GROUPS.map((group) => row.values[group]);
      }),
    ),
    total: tables.map((table) => GROUPS.map((group) => table.total[group])),
    prefectures: [...PREFECTURES],
    byPrefecture: PREFECTURES.map((name) =>
      tables.map((table) => GROUPS.map((group) => table.prefectures.find((row) => row.name === name)!.values[group])),
    ),
    offices: PREFECTURES.map((name) => tables.map((table) => table.offices[name]!)),
    totalOffices: tables.map((table) => table.totalOffices),
  };

  await mkdir(resolve(OUT, ".."), { recursive: true });
  await writeFile(OUT, JSON.stringify(cube));
  const last = cube.total.at(-1)!;
  const people = last.reduce((acc, n) => acc + n, 0);
  console.log(`  ${years[0]}–${years.at(-1)}  ${TOTAL} ${people}人  ${OUT}`);
}

if (import.meta.main) await main();
