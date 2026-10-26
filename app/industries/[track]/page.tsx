import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceCurve } from "@/components/charts/ExperienceCurve";
import { SalaryDistribution } from "@/components/charts/SalaryDistribution";
import { CompanyTable } from "@/components/CompanyTable";
import { RangeBar } from "@/components/RangeBar";
import { SectionTabs } from "@/components/SectionTabs";
import { StatsHero } from "@/components/StatsHero";
import { companies, fmtWan, meta, roleLabel, TRACK_IDS, tracks } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return TRACK_IDS.map((track) => ({ track }));
}

type Props = { params: Promise<{ track: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { track } = await params;
  const t = tracks.find((x) => x.id === track);
  if (!t?.stats) return {};
  return {
    title: `${t.label}薪資`,
    description: `台灣${t.label}薪資：月底薪中位數 ${t.stats.monthly?.median} 萬、總年薪中位數 ${t.stats.annual?.median} 萬，${t.stats.n} 筆匿名分享，依公司、職務、年資比較。`,
    alternates: { canonical: `/industries/${t.id}/` },
  };
}

export default async function IndustryPage({ params }: Props) {
  const { track } = await params;
  const t = tracks.find((x) => x.id === track);
  if (!t?.stats) notFound();
  const list = companies.filter((c) => c.track === t.id && c.stats);
  const roleMax = Math.max(...t.roles.map((r) => r.stats.monthly?.p75 ?? 0), 1) * 1.05;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black sm:text-4xl">{t.label}薪資</h1>
        <p className="mt-2 text-ink-2">
          {t.stats.n.toLocaleString()} 筆分享，{list.length} 間公司資料達 {meta.minN} 筆以上。
        </p>
      </header>

      <StatsHero heading={`${t.label} 薪資條`} stats={t.stats} recent={t.recentStats} recentFromYear={meta.recentFromYear} />

      <SectionTabs
        sections={[
          { id: "distribution", label: "薪資分布" },
          { id: "experience", label: "年資" },
          { id: "roles", label: "職務" },
          { id: "companies", label: `公司（${list.length}）` },
        ]}
      />

      <section id="distribution" className="scroll-mt-28">
        <SalaryDistribution values={t.monthlyValues} scope={t.label} />
      </section>

      <section id="experience" className="scroll-mt-28">
        <ExperienceCurve points={t.curve} title={`${t.label}：年資與月底薪`} />
      </section>

      <section id="roles" className="scroll-mt-28">
        <h2 className="mb-3 text-xl font-bold">各職務</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-surface-2 text-left text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 font-normal">職務</th>
                <th className="px-3 py-2 text-right font-normal">筆數</th>
                <th className="px-3 py-2 font-normal">月底薪分布（色帶 P25–P75，直線中位數）</th>
                <th className="px-3 py-2 text-right font-normal">月薪中位數</th>
                <th className="px-3 py-2 text-right font-normal">年薪中位數</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {[...t.roles]
                .sort((a, b) => b.stats.n - a.stats.n)
                .map((r) => (
                  <tr key={r.role} className="border-t border-border hover:bg-surface-2/60">
                    <td className="px-3 py-2.5 font-sans">
                      <Link href={`/roles/${r.role}/`} className="hover:text-accent">
                        {roleLabel(r.role)}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-right text-ink-2">{r.stats.n}</td>
                    <td className="w-1/3 px-3 py-2.5">
                      <RangeBar dist={r.stats.monthly} max={roleMax} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold">{fmtWan(r.stats.monthly?.median)}</td>
                    <td className="px-3 py-2.5 text-right">{fmtWan(r.stats.annual?.median, 0)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="companies" className="scroll-mt-28">
        <h2 className="mb-3 text-xl font-bold">公司</h2>
        <CompanyTable companies={list} recentFromYear={meta.recentFromYear} />
      </section>
    </div>
  );
}
