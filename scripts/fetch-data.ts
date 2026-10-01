/**
 * sources.ts の各年の別表を data/raw/{year}.xlsx に落とす。
 * 既にあるファイルは取り直さない。差し替えを取り込むときは --force。
 */

import { mkdir, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ANNUALS } from "../src/lib/data/sources.ts";

const RAW_DIR = resolve(import.meta.dirname, "../data/raw");

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  await mkdir(RAW_DIR, { recursive: true });
  for (const doc of ANNUALS) {
    const path = resolve(RAW_DIR, `${doc.year}.xlsx`);
    if (!force && (await exists(path))) continue;
    const res = await fetch(doc.url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`${doc.year}: ${res.status} ${doc.url}`);
    const body = Buffer.from(await res.arrayBuffer());
    if (body.subarray(0, 4).toString("hex") !== "504b0304") throw new Error(`${doc.year}: Excel でない応答`);
    await writeFile(path, body);
    console.log(`  ${doc.year}.xlsx`);
  }
}

if (import.meta.main) await main();
