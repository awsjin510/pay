"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RangeBar } from "@/components/RangeBar";
import type { Company, Stats } from "@/lib/data";

type SortKey = "n" | "monthly" | "annual" | "happiness";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "n", label: "筆數" },
  { key: "monthly", label: "月薪" },
  { key: "annual", label: "年薪" },
  { key: "happiness", label: "爽度" },
];

function sortValue(s: Stats, key: SortKey) {
  if (key === "n") return s.n;
  if (key === "monthly") return s.monthly?.median ?? -1;
  if (key === "annual") return s.annual?.median ?? -1;
  return s.happiness ?? -1;
}

export function CompanyTable({ companies, recentFromYear }: { companies: Company[]; recentFromYear: number }) {
  const [recent, setRecent] = useState(false);
  const [sort, setSort] = useState<SortKey>("n");

  const rows = useMemo(
    () =>
      companies
        .map((c) => ({ c, s: recent ? c.recentStats : c.stats }))
        .filter((r): r is { c: Company; s: Stats } => r.s != null)
        .sort((a, b) => sortValue(b.s, sort) - sortValue(a.s, sort)),
    [companies, recent, sort],
  );
  const max = Math.max(...rows.map((r) => r.s.monthly?.p75 ?? 0), 1) * 1.05;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={recent} onChange={(e) => setRecent(e.target.checked)} />
          只看 {recentFromYear} 年後的資料
        </label>
        <span className="text-ink-3">|</span>
        <span className="text-ink-2">排序</span>
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`rounded-full border px-3 py-0.5 ${sort === s.key ? "border-accent text-ink" : "border-border text-ink-2 hover:text-ink"}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-left text-xs text-ink-2">
            <tr>
              <th className="px-3 py-2 font-normal">公司</th>
              <th className="px-3 py-2 text-right font-normal">筆數</th>
              <th className="px-3 py-2 font-normal">月底薪分布</th>
              <th className="px-3 py-2 text-right font-normal">月薪中位數</th>
              <th className="px-3 py-2 text-right font-normal">年薪中位數</th>
              <th className="px-3 py-2 text-right font-normal">爽度</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.map(({ c, s }) => (
              <tr key={c.slug} className="border-t border-border hover:bg-background">
                <td className="px-3 py-2">
                  <Link href={`/companies/${c.slug}/`} className="hover:text-accent">
                    {c.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right text-ink-2">{s.n}</td>
                <td className="w-1/4 px-3 py-2">
                  <RangeBar dist={s.monthly} max={max} />
                </td>
                <td className="px-3 py-2 text-right">{s.monthly ? `${s.monthly.median.toFixed(1)} 萬` : "—"}</td>
                <td className="px-3 py-2 text-right">{s.annual ? `${s.annual.median.toFixed(0)} 萬` : "—"}</td>
                <td className="px-3 py-2 text-right">{s.happiness?.toFixed(1) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-4 text-sm text-ink-2">沒有符合條件的公司。</p>}
      </div>
    </div>
  );
}
