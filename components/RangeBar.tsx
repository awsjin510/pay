import type { Dist } from "@/lib/data";

// P25–P75 band with a median tick, on a shared 0..max scale so rows are comparable.
export function RangeBar({ dist, max, unit = "萬", digits = 1 }: { dist: Dist | null; max: number; unit?: string; digits?: number }) {
  if (!dist) return <div className="h-3 text-xs text-ink-3">資料不足</div>;
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const label = `P25 ${dist.p25.toFixed(digits)}｜中位數 ${dist.median.toFixed(digits)}｜P75 ${dist.p75.toFixed(digits)} ${unit}（${dist.n} 筆）`;
  return (
    <div className="group relative h-4 w-full min-w-24" title={label} role="img" aria-label={label}>
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-grid" />
      <div
        className="absolute top-0.5 bottom-0.5 rounded-[4px] bg-data-soft group-hover:bg-data/40"
        style={{ left: pct(dist.p25), width: `calc(${pct(dist.p75)} - ${pct(dist.p25)})` }}
      />
      <div className="absolute top-0 bottom-0 w-[2px] -translate-x-1/2 rounded-full bg-data" style={{ left: pct(dist.median) }} />
    </div>
  );
}

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-sm text-ink-2">{label}</div>
      <div className="num mt-1 text-3xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-3">{sub}</div>}
    </div>
  );
}
