import { RangeBar, StatTile } from "@/components/RangeBar";
import { fmtNum, fmtWan, levelLabel, meta, type Stats } from "@/lib/data";

export function StatsTiles({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatTile label="月底薪中位數" value={fmtWan(stats.monthly?.median)} sub={stats.monthly ? `P25–P75：${stats.monthly.p25}–${stats.monthly.p75} 萬` : undefined} />
      <StatTile label="總年薪中位數" value={fmtWan(stats.annual?.median, 0)} sub={stats.annual ? `P25–P75：${stats.annual.p25}–${stats.annual.p75} 萬` : undefined} />
      <StatTile label="Bonus 中位數" value={stats.bonusMonths ? `${stats.bonusMonths.median} 個月` : "—"} sub="年終＋獎金（不含分紅）" />
      <StatTile label="資料筆數" value={stats.n.toLocaleString()} sub={`${meta.recentFromYear} 年後 ${stats.recentN} 筆`} />
      <StatTile label="每日工時中位數" value={stats.hoursPerDay ? `${stats.hoursPerDay.median} 小時` : "—"} />
      <StatTile label="每月加班中位數" value={stats.overtimePerMonth ? `${stats.overtimePerMonth.median} 小時` : "—"} />
      <StatTile label="爽度（1–5）" value={fmtNum(stats.happiness)} sub="5 最爽" />
      <StatTile label="Loading（1–5）" value={fmtNum(stats.loading)} sub="5 最重" />
    </div>
  );
}

export function LevelTable({ stats }: { stats: Stats }) {
  const rows = stats.byLevel.filter((l) => l.n > 0);
  const max = Math.max(...rows.map((l) => l.monthly?.p75 ?? 0), 1) * 1.1;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-ink-2">
        <tr>
          <th className="py-2 font-normal">年資</th>
          <th className="py-2 text-right font-normal">筆數</th>
          <th className="py-2 pl-4 font-normal">月底薪分布（P25–P75，直線為中位數）</th>
          <th className="py-2 text-right font-normal">月薪中位數</th>
          <th className="py-2 text-right font-normal">年薪中位數</th>
        </tr>
      </thead>
      <tbody className="tabular">
        {rows.map((l) => (
          <tr key={l.level} className="border-t border-border">
            <td className="py-2">{levelLabel(l.level)}</td>
            <td className="py-2 text-right text-ink-2">{l.n}</td>
            <td className="w-1/3 py-2 pl-4">
              <RangeBar dist={l.monthly} max={max} />
            </td>
            <td className="py-2 text-right">{fmtWan(l.monthly?.median)}</td>
            <td className="py-2 text-right">{fmtWan(l.annual?.median, 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
