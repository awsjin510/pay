import Link from "next/link";
import { fmtWan, meta, trackLabel, type Company, type Track } from "@/lib/data";

// A company page without enough data still answers something: how close it is to having
// statistics, what similar companies pay, and the industry baseline — and asks to contribute.
export function ThinCompany({ company, similar, similarLabel, track }: { company: Company; similar: Company[]; similarLabel: string; track: Track | undefined }) {
  const missing = Math.max(meta.minN - company.n, 0);
  return (
    <div className="space-y-5 rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-lg font-bold">這間公司的資料還不夠</h2>
        <p className="mt-1 text-sm text-ink-2">
          目前 {company.n} 筆，至少要 {meta.minN} 筆才會顯示統計（避免誤導，也保護填寫者）。
          {missing > 0 && `再 ${missing} 筆就能解鎖。`}
        </p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: meta.minN }, (_, i) => (
            <span key={i} className={`h-2 w-10 rounded-full ${i < company.n ? "bg-accent" : "bg-surface-2"}`} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/submit/?company=${company.slug}`} className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-ink">
            我在這裡工作，匿名分享
          </Link>
          <Link href={`/offer/?company=${company.slug}`} className="rounded-lg border border-border px-3.5 py-2 text-sm hover:border-accent">
            拿到這間的 offer？用產業資料檢查
          </Link>
        </div>
      </div>

      {track?.stats?.monthly && (
        <div className="border-t border-border pt-4">
          <div className="text-sm text-ink-2">先參考{trackLabel(company.track)}整體</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-2xl font-semibold">{track.stats.monthly.median}</span>
            <span className="text-sm text-ink-2">萬（月底薪中位數）</span>
            <span className="text-sm text-ink-3">年薪中位數 {fmtWan(track.stats.annual?.median, 0)}</span>
          </div>
          <Link href={`/industries/${company.track}/`} className="text-sm text-accent hover:underline">
            看{trackLabel(company.track)}完整數據
          </Link>
        </div>
      )}

      {similar.length > 0 && (
        <div className="border-t border-border pt-4">
          <div className="text-sm text-ink-2">{similarLabel}</div>
          <ul className="mt-1 divide-y divide-border">
            {similar.map((x) => (
              <li key={x.slug}>
                <Link href={`/companies/${x.slug}/`} className="flex items-baseline gap-2 py-2 hover:text-accent">
                  <span>{x.name}</span>
                  <span className="text-xs text-ink-3">{x.n} 筆</span>
                  <span className="leader" aria-hidden="true" />
                  <span className="num font-semibold">{x.stats?.monthly?.median}</span>
                  <span className="text-sm text-ink-2">萬</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 高: plenty of rows including recent ones; 中: enough to compute; 低: not enough.
export function confidenceOf(company: Company) {
  if (!company.stats) return "低";
  return company.stats.n >= 10 && company.stats.recentN >= 3 ? "高" : "中";
}
