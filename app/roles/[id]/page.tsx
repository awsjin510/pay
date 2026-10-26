import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { YearMix } from "@/components/DataNotes";
import { OccupationRef } from "@/components/OccupationRef";
import { PercentileTool } from "@/components/PercentileTool";
import { RangeBar } from "@/components/RangeBar";
import { LevelTable, StatsTiles } from "@/components/StatsOverview";
import { fmtWan, roles, trackLabel } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return roles.filter((r) => r.stats).map((r) => ({ id: r.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = roles.find((x) => x.id === id);
  if (!r?.stats) return {};
  return {
    title: `${r.label}薪資`,
    description: `${r.label}薪資行情：月底薪中位數 ${r.stats.monthly?.median ?? "—"} 萬、總年薪中位數 ${r.stats.annual?.median ?? "—"} 萬，${r.stats.n} 筆分享，依產業、年資與公司比較。`,
    alternates: { canonical: `/roles/${r.id}/` },
  };
}

export default async function RolePage({ params }: Props) {
  const { id } = await params;
  const r = roles.find((x) => x.id === id);
  if (!r?.stats) notFound();
  const byTrack = r.byTrack.filter((t) => t.stats);
  const max = Math.max(...byTrack.map((t) => t.stats!.monthly?.p75 ?? 0), ...r.topCompanies.map((c) => c.monthly?.p75 ?? 0), 1) * 1.05;

  return (
    <div className="space-y-10">
      <header>
        <div className="text-sm text-ink-2">
          <Link href="/roles/" className="hover:text-ink">
            職務
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{r.label}</h1>
      </header>

      <div className="space-y-2">
        <StatsTiles stats={r.stats} />
        <YearMix stats={r.stats} />
      </div>

      {r.officialRef && <OccupationRef data={r.officialRef} crowdMonthly={r.stats.monthly?.median} />}

      <PercentileTool values={r.monthlyValues} scope={r.label} />

      <section>
        <h2 className="mb-3 text-lg font-semibold">依產業</h2>
        <div className="rounded-lg border border-border bg-surface p-4">
          <table className="w-full text-sm">
            <tbody className="tabular">
              {byTrack.map((t) => (
                <tr key={t.track} className="border-t border-border first:border-t-0">
                  <td className="py-2">{trackLabel(t.track)}</td>
                  <td className="py-2 text-right text-ink-2">{t.stats!.n} 筆</td>
                  <td className="w-1/3 py-2 pl-4">
                    <RangeBar dist={t.stats!.monthly} max={max} />
                  </td>
                  <td className="py-2 text-right">{fmtWan(t.stats!.monthly?.median)}</td>
                  <td className="py-2 text-right">{fmtWan(t.stats!.annual?.median, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">依年資</h2>
        <div className="rounded-lg border border-border bg-surface p-4">
          <LevelTable stats={r.stats} />
        </div>
      </section>

      {r.topCompanies.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">月底薪中位數最高的公司</h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-[480px] text-sm">
              <tbody className="tabular">
                {r.topCompanies.map((c) => (
                  <tr key={c.slug} className="border-t border-border first:border-t-0">
                    <td className="px-3 py-2">
                      <Link href={`/companies/${c.slug}/`} className="hover:text-accent">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right text-ink-2">{c.n} 筆</td>
                    <td className="w-1/3 px-3 py-2">
                      <RangeBar dist={c.monthly} max={max} />
                    </td>
                    <td className="px-3 py-2 text-right">{fmtWan(c.monthly?.median)}</td>
                    <td className="px-3 py-2 text-right">{fmtWan(c.annual?.median, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
