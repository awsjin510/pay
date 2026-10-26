"use client";

import Link from "next/link";
import { useState } from "react";
import type { Submission } from "@/lib/data";

const v = (n: number | null, suffix = "") => (n == null ? "—" : `${n}${suffix}`);

export function SubmissionList({
  rows,
  recentFromYear,
  roleLabels,
  companyNames,
  filters,
}: {
  rows: Submission[];
  recentFromYear: number;
  roleLabels: Record<string, string>;
  // Set on cross-company lists so each card names its company.
  companyNames?: Record<string, string>;
  filters?: { id: string; label: string; match: string[] }[];
}) {
  const [recent, setRecent] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const allowed = filters?.find((f) => f.id === filter)?.match;
  const shown = rows
    .filter((r) => !recent || (r.year ?? 0) >= recentFromYear)
    .filter((r) => !allowed || allowed.includes(r.id))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        {filters && (
          <>
            {[{ id: null, label: "全部" }, ...filters].map((f) => (
              <button
                key={f.id ?? "all"}
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-3 py-0.5 ${filter === f.id ? "border-accent text-ink" : "border-border text-ink-2 hover:text-ink"}`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-ink-3">|</span>
          </>
        )}
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={recent} onChange={(e) => setRecent(e.target.checked)} />
          只看 {recentFromYear} 年後的資料
        </label>
        <span className="text-ink-3">{shown.length} 筆</span>
      </div>
      <ul className="space-y-3">
        {shown.map((r) => (
          <li key={r.id} className="rounded-lg border border-border bg-surface p-4">
            {companyNames && (
              <div className="mb-1 text-sm">
                {r.company ? (
                  <Link href={`/companies/${r.company}/`} className="text-accent hover:underline">
                    {companyNames[r.company]}
                  </Link>
                ) : (
                  <span className="text-ink-2">{r.companyRaw}（未具名）</span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="font-medium">{r.roleRaw ?? roleLabels[r.role]}</span>
                <span className="ml-2 text-xs text-ink-3">
                  {r.roleRaw ? roleLabels[r.role] : "罕見職稱已歸類"}
                  {r.levelRaw && `・職級 ${r.levelRaw}`}
                </span>
              </div>
              <span className="text-xs text-ink-3">{r.date ?? "日期不明"}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <Badge>{r.source === "web" ? "網站投稿・已審核" : "原始表單・未驗證"}</Badge>
              {r.year != null && r.year < recentFromYear && <Badge>{r.year} 年水準</Badge>}
              {r.flags.includes("outlier") && <Badge>疑似填寫錯誤，未納入統計</Badge>}
            </div>
            <dl className="tabular mt-3 grid grid-cols-3 gap-x-4 gap-y-2 text-sm sm:grid-cols-6">
              <Item label="月底薪" value={v(r.monthly, " 萬")} />
              <Item label="Bonus" value={v(r.bonusMonths, " 個月")} />
              <Item label="總年薪" value={r.annual != null ? `${r.annual} 萬` : r.annualEstimate != null ? `≈${r.annualEstimate} 萬` : "—"} />
              <Item label="相關年資" value={v(r.yoe, " 年")} />
              <Item label="工時 / 日" value={v(r.hoursPerDay, " 小時")} />
              <Item label="爽度 / Loading" value={`${v(r.happiness)} / ${v(r.loading)}`} />
            </dl>
            {r.certifications && <p className="mt-3 text-sm">證照：{r.certifications}</p>}
            {r.interviewTopics && <p className="mt-1 text-sm">面試題型：{r.interviewTopics}</p>}
            {r.comment && <p className="mt-3 whitespace-pre-line text-sm text-ink-2">{r.comment}</p>}
            {r.commentHidden && <p className="mt-3 text-xs text-ink-3">此則心得含針對個人的貶損字眼，已隱藏。</p>}
            <div className="mt-3 text-right">
              <Link href={`/report/?kind=error&target=${encodeURIComponent(r.id)}`} className="text-xs text-ink-3 hover:text-accent">
                回報這筆資料
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded border border-border px-1.5 py-0.5 text-ink-3">{children}</span>;
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
