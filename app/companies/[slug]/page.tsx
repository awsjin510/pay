import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { OfficialPay, YearMix } from "@/components/DataNotes";
import { PercentileTool } from "@/components/PercentileTool";
import { LevelTable, StatsTiles } from "@/components/StatsOverview";
import { SubmissionList } from "@/components/SubmissionList";
import { companies, companyBySlug, describeCompany, meta, nicknamesOf, SITE_URL, submissions, trackLabel } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = companyBySlug((await params).slug);
  if (!c) return {};
  const nick = nicknamesOf(c);
  return {
    title: `${c.name}${nick.length ? `（${nick.join("、")}）` : ""}薪資`,
    description: describeCompany(c),
    alternates: { canonical: `/companies/${c.slug}/` },
    // Pages with a single entry and no official data add little; keep them out of search.
    robots: c.n < meta.minN && !c.official ? { index: false } : undefined,
  };
}

export default async function CompanyPage({ params }: Props) {
  const c = companyBySlug((await params).slug);
  if (!c) notFound();
  const rows = submissions.filter((s) => s.company === c.slug);
  const nick = nicknamesOf(c);

  return (
    <div className="space-y-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: trackLabel(c.track), item: `${SITE_URL}/industries/${c.track}/` },
            { "@type": "ListItem", position: 2, name: `${c.name}薪資`, item: `${SITE_URL}/companies/${c.slug}/` },
          ],
        }}
      />
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
        {nick.length > 0 && <p className="mt-1 text-sm text-ink-2">PTT 代號：{nick.join("、")}</p>}
        {c.aliases.length > 0 && <p className="mt-1 text-xs text-ink-3">也被填作：{c.aliases.join("、")}</p>}
        <p className="mt-2 text-sm">
          <Link href={`/compare/?c=${c.slug}`} className="text-accent hover:underline">
            和其他公司比較 →
          </Link>
        </p>
      </header>

      <OfficialPay company={c} />

      {c.stats ? (
        <>
          <div className="space-y-2">
            <StatsTiles stats={c.stats} />
            <YearMix stats={c.stats} />
          </div>
          {c.recentStats?.monthly && (
            <p className="text-sm text-ink-2">
              只看 {meta.recentFromYear} 年後（{c.recentStats.n} 筆）：月底薪中位數 {c.recentStats.monthly.median} 萬
              {c.recentStats.annual && `，總年薪中位數 ${c.recentStats.annual.median} 萬`}。
            </p>
          )}
          <PercentileTool values={c.monthlyValues} scope={c.name} />
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
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">每筆分享（{rows.length}）</h2>
          <Link href="/submit/" className="text-sm text-accent hover:underline">
            分享我的薪資 →
          </Link>
        </div>
        <SubmissionList rows={rows} recentFromYear={meta.recentFromYear} roleLabels={meta.roleLabels} />
      </section>
    </div>
  );
}
