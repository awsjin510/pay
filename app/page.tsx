import Link from "next/link";
import { CompanySearch } from "@/components/CompanySearch";
import { companies, fmtWan, meta, tracks } from "@/lib/data";

export default function Home() {
  const entries = companies.map(({ slug, name, en, aliases, track, n }) => ({ slug, name, en, aliases, track, n }));
  const popular = companies.filter((c) => c.stats).slice(0, 12);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold sm:text-3xl">台灣科技業薪資參考</h1>
        <p className="mt-2 text-ink-2">
          {meta.total.toLocaleString()} 筆匿名分享，涵蓋純軟、系統廠與 IC 設計。月底薪、年終、總年薪與工時，一次看清楚。
        </p>
        <div className="mt-6">
          <CompanySearch entries={entries} trackLabels={meta.trackLabels} />
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
