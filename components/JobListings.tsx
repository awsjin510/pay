import type { ItServices } from "@/lib/data";

const range = (low: number | null, high: number | null, negotiable: boolean) => {
  if (low != null && high != null) return `${low}–${high} 萬`;
  if (low != null) return `${low} 萬起`;
  return negotiable ? "面議（4 萬以上）" : "—";
};

// Current openings from 台灣就業通 (government job bank), refreshed by the weekly data sync.
export function JobListings({ jobs }: { jobs: ItServices["jobs"] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 font-normal">職務類別</th>
                <th className="px-3 py-2 text-right font-normal">職缺</th>
                <th className="px-3 py-2 text-right font-normal">月薪下限中位數</th>
                <th className="px-3 py-2 text-right font-normal">上限中位數</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {jobs.categories.map((c) => (
                <tr key={c.category} className="border-t border-border">
                  <td className="px-3 py-2 font-sans">{c.category}</td>
                  <td className="px-3 py-2 text-right text-ink-2">{c.n}</td>
                  <td className="px-3 py-2 text-right">{c.lowMedian != null ? `${c.lowMedian} 萬` : "—"}</td>
                  <td className="px-3 py-2 text-right">{c.highMedian != null ? `${c.highMedian} 萬` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-3">
          只計全職、仍在招募、以月薪標示的職缺。台灣就業通的資訊職缺以中小企業、公部門與非營利單位為主，薪資普遍低於科技大廠，請當作「招募公告的起薪」參考。
        </p>
      </div>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {jobs.list.slice(0, 20).map((j) => (
          <li key={`${j.company}|${j.title}`} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <a href={j.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate font-medium hover:text-accent">
                {j.title}
              </a>
              <span className="num shrink-0 font-semibold">{range(j.low, j.high, j.negotiable)}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-3">
              <span>{j.company}</span>
              <span>{j.city}</span>
              <span>經驗 {j.experience || "不拘"}</span>
              {j.updated && <span>更新 {j.updated}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
