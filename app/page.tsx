import type { Metadata } from "next";
import Link from "next/link";
import { CompanySearch } from "@/components/CompanySearch";
import { JsonLd } from "@/components/JsonLd";
import { Payslip } from "@/components/Payslip";
import { companies, companyBySlug, fmtWan, itServices, meta, roleLabel, sectors, SITE_URL, submissions, tracks, type Stats } from "@/lib/data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Shortcuts people actually type: a big name, an English name, a PTT nickname.
const POPULAR = [
  { label: "聯發科", slug: "mediatek" },
  { label: "螃蟹", slug: "realtek" },
  { label: "華碩", slug: "asus" },
  { label: "趨勢科技", slug: "trend-micro" },
  { label: "Google", slug: "google" },
  { label: "台達電", slug: "delta" },
];

function LedgerRow({ href, label, note, stats }: { href: string; label: string; note: string; stats: Stats | null }) {
  return (
    <li>
      <Link href={href} className="group flex items-baseline gap-2 px-1 py-3.5 hover:bg-surface-2/60">
        <span className="font-medium group-hover:text-accent">{label}</span>
        <span className="hidden text-xs text-ink-3 sm:inline">{note}</span>
        <span className="leader" aria-hidden="true" />
        <span className="num text-2xl font-semibold">{stats?.monthly?.median ?? "—"}</span>
        <span className="text-sm text-ink-2">萬</span>
        <span className="tabular hidden w-28 text-right text-sm text-ink-3 md:inline">年薪 {fmtWan(stats?.annual?.median, 0)}</span>
      </Link>
    </li>
  );
}

export default function Home() {
  const featured = companyBySlug("mediatek") ?? companies[0];
  const popular = companies.filter((c) => c.stats).slice(0, 12);
  const latest = [...submissions]
    .filter((s) => s.date && s.monthly != null && s.company)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 6);
  const cloud = sectors.find((s) => s.id === "cloud");
  const security = sectors.find((s) => s.id === "security");
  const names = Object.fromEntries(companies.map((c) => [c.slug, c.name]));

  return (
    <div className="space-y-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "台灣科技業薪資參考",
          description: `台灣純軟、系統廠、IC 設計、資訊服務、雲端資安的匿名薪資分享彙總，共 ${meta.total} 筆，附官方非主管薪資揭露對照。`,
          url: SITE_URL,
          license: "https://creativecommons.org/licenses/by/4.0/",
          isAccessibleForFree: true,
          inLanguage: "zh-TW",
          dateModified: meta.generatedAt,
          spatialCoverage: "Taiwan",
          distribution: ["companies", "roles", "industries", "it-services-listed"].map((f) => ({
            "@type": "DataDownload",
            encodingFormat: "text/csv",
            contentUrl: `${SITE_URL}/data/${f}.csv`,
          })),
        }}
      />

      <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <h1 className="text-4xl leading-tight font-black sm:text-5xl">
            工程師的薪資條，
            <br />
            攤開來看。
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-2">
            {meta.total.toLocaleString()} 筆匿名分享，對照 {meta.official.matched} 間上市櫃公司的官方薪資揭露。查公司、看年資、比行情，完全免費，不用分享才解鎖。
          </p>
          <div className="mt-6 max-w-xl">
            <CompanySearch />
          </div>
          <p className="mt-3 max-w-xl text-sm">
            拿到 offer 了？
            <Link href="/offer/" className="ml-1 font-medium text-accent underline">
              檢查它算高還是低
            </Link>
          </p>
          <div className="mt-3 flex max-w-xl flex-wrap items-center gap-2 text-sm">
            <span className="text-ink-3">常被查：</span>
            {POPULAR.filter((p) => companyBySlug(p.slug)).map((p) => (
              <Link key={p.slug} href={`/companies/${p.slug}/`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-surface px-3 py-1 text-ink-2 hover:border-accent hover:text-ink sm:min-h-0">
                {p.label}
              </Link>
            ))}
          </div>
        </div>
        {featured.stats && (
          <Link href={`/companies/${featured.slug}/`} className="block lg:px-4" aria-label={`看${featured.name}完整薪資`}>
            <Payslip
              animate
              tilt
              heading={`${featured.name} 薪資條`}
              sub={`${featured.n} 筆分享`}
              rows={[
                { label: "月底薪（中位數）", value: String(featured.stats.monthly?.median), unit: "萬", emphasis: true },
                { label: "年終＋獎金", value: String(featured.stats.bonusMonths?.median), unit: "個月" },
                { label: "總年薪（中位數）", value: String(featured.stats.annual?.median), unit: "萬" },
                ...(featured.official ? [{ label: "非主管薪資中位數", value: String(featured.official.median), unit: "萬", official: true }] : []),
              ]}
              footnote="每間公司都有一張：群眾回報的中位數，加上官方揭露。點開看分布與年資曲線。"
            />
          </Link>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold">各產業月底薪中位數</h2>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {tracks.map((t) => (
            <LedgerRow key={t.id} href={`/industries/${t.id}/`} label={t.label} note={`${t.stats?.n.toLocaleString()} 筆`} stats={t.stats} />
          ))}
          <LedgerRow href="/sectors/it-services/" label="資訊服務業" note={`含勞動部職類薪資、${meta.itServices.listed} 間上市櫃`} stats={itServices.crowd.stats} />
          {cloud && <LedgerRow href="/sectors/cloud-security/" label="雲端／DevOps／SRE" note={`${cloud.roleStats?.n ?? 0} 筆`} stats={cloud.roleStats} />}
          {security && <LedgerRow href="/sectors/cloud-security/" label="資安職務" note={`${security.roleStats?.n ?? 0} 筆`} stats={security.roleStats} />}
        </ul>
      </section>

      <section className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold">資料最多的公司</h2>
            <span className="flex gap-4 text-sm">
              <Link href="/insights/" className="text-accent hover:underline">
                季度報告
              </Link>
              <Link href="/compare/" className="text-accent hover:underline">
                並排比較
              </Link>
            </span>
          </div>
          <ol className="mt-3 divide-y divide-border border-y border-border">
            {popular.map((c, i) => (
              <li key={c.slug}>
                <Link href={`/companies/${c.slug}/`} className="flex items-baseline gap-3 px-1 py-2.5 hover:bg-surface-2/60">
                  <span className="num w-5 text-right text-ink-3">{i + 1}</span>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-ink-3">{c.n} 筆</span>
                  <span className="num ml-auto text-lg font-semibold">{c.stats?.monthly?.median}</span>
                  <span className="text-sm text-ink-2">萬</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-2xl font-bold">最近的分享</h2>
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {latest.map((s) => (
              <li key={s.id}>
                <Link href={`/companies/${s.company}/`} className="flex items-baseline gap-3 px-1 py-2.5 hover:bg-surface-2/60">
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{names[s.company!]}</span>
                    <span className="ml-2 text-sm text-ink-2">{s.roleRaw ?? roleLabel(s.role)}</span>
                  </span>
                  <span className="tabular ml-auto shrink-0 text-xs text-ink-3">{s.date}</span>
                  <span className="num shrink-0 text-lg font-semibold">{s.monthly}</span>
                  <span className="text-sm text-ink-2">萬</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link data-cta href="/submit/" className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink hover:opacity-90">
            匿名分享我的薪資
          </Link>
        </div>
      </section>

      <section className="grid gap-6 border-t border-border pt-10 md:grid-cols-3">
        <div>
          <h3 className="font-bold">群眾分享</h3>
          <p className="mt-1 text-sm text-ink-2">
            原始表單 {meta.sources.sheet.toLocaleString()} 筆，加上人工審核的網站投稿。每筆標示來源與年份，明顯填錯的不計入統計。
          </p>
        </div>
        <div>
          <h3 className="flex items-center gap-2 font-bold">
            官方揭露 <span className="seal">官方</span>
          </h3>
          <p className="mt-1 text-sm text-ink-2">
            公開資訊觀測站的非主管薪資（{meta.official.year} 年）與勞動部職類別薪資調查，蓋紅章的數字都來自政府資料。
          </p>
        </div>
        <div>
          <h3 className="font-bold">保護填寫者</h3>
          <p className="mt-1 text-sm text-ink-2">
            罕見職稱自動歸類、人名遮蔽、人身攻擊不公開，任何人都能申請下架。
            <Link href="/about/" className="ml-1 text-accent underline">
              資料說明
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
