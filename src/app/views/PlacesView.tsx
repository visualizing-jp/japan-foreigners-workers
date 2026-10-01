/**
 * 都道府県ビュー。上位8県を積み上げ、選んだ県の在留資格を下に出す。
 */

import { use, useMemo } from "react";
import { GROUP_COLORS, PICK_COLOR, RANK_COLORS, REST_COLOR } from "../data/colors.ts";
import { exact, offices, pct, sum } from "../data/format.ts";
import { loadWorkers } from "../data/load.ts";
import { RankList, type RankRow } from "../components/RankList.tsx";
import { Segmented } from "../components/Segmented.tsx";
import { CHARTS, Streamgraph, type Chart } from "../components/Streamgraph.tsx";
import { StackedYears, type Column, type Measure } from "../components/StackedYears.tsx";
import { YearSelect } from "../components/YearSelect.tsx";
import { useUrlState } from "../hooks/useUrlState.ts";

const MEASURES = [
  { value: "count", label: "人数" },
  { value: "share", label: "構成比" },
] as const;

const REST = "そのほか";

export function PlacesView() {
  const d = use(loadWorkers());
  const last = d.years.at(-1)!;
  const latest = d.years.length - 1;
  const [yearParam, setYearParam] = useUrlState<string>("y", String(last), (v) => d.years.includes(Number(v)));
  const year = Number(yearParam);
  const yi = d.years.indexOf(year);
  const [measure, setMeasure] = useUrlState<Measure>("measure", "count", (v) => v === "count" || v === "share");
  const [chart, setChart] = useUrlState<Chart>("chart", "bars", (v) => CHARTS.some((c) => c.value === v));
  const Years = chart === "stream" ? Streamgraph : StackedYears;
  const [picked, setPicked] = useUrlState<string>("p", "", (v) => d.prefectures.includes(v));

  const top = [...d.prefectures]
    .map((name, index) => ({ name, index, value: sum(d.byPrefecture[index]![latest]!) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, RANK_COLORS.length);
  const colorOf = (name: string) => {
    const index = top.findIndex((row) => row.name === name);
    if (index >= 0) return RANK_COLORS[index]!;
    return name === picked ? PICK_COLOR : REST_COLOR;
  };

  const columns = useMemo((): Column[] => {
    const keys = top.map((row) => row.name);
    if (picked !== "" && !keys.includes(picked)) keys.push(picked);
    return d.years.map((yr, k) => {
      const total = sum(d.total[k]!);
      let named = 0;
      const segments = keys.map((name) => {
        const value = sum(d.byPrefecture[d.prefectures.indexOf(name)]![k]!);
        named += value;
        return { key: name, value, color: colorOf(name) };
      });
      const rest = total - named;
      if (rest > 0) segments.push({ key: REST, value: rest, color: REST_COLOR });
      return { year: yr, total, segments };
    });
  }, [d, picked, top]);

  const rows = useMemo((): RankRow[] => {
    return d.prefectures
      .map((name, index) => ({ name, value: sum(d.byPrefecture[index]![yi]!) }))
      .sort((a, b) => b.value - a.value)
      .map((row) => ({
        name: row.name,
        value: row.value,
        label: exact(row.value),
        indent: 0,
        color: colorOf(row.name),
      }));
  }, [d, yi, picked]);

  const pickedIndex = d.prefectures.indexOf(picked);
  const total = sum(d.total[yi]!);

  return (
    <main className="mx-auto grid w-full max-w-[1240px] gap-8 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">都道府県</h2>
          <YearSelect years={d.years} value={year} onChange={(yr) => setYearParam(String(yr))} />
        </div>
        <RankList rows={rows} selected={picked} onSelect={setPicked} />
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="tnum text-[12px] text-muted">
            {year}年10月末 · {exact(total)} · 事業所 {offices(d.totalOffices[yi]!)}
            {picked !== "" && (
              <span className="ml-2">
                {picked} {exact(sum(d.byPrefecture[pickedIndex]![yi]!))}（{pct(sum(d.byPrefecture[pickedIndex]![yi]!) / total)}）· 事業所{" "}
                {offices(d.offices[pickedIndex]![yi]!)}
              </span>
            )}
          </p>
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
          label="都道府県ごとの外国人労働者数"
        />

        {picked !== "" && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[13px] font-semibold">{picked}の在留資格</h3>
            <Years
              columns={d.years.map((yr, k) => ({
                year: yr,
                total: sum(d.byPrefecture[pickedIndex]![k]!),
                segments: d.groups.map((group, g) => ({
                  key: group,
                  value: d.byPrefecture[pickedIndex]![k]![g]!,
                  color: GROUP_COLORS[group],
                })),
              }))}
              measure="count"
              highlighted=""
              focused={year}
              onFocus={(yr) => setYearParam(String(yr))}
              height={220}
              label={`${picked}の在留資格`}
            />
          </div>
        )}
      </section>
    </main>
  );
}
