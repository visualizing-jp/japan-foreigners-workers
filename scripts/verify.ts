/**
 * 別表の中の和と、報道発表に書いてある人数を照合する。
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GROUPS, PREFECTURES } from "../src/lib/data/labels.ts";
import type { YearTable } from "../src/lib/parse/table.ts";

const SRC = resolve(import.meta.dirname, "../data/normalized/tables.json");

/** 報道発表の本文にある人数。別表の総数と国籍の上位。 */
const ANNOUNCED: Record<number, { total: number; nations: Record<string, number> }> = {
  2024: { total: 2_302_587, nations: { ベトナム: 570_708, 中国: 408_805, フィリピン: 245_565 } },
  2025: { total: 2_571_037, nations: { ベトナム: 605_906, 中国: 431_949, フィリピン: 260_869 } },
};

function sum(values: Record<string, number>): number {
  return GROUPS.reduce((acc, group) => acc + values[group]!, 0);
}

function main(): void {
  const { tables } = JSON.parse(readFileSync(SRC, "utf8")) as { tables: YearTable[] };
  let checks = 0;
  for (const table of tables) {
    const national = sum(table.total);
    const fromNations = table.nations.reduce((acc, row) => acc + sum(row.values), 0);
    if (fromNations !== national) throw new Error(`${table.year}: 国籍の和 ${fromNations} が全国 ${national} と違う`);
    checks += 1;

    const fromPlaces = table.prefectures.reduce((acc, row) => acc + sum(row.values), 0);
    if (fromPlaces !== national) throw new Error(`${table.year}: 都道府県の和 ${fromPlaces} が全国 ${national} と違う`);
    checks += 1;

    const offices = PREFECTURES.reduce((acc, name) => acc + table.offices[name]!, 0);
    if (offices !== table.totalOffices) throw new Error(`${table.year}: 事業所の和 ${offices} が全国 ${table.totalOffices} と違う`);
    checks += 1;

    const announced = ANNOUNCED[table.year];
    if (announced !== undefined) {
      if (national !== announced.total) throw new Error(`${table.year}: 総数 ${national} が発表の ${announced.total} と違う`);
      checks += 1;
      for (const [name, count] of Object.entries(announced.nations)) {
        const row = table.nations.find((item) => item.name === name);
        const got = row === undefined ? null : sum(row.values);
        if (got !== count) throw new Error(`${table.year} ${name}: ${got} が発表の ${count} と違う`);
        checks += 1;
      }
    }
  }
  console.log(`  ${checks} checks ok`);
}

main();
