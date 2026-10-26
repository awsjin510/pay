"use client";

import { useState } from "react";
import type { Submission } from "@/lib/data";

const v = (n: number | null, suffix = "") => (n == null ? "—" : `${n}${suffix}`);

export function SubmissionList({
  rows,
  recentFromYear,
  roleLabels,
}: {
  rows: Submission[];
  recentFromYear: number;
  roleLabels: Record<string, string>;
}) {
  const [recent, setRecent] = useState(false);
  const shown = rows
    .filter((r) => !recent || (r.year ?? 0) >= recentFromYear)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <div>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={recent} onChange={(e) => setRecent(e.target.checked)} />
        只看 {recentFromYear} 年後的資料
      </label>
      <ul className="space-y-3">
        {shown.map((r) => (
          <li key={r.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="font-medium">{r.roleRaw || "（未填職務）"}</span>
                <span className="ml-2 text-xs text-ink-3">
                  {roleLabels[r.role]}
                  {r.levelRaw && `・職級 ${r.levelRaw}`}
                </span>
              </div>
              <span className="text-xs text-ink-3">{r.date ?? "日期不明"}</span>
            </div>
            <dl className="tabular mt-3 grid grid-cols-3 gap-x-4 gap-y-2 text-sm sm:grid-cols-6">
              <Item label="月底薪" value={v(r.monthly, " 萬")} />
              <Item label="Bonus" value={v(r.bonusMonths, " 個月")} />
              <Item label="總年薪" value={r.annual != null ? `${r.annual} 萬` : r.annualEstimate != null ? `≈${r.annualEstimate} 萬` : "—"} />
              <Item label="相關年資" value={v(r.yoe, " 年")} />
              <Item label="工時 / 日" value={v(r.hoursPerDay, " 小時")} />
              <Item label="爽度 / Loading" value={`${v(r.happiness)} / ${v(r.loading)}`} />
            </dl>
            {r.comment && <p className="mt-3 whitespace-pre-line text-sm text-ink-2">{r.comment}</p>}
            {r.commentHidden && <p className="mt-3 text-xs text-ink-3">此則心得含針對個人的貶損字眼，已隱藏。</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
