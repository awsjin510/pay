import { YearMix } from "@/components/DataNotes";
import { Payslip, type PayslipRow } from "@/components/Payslip";
import type { Stats } from "@/lib/data";

const Fact = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 last:border-0">
    <dt className="text-sm text-ink-2">{label}</dt>
    <dd className="text-right">
      <span className="num text-lg font-semibold">{value}</span>
      {hint && <span className="ml-1 text-xs text-ink-3">{hint}</span>}
    </dd>
  </div>
);

// Payslip summary on the left, workload facts on the right — the top of every stats page.
export function StatsHero({
  heading,
  stats,
  extraRows = [],
  recent,
  recentFromYear,
  footnote,
  children,
}: {
  heading: string;
  stats: Stats;
  extraRows?: PayslipRow[];
  recent?: Stats | null;
  recentFromYear: number;
  footnote?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const rows: PayslipRow[] = [];
  if (stats.monthly) rows.push({ label: "月底薪（中位數）", value: String(stats.monthly.median), unit: "萬", emphasis: true, note: `中間一半落在 ${stats.monthly.p25}–${stats.monthly.p75} 萬` });
  if (stats.bonusMonths) rows.push({ label: "年終＋獎金", value: String(stats.bonusMonths.median), unit: "個月", note: "不含分紅" });
  if (stats.annual) rows.push({ label: "總年薪（中位數）", value: String(stats.annual.median), unit: "萬", note: "含分紅，自行回報" });
  rows.push(...extraRows);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <Payslip animate heading={heading} sub={`${stats.n.toLocaleString()} 筆分享`} rows={rows} footnote={footnote} />
      <div className="flex flex-col gap-4">
        <dl className="rounded-xl border border-border bg-surface px-4 py-1">
          {stats.hoursPerDay && <Fact label="每日工時" value={String(stats.hoursPerDay.median)} hint="小時" />}
          {stats.overtimePerMonth && <Fact label="每月加班" value={String(stats.overtimePerMonth.median)} hint="小時" />}
          {stats.happiness != null && <Fact label="爽度" value={String(stats.happiness)} hint="／5，越高越爽" />}
          {stats.loading != null && <Fact label="Loading" value={String(stats.loading)} hint="／5，越高越重" />}
          {recent?.monthly && <Fact label={`${recentFromYear} 年後月底薪`} value={String(recent.monthly.median)} hint={`萬（${recent.n} 筆）`} />}
        </dl>
        <YearMix stats={stats} />
        {children}
      </div>
    </section>
  );
}
