import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperienceCurve } from "@/components/charts/ExperienceCurve";
import { SalaryDistribution } from "@/components/charts/SalaryDistribution";
import { YearMix } from "@/components/DataNotes";
import { JsonLd } from "@/components/JsonLd";
import { Payslip, type PayslipRow } from "@/components/Payslip";
import { SectionTabs } from "@/components/SectionTabs";
import { SubmissionList } from "@/components/SubmissionList";
import { confidenceOf, ThinCompany } from "@/components/ThinCompany";
import { TrackView } from "@/components/TrackView";
import { companies, companyBySlug, describeCompany, INDUSTRY_LABELS, meta, nicknamesOf, SITE_URL, submissions, trackLabel, tracks } from "@/lib/data";

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

const Fact = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 last:border-0">
    <dt className="text-sm text-ink-2">{label}</dt>
    <dd className="text-right">
      <span className="num text-lg font-semibold">{value}</span>
      {hint && <span className="ml-1 text-xs text-ink-3">{hint}</span>}
    </dd>
  </div>
);

export default async function CompanyPage({ params }: Props) {
  const c = companyBySlug((await params).slug);
  if (!c) notFound();
  const rows = submissions.filter((s) => s.company === c.slug);
  const nick = nicknamesOf(c);
  const s = c.stats;
  const o = c.official;

  const slip: PayslipRow[] = [];
  if (s?.monthly) {
    slip.push({ label: "月底薪（中位數）", value: String(s.monthly.median), unit: "萬", emphasis: true, note: `中間一半落在 ${s.monthly.p25}–${s.monthly.p75} 萬` });
  }
  if (s?.bonusMonths) slip.push({ label: "年終＋獎金", value: String(s.bonusMonths.median), unit: "個月", note: "不含分紅" });
  if (s?.annual) slip.push({ label: "總年薪（中位數）", value: String(s.annual.median), unit: "萬", note: "含分紅，自行回報" });
  if (o) slip.push({ label: `非主管薪資中位數`, value: String(o.median), unit: "萬", official: true, note: `${o.year} 年全年，公開資訊觀測站` });

  // For thin pages: companies in the same 產業別 (or track) that do have statistics.
  const peers = (pred: (x: (typeof companies)[number]) => boolean) =>
    companies.filter((x) => x.slug !== c.slug && x.stats?.monthly && pred(x)).sort((a, b) => b.n - a.n).slice(0, 6);
  const sameIndustry = o?.industry ? peers((x) => x.official?.industry === o.industry) : [];
  const byIndustry = sameIndustry.length >= 3;
  const similar = s ? [] : byIndustry ? sameIndustry : peers((x) => x.track === c.track && (!c.sector || x.sector === c.sector));
  const similarLabel = byIndustry ? "同產業別的上市櫃公司" : `${trackLabel(c.track)}中資料較多的公司`;
  const confidence = confidenceOf(c);

  const sections = [
    ...(s ? [{ id: "distribution", label: "薪資分布" }] : []),
    ...(c.curve.some((p) => p.monthly) ? [{ id: "experience", label: "年資" }] : []),
    { id: "entries", label: `每筆分享（${rows.length}）` },
  ];

  return (
    <div className="space-y-8">
      <TrackView name={s ? "answer_view" : "thin_view"} scope={s ? `company:${confidence === "高" ? "high" : "medium"}` : "company"} />
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
        <nav className="text-sm text-ink-2" aria-label="麵包屑">
          <Link href={`/industries/${c.track}/`} className="hover:text-ink">
            {trackLabel(c.track)}
          </Link>
          {o?.industry && INDUSTRY_LABELS[o.industry] && (
            <>
              <span className="mx-1.5 text-ink-3">/</span>
              <Link href="/sectors/it-services/" className="hover:text-ink">
                {INDUSTRY_LABELS[o.industry]}
              </Link>
            </>
          )}
        </nav>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">
          {c.name}
          {c.en && c.en !== c.name && <span className="ml-3 text-xl font-medium text-ink-3">{c.en}</span>}
        </h1>
        {nick.length > 0 && <p className="mt-1 text-ink-2">PTT 代號：{nick.join("、")}</p>}
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {slip.length > 0 ? (
          <Payslip
            animate
            heading={`${c.name} 薪資條`}
            sub={s ? `${c.n} 筆分享，可信度${confidence}` : `${c.n} 筆分享`}
            rows={slip}
            footnote={
              o && s?.annual
                ? "官方數字是全公司非主管員工的全年薪資，本站是依職務自行回報，兩者定義不同，請互相參照。"
                : "數字為匿名自行回報的中位數，未逐筆驗證。"
            }
          />
        ) : (
          <ThinCompany company={c} similar={similar} similarLabel={similarLabel} track={tracks.find((t) => t.id === c.track)} />
        )}

        <div className="flex flex-col gap-4">
          {s && (
            <dl className="rounded-xl border border-border bg-surface px-4 py-1">
              {s.hoursPerDay && <Fact label="每日工時" value={String(s.hoursPerDay.median)} hint="小時" />}
              {s.overtimePerMonth && <Fact label="每月加班" value={String(s.overtimePerMonth.median)} hint="小時" />}
              {s.happiness != null && <Fact label="爽度" value={String(s.happiness)} hint="／5，越高越爽" />}
              {s.loading != null && <Fact label="Loading" value={String(s.loading)} hint="／5，越高越重" />}
              {c.recentStats?.monthly && (
                <Fact label={`${meta.recentFromYear} 年後月底薪`} value={String(c.recentStats.monthly.median)} hint={`萬（${c.recentStats.n} 筆）`} />
              )}
            </dl>
          )}
          {s && <YearMix stats={s} />}
          {!s && slip.length > 0 && <ThinCompany company={c} similar={similar} similarLabel={similarLabel} track={tracks.find((t) => t.id === c.track)} />}
          {c.offers && (
            <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
              近期收到的 offer：{c.offers.n} 筆
              {c.offers.median != null && <span className="num ml-1 font-semibold">中位數 {c.offers.median} 萬</span>}
              {c.offers.latest && <span className="ml-1 text-ink-3">（最新 {c.offers.latest}）</span>}
              <span className="block text-xs text-ink-3">offer 是公司開出的條件，和實領薪資分開統計。</span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href={`/offer/?company=${c.slug}`} className="rounded-xl border border-border bg-surface px-3.5 py-2 text-sm hover:border-accent">
              這間的 offer 合理嗎？
            </Link>
            <Link href={`/compare/?c=${c.slug}`} className="rounded-xl border border-border bg-surface px-3.5 py-2 text-sm hover:border-accent">
              和其他公司比較
            </Link>
            <Link href={`/submit/?company=${c.slug}`} className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-ink hover:opacity-90">
              分享我在{c.name}的薪資
            </Link>
          </div>
          {c.aliases.length > 0 && (
            <details className="text-xs text-ink-3">
              <summary className="cursor-pointer">也被填作 {c.aliases.length} 種寫法</summary>
              <p className="mt-1">{c.aliases.join("、")}</p>
            </details>
          )}
        </div>
      </section>

      <SectionTabs sections={sections} />

      {s && (
        <section id="distribution" className="scroll-mt-28">
          <SalaryDistribution values={c.monthlyValues} scope={c.name} />
        </section>
      )}

      {c.curve.some((p) => p.monthly) && (
        <section id="experience" className="scroll-mt-28">
          <ExperienceCurve points={c.curve} title={`${c.name}：年資與月底薪`} />
        </section>
      )}

      <section id="entries" className="scroll-mt-28">
        <h2 className="mb-3 text-xl font-bold">每筆分享</h2>
        <SubmissionList rows={rows} recentFromYear={meta.recentFromYear} roleLabels={meta.roleLabels} />
      </section>
    </div>
  );
}
