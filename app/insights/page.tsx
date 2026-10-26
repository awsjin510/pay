import type { Metadata } from "next";
import Link from "next/link";
import { companies, itServices, meta, sectors, tracks } from "@/lib/data";

const generated = new Date(meta.generatedAt);
const QUARTER = `${generated.getFullYear()} Q${Math.floor(generated.getMonth() / 3) + 1}`;

export const metadata: Metadata = {
  title: `科技業薪資報告 ${QUARTER}`,
  description: `${QUARTER} 台灣科技業薪資報告：純軟、系統廠、IC 設計的月薪與年薪中位數、年資成長、薪資最高的公司、官方揭露對照、資訊人員跨行業比較。資料以 CC BY 4.0 開放引用。`,
  alternates: { canonical: "/insights/" },
};

// One line of the report ledger: label, dot leader, value.
const Line = ({ label, value, href, note }: { label: string; value: string; href?: string; note?: string }) => (
  <li className="flex items-baseline gap-2 py-2">
    {href ? (
      <Link href={href} className="hover:text-accent">
        {label}
      </Link>
    ) : (
      <span>{label}</span>
    )}
    {note && <span className="text-xs text-ink-3">{note}</span>}
    <span className="leader" aria-hidden="true" />
    <span className="num shrink-0 text-lg font-semibold">{value}</span>
  </li>
);

const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <section className="border-t border-border pt-6">
    <h2 className="text-xl font-bold">
      <span className="num mr-2 text-ink-3">{n}.</span>
      {title}
    </h2>
    <div className="mt-2 text-ink-2">{children}</div>
  </section>
);

export default function InsightsPage() {
  const top = companies
    .filter((c) => c.stats?.monthly && c.stats.monthly.n >= 8)
    .sort((a, b) => b.stats!.monthly!.median - a.stats!.monthly!.median)
    .slice(0, 10);
  // Where the official disclosure is furthest above what people report (definitions differ).
  const gaps = companies
    .filter((c) => c.official && c.stats?.annual && c.stats.annual.n >= 5)
    .map((c) => ({ c, ratio: c.official!.median / c.stats!.annual!.median }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 8);
  const growth = tracks.map((t) => {
    const first = t.curve.find((p) => p.monthly);
    const senior = [...t.curve].reverse().find((p) => p.monthly);
    return { t, first, senior };
  });
  const across = itServices.mol?.itAcross.pro ?? [];
  const cloud = sectors.find((s) => s.id === "cloud");
  const security = sectors.find((s) => s.id === "security");
  const oldShare = Math.round(((meta.years["2023"] ?? 0) / meta.total) * 100);

  return (
    <article className="mx-auto max-w-3xl space-y-8 leading-7">
      <header>
        <p className="text-sm text-ink-3">資料截至 {meta.generatedAt.slice(0, 10)}，每次資料更新自動重算</p>
        <h1 className="mt-1 text-3xl font-black sm:text-4xl">科技業薪資報告 {QUARTER}</h1>
        <p className="mt-3 text-ink-2">
          整理 {meta.total.toLocaleString()} 筆匿名分享、{meta.official.matched} 間上市櫃公司官方揭露與勞動部 {meta.mol?.year} 年職類別薪資調查。
          {oldShare}% 的分享填寫於 2023 年，數字可能低於現行行情，建議搭配官方數字閱讀。
        </p>
      </header>

      <Section n={1} title="各產業月底薪中位數">
        <ul className="divide-y divide-border">
          {tracks.map((t) => (
            <Line
              key={t.id}
              label={t.label}
              href={`/industries/${t.id}/`}
              note={`${t.stats?.n} 筆${t.recentStats?.monthly ? `，${meta.recentFromYear} 年後 ${t.recentStats.monthly.median} 萬` : ""}`}
              value={`${t.stats?.monthly?.median} 萬／年 ${t.stats?.annual?.median} 萬`}
            />
          ))}
        </ul>
      </Section>

      <Section n={2} title="年資帶來多少成長">
        <ul className="divide-y divide-border">
          {growth.map(({ t, first, senior }) =>
            first?.monthly && senior?.monthly ? (
              <Line
                key={t.id}
                label={t.label}
                note={`${first.label} 年 → ${senior.label} 年`}
                value={`${first.monthly.median} → ${senior.monthly.median} 萬（×${(senior.monthly.median / first.monthly.median).toFixed(1)}）`}
              />
            ) : null,
          )}
        </ul>
      </Section>

      <Section n={3} title="月底薪中位數最高的公司">
        <p className="text-sm">只列資料 8 筆以上的公司。</p>
        <ul className="divide-y divide-border">
          {top.map((c) => (
            <Line key={c.slug} label={c.name} href={`/companies/${c.slug}/`} note={`${c.n} 筆`} value={`${c.stats!.monthly!.median} 萬`} />
          ))}
        </ul>
      </Section>

      {gaps.length > 0 && (
        <Section n={4} title="官方揭露比網友回報高最多的公司">
          <p className="text-sm">
            官方是 {meta.official.year} 年全公司非主管員工的全年薪資中位數，本站是自行回報的總年薪中位數。差距大，通常代表分紅高、或網友資料偏舊。
          </p>
          <ul className="divide-y divide-border">
            {gaps.map(({ c, ratio }) => (
              <Line key={c.slug} label={c.name} href={`/companies/${c.slug}/`} note={`官方 ${c.official!.median}／本站 ${c.stats!.annual!.median} 萬`} value={`×${ratio.toFixed(2)}`} />
            ))}
          </ul>
        </Section>
      )}

      {across.length > 0 && (
        <Section n={5} title="同樣是資訊人員，在哪個行業最好賺">
          <p className="text-sm">勞動部「資訊及通訊專業人員」{meta.mol?.year} 年 7 月經常性薪資（平均數）。</p>
          <ul className="divide-y divide-border">
            {across.slice(0, 5).map((r) => (
              <Line key={r.code} label={r.industry} note={`${r.employees.toLocaleString()} 人`} value={`${r.monthly} 萬`} />
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-3">最低的三個行業</p>
          <ul className="divide-y divide-border">
            {across.slice(-3).map((r) => (
              <Line key={r.code} label={r.industry} note={`${r.employees.toLocaleString()} 人`} value={`${r.monthly} 萬`} />
            ))}
          </ul>
          <p className="mt-2 text-sm">
            完整表格在<Link href="/sectors/it-services/#across" className="text-accent underline">資訊服務業專區</Link>。
          </p>
        </Section>
      )}

      <Section n={6} title="雲端與資安">
        <ul className="divide-y divide-border">
          {cloud?.roleStats?.monthly && <Line label="雲端／DevOps／SRE 職務" href="/sectors/cloud-security/" note={`${cloud.roleStats.n} 筆`} value={`${cloud.roleStats.monthly.median} 萬`} />}
          {security?.roleStats?.monthly && <Line label="資安職務" href="/sectors/cloud-security/" note={`${security.roleStats.n} 筆`} value={`${security.roleStats.monthly.median} 萬`} />}
          {security?.companyStats?.monthly && <Line label="資安公司（所有職務）" note={`${security.companyStats.n} 筆`} value={`${security.companyStats.monthly.median} 萬`} />}
        </ul>
      </Section>

      {itServices.jobs.categories.length > 0 && (
        <Section n={7} title="現有資訊職缺開出的起薪">
          <p className="text-sm">台灣就業通仍在招募的資訊類全職職缺 {meta.itServices.jobs} 筆，以中小企業與公部門為主。</p>
          <ul className="divide-y divide-border">
            {itServices.jobs.categories.slice(0, 5).map((c) => (
              <Line key={c.category} label={c.category} note={`${c.n} 筆`} value={c.lowMedian != null ? `${c.lowMedian}${c.highMedian != null ? `–${c.highMedian}` : ""} 萬` : "—"} />
            ))}
          </ul>
        </Section>
      )}

      <Section n={8} title="方法與引用">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>統計採中位數；少於 {meta.minN} 筆不計算；明顯填錯的數字不納入。詳見<Link href="/about/" className="underline">資料說明</Link>。</li>
          <li>
            彙總資料以 CC BY 4.0 開放：
            <a href="/data/companies.csv" className="underline">公司</a>、<a href="/data/roles.csv" className="underline">職務</a>、
            <a href="/data/industries.csv" className="underline">產業</a>、<a href="/data/it-occupations-by-industry.csv" className="underline">資訊人員跨行業</a>。
          </li>
          <li>引用請註明：「科技業薪資參考 pay.operation.tw，{QUARTER} 報告」。</li>
          <li>
            數字和你的不一樣？
            <Link href="/submit/?ref=report" className="text-accent underline">
              花 30 秒匿名分享
            </Link>
            ，下一季報告就會更準。
          </li>
        </ul>
      </Section>
    </article>
  );
}
