import type { PayslipRow } from "@/components/Payslip";
import { OVERTIME_PAY_LABELS, type Estimate, type OvertimePay, type Stats } from "@/lib/data";

// The 推估 row of a payslip: reported pay grown to this year, labelled as an estimate.
export function estimateRow(e: Estimate | null | undefined): PayslipRow[] {
  if (!e) return [];
  return [
    {
      label: `推估 ${e.year} 月底薪`,
      value: `約 ${e.monthly}`,
      unit: "萬",
      estimate: true,
      note: `資料以 ${e.medianYear} 年為主，依上市櫃非主管薪資年增 ${e.growth}% 換算，不是實際回報`,
    },
  ];
}

const Fact = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 last:border-0">
    <dt className="text-sm text-ink-2">{label}</dt>
    <dd className="text-right">
      <span className="num text-lg font-semibold">{value}</span>
      {hint && <span className="ml-1 text-xs text-ink-3">{hint}</span>}
    </dd>
  </div>
);

// Structured fields from web submissions (each shown once 3+ people answered it).
export function ConditionFacts({ stats }: { stats: Stats }) {
  const ot = stats.overtimePay;
  const otTotal = ot ? Object.values(ot).reduce((a, b) => a + b, 0) : 0;
  const otTop = ot ? (Object.entries(ot) as [OvertimePay, number][]).sort((a, b) => b[1] - a[1])[0] : null;
  const facts = [
    stats.weeklyHours && <Fact key="wh" label="每週實際工時" value={String(stats.weeklyHours.median)} hint={`小時（${stats.weeklyHours.n} 人）`} />,
    otTop && otTop[1] > 0 && <Fact key="ot" label="加班費" value={OVERTIME_PAY_LABELS[otTop[0]]} hint={`${Math.round((otTop[1] / otTotal) * 100)}%（${otTotal} 人）`} />,
    stats.remoteDays && <Fact key="rd" label="每週可遠端" value={String(stats.remoteDays.median)} hint={`天（${stats.remoteDays.n} 人）`} />,
    stats.leaveDays && <Fact key="ld" label="每年特休" value={String(stats.leaveDays.median)} hint={`天（${stats.leaveDays.n} 人）`} />,
    stats.profitSharing && <Fact key="ps" label="員工酬勞／分紅" value={String(stats.profitSharing.median)} hint={`萬／年（${stats.profitSharing.n} 人）`} />,
    stats.stockYearly && <Fact key="st" label="股票" value={String(stats.stockYearly.median)} hint={`萬／年（${stats.stockYearly.n} 人）`} />,
    stats.signOn && <Fact key="so" label="簽約金" value={String(stats.signOn.median)} hint={`萬（${stats.signOn.n} 人）`} />,
  ].filter(Boolean);
  if (!facts.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-4 pt-3 pb-1">
      <h2 className="text-sm font-medium">薪酬組成與工作條件</h2>
      <dl>{facts}</dl>
    </div>
  );
}
