/**
 * 各年の別表を data/normalized/tables.json にする。
 */

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ANNUALS } from "../src/lib/data/sources.ts";
import { readAnnual } from "../src/lib/parse/table.ts";

const RAW_DIR = resolve(import.meta.dirname, "../data/raw");
const OUT = resolve(import.meta.dirname, "../data/normalized/tables.json");

async function main(): Promise<void> {
  const tables = ANNUALS.map((doc) => readAnnual(resolve(RAW_DIR, `${doc.year}.xlsx`), doc.year));
  await mkdir(resolve(OUT, ".."), { recursive: true });
  await writeFile(OUT, JSON.stringify({ years: ANNUALS.map((doc) => doc.year), tables }));
  console.log(`  ${tables.length} years -> ${OUT}`);
}

if (import.meta.main) await main();
