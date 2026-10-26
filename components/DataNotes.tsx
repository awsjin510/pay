import { meta, type Company, type Stats } from "@/lib/data";

// Which years the numbers come from, with a warning when most of it predates the recent window.
export function YearMix({ stats }: { stats: Stats }) {
  const entries = Object.entries(stats.years).sort(([a], [b]) => a.localeCompare(b));
  const old = entries.filter(([y]) => y !== "unknown" && Number(y) < meta.recentFromYear).reduce((n, [, c]) => n + c, 0);
  const oldShare = old / stats.n;
  return (
    <p className="text-xs text-ink-3">
      資料年份：
      {entries.map(([y, c], i) => (
        <span key={y}>
          {i > 0 && "・"}
          {y === "unknown" ? "不明" : y} {Math.round((c / stats.n) * 100)}%
        </span>
      ))}
      {oldShare > 0.5 && (
        <span className="ml-2 rounded border border-border px-1.5 py-0.5 text-ink-2">多為 {meta.recentFromYear} 年前資料，可能低於現行行情</span>
      )}
    </p>
  );
}

// The legally required disclosure next to the crowd numbers.
export function OfficialPay({ company }: { company: Company }) {
  const o = company.official;
  if (!o) return null;
  const crowd = company.stats?.annual?.median;
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-sm">
      <div className="text-xs text-ink-2">官方揭露・{o.year} 年非擔任主管全時員工薪資（{o.market} {o.code}）</div>
      <div className="tabular mt-1 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span>
          中位數 <span className="text-2xl font-semibold">{o.median} 萬</span>
          {o.medianChange && <span className="ml-1 text-xs text-ink-3">（年增 {o.medianChange}）</span>}
        </span>
        {o.mean != null && <span className="text-ink-2">平均 {o.mean} 萬</span>}
        {crowd != null && <span className="text-ink-2">本站總年薪中位數 {crowd} 萬</span>}
      </div>
      <p className="mt-2 text-xs text-ink-3">
        來源：公開資訊觀測站（證交所／櫃買中心開放資料）。官方數字含全公司非主管職員工、為全年薪資總額，與本站依職務自行回報的數字定義不同，請互相參照。
      </p>
    </div>
  );
}
