import type { Metadata } from "next";
import Link from "next/link";
import { CompanySearch } from "@/components/CompanySearch";
import { JsonLd } from "@/components/JsonLd";
import { companies, fmtWan, interviews, meta, SITE_URL, tracks } from "@/lib/data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const entries = companies.map(({ slug, name, en, aliases, track, n }) => ({ slug, name, en, aliases, track, n }));
  const popular = companies.filter((c) => c.stats).slice(0, 12);

  return (
    <div className="space-y-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "台灣科技業薪資參考",
          description: `台灣純軟、系統廠、IC 設計、雲端資安的匿名薪資分享彙總，共 ${meta.total} 筆，附官方非主管薪資揭露對照。`,
          url: SITE_URL,
          license: "https://creativecommons.org/licenses/by/4.0/",
          isAccessibleForFree: true,
          inLanguage: "zh-TW",
          dateModified: meta.generatedAt,
          spatialCoverage: "Taiwan",
          distribution: ["companies", "roles", "industries"].map((f) => ({
            "@type": "DataDownload",
            encodingFormat: "text/csv",
            contentUrl: `${SITE_URL}/data/${f}.csv`,
          })),
        }}
      />
      <section>
        <h1 className="text-2xl font-semibold sm:text-3xl">台灣科技業薪資參考</h1>
        <p className="mt-2 text-ink-2">
          {meta.total.toLocaleString()} 筆匿名分享，涵蓋純軟、系統廠、IC 設計與雲端資安，並對照 {meta.official.matched} 間上市櫃公司的官方薪資揭露。完全免費，不用分享才解鎖。
        </p>
        <div className="mt-6">
          <CompanySearch entries={entries} trackLabels={meta.trackLabels} />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/compare/" className="rounded-full border border-border bg-surface px-3 py-1 hover:border-accent">
            公司並排比較
          </Link>
          <Link href="/nicknames/" className="rounded-full border border-border bg-surface px-3 py-1 hover:border-accent">
            PTT 代號對照
          </Link>
          <Link href="/submit/" className="rounded-full border border-accent px-3 py-1 text-accent hover:bg-accent hover:text-white">
            匿名分享薪資
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">產業總覽</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {tracks.map((t) => (
            <Link key={t.id} href={`/industries/${t.id}/`} className="rounded-lg border border-border bg-surface p-5 hover:border-accent">
              <div className="text-sm text-ink-2">{t.label}</div>
              <div className="tabular mt-2 text-2xl font-semibold">{fmtWan(t.stats?.monthly?.median)}</div>
              <div className="text-xs text-ink-3">月底薪中位數</div>
              <div className="tabular mt-3 text-sm text-ink-2">
                總年薪中位數 {fmtWan(t.stats?.annual?.median, 0)}・{t.stats?.n.toLocaleString()} 筆
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/sectors/it-services/"
          className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-5 py-4 hover:border-accent"
        >
          <span>
            <span className="font-medium">資訊服務業專區</span>
            <span className="ml-2 text-sm text-ink-2">勞動部各職類薪資＋{meta.itServices.listed} 間上市櫃資訊服務公司官方薪資</span>
          </span>
          <span className="text-sm text-accent">前往 →</span>
        </Link>
        <Link
          href="/sectors/cloud-security/"
          className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-5 py-4 hover:border-accent"
        >
          <span>
            <span className="font-medium">雲端 / 資安專區</span>
            <span className="ml-2 text-sm text-ink-2">DevOps、SRE、資安研究員薪資與 {interviews.length} 篇面試心得</span>
          </span>
          <span className="text-sm text-accent">前往 →</span>
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">資料最多的公司</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((c) => (
            <li key={c.slug}>
              <Link href={`/companies/${c.slug}/`} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 hover:border-accent">
                <span>{c.name}</span>
                <span className="tabular text-sm text-ink-2">
                  {fmtWan(c.stats?.monthly?.median)}・{c.n} 筆
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-ink-3">
        {Math.round(((meta.years["2023"] ?? 0) / meta.total) * 100)}% 的資料填寫於 2023 年，近期薪資可能更高；各頁皆可切換「只看 {meta.recentFromYear} 年後」。
        詳見<Link href="/about/" className="underline">資料說明</Link>。
      </p>
    </div>
  );
}
