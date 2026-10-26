import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyTable } from "@/components/CompanyTable";
import { RangeBar } from "@/components/RangeBar";
import { LevelTable, StatsTiles } from "@/components/StatsOverview";
import { companies, fmtWan, meta, roleLabel, TRACK_IDS, tracks } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return TRACK_IDS.map((track) => ({ track }));
}

type Props = { params: Promise<{ track: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track } = await params;
  const t = tracks.find((x) => x.id === track);
  return { title: t ? `${t.label}薪資` : undefined };
}

export default async function IndustryPage({ params }: Props) {
  const { track } = await params;
  const t = tracks.find((x) => x.id === track);
  if (!t?.stats) notFound();
  const list = companies.filter((c) => c.track === t.id && c.stats);
  const roleMax = Math.max(...t.roles.map((r) => r.stats.monthly?.p75 ?? 0), 1) * 1.05;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold">{t.label}薪資</h1>
        <p className="mt-1 text-sm text-ink-2">
          {t.stats.n.toLocaleString()} 筆資料，其中 {list.length} 間公司資料達 {meta.minN} 筆以上。
        </p>
      </header>

      <StatsTiles stats={t.stats} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">依年資</h2>
        <div className="rounded-lg border border-border bg-surface p-4">
          <LevelTable stats={t.stats} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">依職務</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 font-normal">職務</th>
                <th className="px-3 py-2 text-right font-normal">筆數</th>
                <th className="px-3 py-2 font-normal">月底薪分布</th>
                <th className="px-3 py-2 text-right font-normal">月薪中位數</th>
                <th className="px-3 py-2 text-right font-normal">年薪中位數</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {[...t.roles]
                .sort((a, b) => b.stats.n - a.stats.n)
                .map((r) => (
                  <tr key={r.role} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link href={`/roles/${r.role}/`} className="hover:text-accent">
                        {roleLabel(r.role)}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right text-ink-2">{r.stats.n}</td>
                    <td className="w-1/3 px-3 py-2">
                      <RangeBar dist={r.stats.monthly} max={roleMax} />
                    </td>
                    <td className="px-3 py-2 text-right">{fmtWan(r.stats.monthly?.median)}</td>
                    <td className="px-3 py-2 text-right">{fmtWan(r.stats.annual?.median, 0)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">公司列表</h2>
        <CompanyTable companies={list} recentFromYear={meta.recentFromYear} />
      </section>
    </div>
  );
}
