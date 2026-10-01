const int = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
const one = new Intl.NumberFormat("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** 10万人以上は万人に丸める。それより小さい値は人で出す。 */
export function people(n: number): string {
  return n >= 100_000 ? `${int.format(Math.round(n / 10_000))}万人` : `${int.format(n)}人`;
}

export function exact(n: number): string {
  return `${int.format(n)}人`;
}

export function offices(n: number): string {
  return `${int.format(n)}所`;
}

export function pct(share: number): string {
  return `${one.format(share * 100)}%`;
}

export function change(now: number, prev: number): string {
  const r = now / prev - 1;
  return `${r >= 0 ? "+" : ""}${pct(r)}`;
}

export function tickMan(v: number): string {
  return v === 0 ? "0" : `${int.format(v / 10_000)}万`;
}

export function sum(values: number[]): number {
  return values.reduce((acc, n) => acc + n, 0);
}
