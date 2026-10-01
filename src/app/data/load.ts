import type { WorkersJson } from "../../lib/data/cube.ts";

let cache: Promise<WorkersJson> | null = null;

export function loadWorkers(): Promise<WorkersJson> {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/workers.json`).then((r) => {
    if (!r.ok) throw new Error(`workers.json の取得に失敗しました (${r.status})`);
    return r.json() as Promise<WorkersJson>;
  });
  return cache;
}
