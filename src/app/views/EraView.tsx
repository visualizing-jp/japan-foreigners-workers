/**
 * 時代ビュー。在留資格のまとまりを年ごとに積み上げる。
 */

import { use, useMemo } from "react";
import type { Group } from "../../lib/data/labels.ts";
import { GROUP_COLORS } from "../data/colors.ts";
import { change, exact, offices, pct, sum } from "../data/format.ts";
import { loadWorkers } from "../data/load.ts";
import { Segmented } from "../components/Segmented.tsx";
import { CHARTS, Streamgraph, type Chart } from "../components/Streamgraph.tsx";
import { StackedYears, type Column, type Measure } from "../components/StackedYears.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

const MEASURES = [
  { value: "count", label: "人数" },
  { value: "share", label: "構成比" },
] as const;

export function EraView() {
  const d = use(loadWorkers());
  const last = d.years.at(-1)!;
  const [yearParam, setYearParam] = useUrlState<string>("y", String(last), (v) => d.years.includes(Number(v)));
  const year = Number(yearParam);
  const yi = d.years.indexOf(year);
  const [measure, setMeasure] = useUrlState<Measure>("measure", "count", (v) => v === "count" || v === "share");
  const [chart, setChart] = useUrlState<Chart>("chart", "bars", (v) => CHARTS.some((c) => c.value === v));
  const [picked, setPicked] = useUrlState<string>("g", "", (v) => d.groups.includes(v as Group));
  const Years = chart === "stream" ? Streamgraph : StackedYears;

  const columns = useMemo(
    (): Column[] =>
      d.years.map((yr, k) => ({
        year: yr,
        total: sum(d.total[k]!),
        segments: d.groups.map((group, g) => ({
          key: group,
          value: d.total[k]![g]!,
          color: GROUP_COLORS[group],
        })),
      })),
    [d],
  );

  const total = sum(d.total[yi]!);
  const prev = yi > 0 ? sum(d.total[yi - 1]!) : null;

  return (
    <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">在留資格のまとまり</h2>
          <p className="tnum mt-1 text-[12px] text-muted">
            {year}年10月末 · {exact(total)}
            {prev !== null && <span className="ml-2 text-faint">前年比 {change(total, prev)}</span>}
            <span className="ml-2 text-faint">事業所 {offices(d.totalOffices[yi]!)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Segmented options={CHARTS} value={chart} onChange={setChart} label="グラフ" />
          <Segmented options={MEASURES} value={measure} onChange={setMeasure} label="人数と構成比" />
        </div>
      </div>

      <Years
        columns={columns}
        measure={measure}
        highlighted={picked}
        focused={year}
        onFocus={(yr) => setYearParam(String(yr))}
        label="在留資格のまとまりごとの外国人労働者数"
      />

      <ul className="grid gap-1 sm:grid-cols-2">
        {d.groups.map((group, g) => {
          const value = d.total[yi]![g]!;
          const on = picked === group;
          return (
            <li key={group}>
              <button
                type="button"
                onClick={() => setPicked(on ? "" : group)}
                aria-pressed={on}
                className={`flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left transition-[background-color,transform] duration-150 ease-out active:scale-[0.99] ${
                  on ? "bg-ink/[0.06]" : "hover:bg-ink/[0.03]"
                }`}
              >
                <span aria-hidden className="size-[9px] shrink-0 rounded-[2px]" style={{ backgroundColor: GROUP_COLORS[group] }} />
                <span className={`min-w-0 flex-1 truncate text-[12px] ${on ? "font-semibold" : "text-muted"}`}>{group}</span>
                <span className="tnum text-[12px]">{exact(value)}</span>
                <span className="tnum w-12 text-right text-[11px] text-faint">{pct(value / total)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
