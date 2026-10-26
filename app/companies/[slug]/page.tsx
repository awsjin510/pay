import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LevelTable, StatsTiles } from "@/components/StatsOverview";
import { SubmissionList } from "@/components/SubmissionList";
import { companies, companyBySlug, meta, submissions, trackLabel } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = companyBySlug((await params).slug);
  return { title: c ? `${c.name}薪資` : undefined };
}

export default async function CompanyPage({ params }: Props) {
  const c = companyBySlug((await params).slug);
  if (!c) notFound();
  const rows = submissions.filter((s) => s.company === c.slug);

  return (
    <div className="space-y-10">
      <header>
        <div className="text-sm text-ink-2">
          <Link href={`/industries/${c.track}/`} className="hover:text-ink">
            {trackLabel(c.track)}
          </Link>
        </div>
        <h1 className="mt-1 text-2xl font-semibold">
          {c.name}
          {c.en && c.en !== c.name && <span className="ml-2 text-lg font-normal text-ink-3">{c.en}</span>}
        </h1>
        {c.aliases.length > 0 && <p className="mt-1 text-xs text-ink-3">也被填作：{c.aliases.join("、")}</p>}
      </header>

      {c.stats ? (
        <>
          <StatsTiles stats={c.stats} />
          {c.recentStats?.monthly && (
            <p className="text-sm text-ink-2">
              只看 {meta.recentFromYear} 年後（{c.recentStats.n} 筆）：月底薪中位數 {c.recentStats.monthly.median} 萬
              {c.recentStats.annual && `，總年薪中位數 ${c.recentStats.annual.median} 萬`}。
            </p>
          )}
          <section>
            <h2 className="mb-3 text-lg font-semibold">依年資</h2>
            <div className="rounded-lg border border-border bg-surface p-4">
              <LevelTable stats={c.stats} />
            </div>
          </section>
        </>
      ) : (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-2">
          這間公司只有 {c.n} 筆資料，未達 {meta.minN} 筆，不顯示統計數字，以免誤導或識別出填寫者。
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">每筆分享（{rows.length}）</h2>
        <SubmissionList rows={rows} recentFromYear={meta.recentFromYear} roleLabels={meta.roleLabels} />
      </section>
    </div>
  );
}
