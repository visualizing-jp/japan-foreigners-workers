import { Suspense } from "react";
import { EraView } from "./views/EraView.tsx";
import { NationsView } from "./views/NationsView.tsx";
import { PlacesView } from "./views/PlacesView.tsx";
import { useUrlState } from "./hooks/useUrlState.ts";
import { SeriesBar, SeriesFooter } from "./components/Brand.tsx";

const VIEWS = [
  { id: "era", label: "時代", hint: "2016–" },
  { id: "nations", label: "国・地域", hint: "2016–" },
  { id: "places", label: "都道府県", hint: "2016–" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

export function App() {
  const [view, setView] = useUrlState<ViewId>("view", "era", (v) => VIEWS.some((x) => x.id === v));

  return (
    <div className="min-h-dvh">
      <header className="border-b border-rule bg-paper/85 backdrop-blur-sm">
        <SeriesBar />
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-end justify-between gap-4 px-6 pt-5">
          <div className="pb-2">
            <h1 className="text-[15px] font-semibold tracking-tight">日本で働く外国人は、どこから来たか</h1>
            <p className="text-[11px] text-muted">厚生労働省「外国人雇用状況」の届出状況</p>
          </div>
          <nav className="-mb-px flex gap-1" aria-label="ビュー">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                aria-current={view === v.id ? "page" : undefined}
                className={`cursor-pointer border-b-2 px-3 pt-1 pb-2 text-[13px] whitespace-nowrap transition-colors duration-150 ease-out ${
                  view === v.id ? "border-ink font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {v.label}
                <span className="ml-1.5 text-[10px] font-normal text-faint max-sm:hidden">{v.hint}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <Suspense key={view} fallback={<Loading />}>
        {view === "era" && <EraView />}
        {view === "nations" && <NationsView />}
        {view === "places" && <PlacesView />}
      </Suspense>

      <footer className="mx-auto w-full max-w-[1240px] px-6 pt-2 pb-10 text-[11px] leading-relaxed text-faint">
        出典: 厚生労働省「外国人雇用状況」の届出状況（各年10月末時点の別表）。事業主に雇用される外国人労働者で、特別永住者と在留資格「外交」「公用」は含まない。数値は届出の件数。
        別表の Excel がある2016年以降を載せている。国籍の行は、その年の表で国として分かれているものだけ。G7等は表の注にある国のまとまりで、年によって範囲が違う。
        <SeriesFooter />
      </footer>
    </div>
  );
}

function Loading() {
  return <div className="mx-auto w-full max-w-[1240px] px-6 py-16 text-[12px] text-faint">読み込み中</div>;
}
