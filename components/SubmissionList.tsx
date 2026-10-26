"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckBadge, DocIcon } from "@/components/Icons";
import type { Submission } from "@/lib/data";

const PAGE = 20;
const LEVELS = [
  { id: "entry", label: "0–1 年" },
  { id: "junior", label: "2–4 年" },
  { id: "senior", label: "5–9 年" },
  { id: "expert", label: "10 年以上" },
];
const SORTS = [
  { id: "date", label: "最新" },
  { id: "high", label: "月薪高到低" },
  { id: "low", label: "月薪低到高" },
];

const v = (n: number | null, suffix = "") => (n == null ? "—" : `${n}${suffix}`);
const annualText = (r: Submission) => (r.annual != null ? `${r.annual} 萬` : r.annualEstimate != null ? `≈${r.annualEstimate} 萬` : "—");

function Source({ r }: { r: Submission }) {
  return r.source === "web" ? (
    <span title="網站投稿，已人工審核" className="text-data">
      <CheckBadge />
      <span className="sr-only">網站投稿・已審核</span>
    </span>
  ) : (
    <span title="原始表單，未驗證" className="text-ink-3">
      <DocIcon />
      <span className="sr-only">原始表單・未驗證</span>
    </span>
  );
}

function Flags({ r, recentFromYear }: { r: Submission; recentFromYear: number }) {
  return (
    <>
      {r.flags.includes("outlier") && <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-ink-2">疑似填錯・未計入</span>}
      {r.year != null && r.year < recentFromYear && <span className="text-xs text-ink-3">{r.year} 年</span>}
    </>
  );
}

const Select = ({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) => (
  <label className="flex items-center gap-1.5 text-sm text-ink-2">
    <span className="sr-only sm:not-sr-only">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-border bg-surface px-2 py-1.5 text-ink">
      {children}
    </select>
  </label>
);

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
  // Set on cross-company lists so each entry names its company.
  companyNames?: Record<string, string>;
  filters?: { id: string; label: string; match: string[] }[];
}) {
  const [group, setGroup] = useState("all");
  const [role, setRole] = useState("all");
  const [level, setLevel] = useState("all");
  const [recent, setRecent] = useState(false);
  const [sort, setSort] = useState("date");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<string | null>(null);

  const roleOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.role, (counts.get(r.role) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const list = useMemo(() => {
    const allowed = filters?.find((f) => f.id === group)?.match;
    const out = rows.filter(
      (r) =>
        (!allowed || allowed.includes(r.id)) &&
        (role === "all" || r.role === role) &&
        (level === "all" || r.level === level) &&
        (!recent || (r.year ?? 0) >= recentFromYear),
    );
    const byPay = (a: Submission, b: Submission) => (a.monthly ?? -1) - (b.monthly ?? -1);
    if (sort === "high") out.sort((a, b) => byPay(b, a));
    else if (sort === "low") out.sort((a, b) => (a.monthly == null ? 1 : b.monthly == null ? -1 : byPay(a, b)));
    else out.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    return out;
  }, [rows, filters, group, role, level, recent, sort, recentFromYear]);

  const reset = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setShown(PAGE);
  };
  const title = (r: Submission) => r.roleRaw ?? roleLabels[r.role];
  const company = (r: Submission) =>
    companyNames &&
    (r.company ? (
      <Link href={`/companies/${r.company}/`} className="text-accent hover:underline">
        {companyNames[r.company]}
      </Link>
    ) : (
      <span className="text-ink-2">{r.companyRaw}</span>
    ));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {filters && (
          <div className="flex gap-1" role="group" aria-label="類別">
            {[{ id: "all", label: "全部" }, ...filters].map((f) => (
              <button
                key={f.id}
                onClick={() => reset(setGroup)(f.id)}
                aria-pressed={group === f.id}
                className={`rounded-full border px-3 py-1 text-sm ${group === f.id ? "border-accent bg-accent-soft text-ink" : "border-border text-ink-2 hover:text-ink"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        <Select label="職務" value={role} onChange={reset(setRole)}>
          <option value="all">所有職務</option>
          {roleOptions.map(([id, n]) => (
            <option key={id} value={id}>
              {roleLabels[id]}（{n}）
            </option>
          ))}
        </Select>
        <Select label="年資" value={level} onChange={reset(setLevel)}>
          <option value="all">所有年資</option>
          {LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </Select>
        <Select label="排序" value={sort} onChange={setSort}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" checked={recent} onChange={(e) => reset((v) => setRecent(v === "1"))(e.target.checked ? "1" : "0")} />
          只看 {recentFromYear} 年後
        </label>
        <span className="tabular ml-auto text-sm text-ink-3">{list.length} 筆</span>
      </div>

      {list.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-ink-2">
          沒有符合條件的分享。放寬篩選條件，或
          <Link href="/submit/" className="text-accent underline">
            分享你的薪資
          </Link>
          。
        </p>
      )}

      {/* Desktop: dense table, comment expands inline. */}
      {list.length > 0 && (
        <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 font-normal">{companyNames ? "公司／職務" : "職務"}</th>
                <th className="px-3 py-2 text-right font-normal">年資</th>
                <th className="px-3 py-2 text-right font-normal">月底薪</th>
                <th className="px-3 py-2 text-right font-normal">Bonus</th>
                <th className="px-3 py-2 text-right font-normal">總年薪</th>
                <th className="px-3 py-2 text-right font-normal">工時</th>
                <th className="px-3 py-2 text-right font-normal">爽度／Loading</th>
                <th className="px-3 py-2 text-right font-normal">日期</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {list.slice(0, shown).map((r) => {
                const hasNote = Boolean(r.comment || r.certifications || r.interviewTopics);
                return (
                  <FragmentRow key={r.id}>
                    <tr className="cursor-pointer border-t border-border hover:bg-surface-2" onClick={() => setOpen(open === r.id ? null : r.id)}>
                      <td className="px-3 py-2.5 font-sans">
                        <div className="flex items-center gap-2">
                          <Source r={r} />
                          <span className="min-w-0">
                            {company(r)}
                            {companyNames && <span className="text-ink-3">・</span>}
                            {title(r)}
                            {r.levelRaw && <span className="ml-1.5 text-xs text-ink-3">{r.levelRaw}</span>}
                          </span>
                          <Flags r={r} recentFromYear={recentFromYear} />
                          <button className={`ml-auto shrink-0 text-xs ${hasNote ? "text-accent" : "text-ink-3"}`} aria-expanded={open === r.id}>
                            {open === r.id ? "收合" : hasNote ? "心得" : "詳情"}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">{v(r.yoe)}</td>
                      <td className="px-3 py-2.5 text-right text-base font-semibold">{v(r.monthly, " 萬")}</td>
                      <td className="px-3 py-2.5 text-right">{v(r.bonusMonths, " 個月")}</td>
                      <td className="px-3 py-2.5 text-right">{annualText(r)}</td>
                      <td className="px-3 py-2.5 text-right">{v(r.hoursPerDay, "h")}</td>
                      <td className="px-3 py-2.5 text-right">
                        {v(r.happiness)}／{v(r.loading)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-ink-3">{r.date ?? "—"}</td>
                    </tr>
                    {open === r.id && (
                      <tr className="bg-surface-2/60">
                        <td colSpan={8} className="px-4 pt-1 pb-3 text-sm">
                          <Details r={r} />
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Phones: one card per entry, headline number first. */}
      <ul className="space-y-3 md:hidden">
        {list.slice(0, shown).map((r) => (
          <li key={r.id} className="rounded-xl border border-border bg-surface p-4">
            {companyNames && <div className="mb-0.5 text-sm">{company(r)}</div>}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-medium">
                  <Source r={r} />
                  <span className="truncate">{title(r)}</span>
                </div>
                <div className="tabular text-xs text-ink-3">
                  年資 {v(r.yoe, " 年")}
                  {r.levelRaw && `・${r.levelRaw}`}
                  {r.date && `・${r.date}`}
                </div>
              </div>
              <div className="num shrink-0 text-right text-2xl font-semibold">
                {v(r.monthly)}
                <span className="ml-0.5 font-sans text-xs font-normal text-ink-2">萬</span>
              </div>
            </div>
            <div className="tabular mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
              <span>Bonus {v(r.bonusMonths, " 個月")}</span>
              <span>年薪 {annualText(r)}</span>
              <span>工時 {v(r.hoursPerDay, "h")}</span>
              <span>
                爽度 {v(r.happiness)}／Loading {v(r.loading)}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              <Flags r={r} recentFromYear={recentFromYear} />
            </div>
            <div className="mt-2 text-sm">
              <Details r={r} />
            </div>
          </li>
        ))}
      </ul>

      {list.length > shown && (
        <button onClick={() => setShown((s) => s + PAGE)} className="mt-4 w-full rounded-xl border border-border bg-surface py-2.5 text-sm text-ink-2 hover:text-ink">
          顯示更多（還有 {list.length - shown} 筆）
        </button>
      )}
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Details({ r }: { r: Submission }) {
  return (
    <div className="space-y-1">
      {r.certifications && <p>證照：{r.certifications}</p>}
      {r.interviewTopics && <p>面試題型：{r.interviewTopics}</p>}
      {r.comment && <p className="whitespace-pre-line text-ink-2">{r.comment}</p>}
      {r.commentHidden && <p className="text-xs text-ink-3">此則心得含針對個人的貶損字眼，已隱藏。</p>}
      <Link href={`/report/?kind=error&target=${encodeURIComponent(r.id)}`} className="inline-block text-xs text-ink-3 hover:text-accent" onClick={(e) => e.stopPropagation()}>
        回報這筆資料
      </Link>
    </div>
  );
}
