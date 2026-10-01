/**
 * 国・地域ビュー。上位8か国を積み上げ、選んだ国の在留資格を下に出す。
 * その年の表に行がない国は、棒に0としては入れない。
 */

import { use, useMemo } from "react";
import { GROUP_COLORS, PICK_COLOR, RANK_COLORS, REST_COLOR } from "../data/colors.ts";
import { exact, pct, sum } from "../data/format.ts";
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

export function NationsView() {
  const d = use(loadWorkers());
  const last = d.years.at(-1)!;
  const [yearParam, setYearParam] = useUrlState<string>("y", String(last), (v) => d.years.includes(Number(v)));
  const year = Number(yearParam);
  const yi = d.years.indexOf(year);
  const [measure, setMeasure] = useUrlState<Measure>("measure", "count", (v) => v === "count" || v === "share");
  const [chart, setChart] = useUrlState<Chart>("chart", "bars", (v) => CHARTS.some((c) => c.value === v));
  const Years = chart === "stream" ? Streamgraph : StackedYears;
  const names = d.nations.map((row) => row.name);
  const [picked, setPicked] = useUrlState<string>("n", "", (v) => names.includes(v));

  const top = d.nations.filter((row) => row.kind === "nation").slice(0, RANK_COLORS.length);
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
      const segments = keys.flatMap((name) => {
        const row = d.byNation[names.indexOf(name)]?.[k] ?? null;
        if (row === null) return [];
        const value = sum(row);
        named += value;
        return [{ key: name, value, color: colorOf(name) }];
      });
      const rest = total - named;
      if (rest > 0) segments.push({ key: REST, value: rest, color: REST_COLOR });
      return { year: yr, total, segments };
    });
  }, [d, names, picked, top]);

  const rows = useMemo((): RankRow[] => {
    const ranked = d.nations.flatMap((row, index) => {
      const values = d.byNation[index]?.[yi] ?? null;
      if (values === null) return [];
      return [{ name: row.name, kind: row.kind, value: sum(values) }];
    });
    const nations = ranked.filter((row) => row.kind === "nation").sort((a, b) => b.value - a.value);
    const bundles = ranked.filter((row) => row.kind === "bundle");
    return [...nations, ...bundles].map((row) => ({
      name: row.name,
      value: row.value,
      label: exact(row.value),
      indent: row.kind === "bundle" ? 1 : 0,
      color: row.kind === "bundle" ? REST_COLOR : colorOf(row.name),
    }));
  }, [d, yi, picked]);

  const pickedIndex = names.indexOf(picked);
  const pickedValues = pickedIndex < 0 ? null : (d.byNation[pickedIndex]?.[yi] ?? null);
  const total = sum(d.total[yi]!);
  const detailYears = d.years.flatMap((_, k) => {
    const row = pickedIndex < 0 ? null : (d.byNation[pickedIndex]?.[k] ?? null);
    return row === null ? [] : [k];
  });

  return (
    <main className="mx-auto grid w-full max-w-[1240px] gap-8 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">国籍</h2>
          <YearSelect years={d.years} value={year} onChange={(yr) => setYearParam(String(yr))} />
        </div>
        <RankList rows={rows} selected={picked} onSelect={setPicked} />
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="tnum text-[12px] text-muted">
            {year}年10月末 · {exact(total)}
            {picked !== "" &&
              (pickedValues === null ? (
                <span className="ml-2 text-faint">この年の表では国として分かれていない</span>
              ) : (
                <span className="ml-2">
                  {picked} {exact(sum(pickedValues))}（{pct(sum(pickedValues) / total)}）
                </span>
              ))}
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
          label="国籍ごとの外国人労働者数"
        />

        {picked !== "" && detailYears.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-[13px] font-semibold">{picked}の在留資格</h3>
            <Years
              columns={detailYears.map((k) => ({
                year: d.years[k]!,
                total: sum(d.byNation[pickedIndex]![k]!),
                segments: d.groups.map((group, g) => ({
                  key: group,
                  value: d.byNation[pickedIndex]![k]![g]!,
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
            <Legend items={d.groups.map((group) => ({ name: group, color: GROUP_COLORS[group] }))} />
          </div>
        )}
      </section>
    </main>
  );
}

function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 pl-[46px] text-[11px] text-muted">
      {items.map((it) => (
        <li key={it.name} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-[9px] rounded-[2px]" style={{ backgroundColor: it.color }} />
          {it.name}
        </li>
      ))}
    </ul>
  );
}
