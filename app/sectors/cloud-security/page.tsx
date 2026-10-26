import type { Metadata } from "next";
import Link from "next/link";
import { PercentileTool } from "@/components/PercentileTool";
import { RangeBar } from "@/components/RangeBar";
import { LevelTable } from "@/components/StatsOverview";
import { SubmissionList } from "@/components/SubmissionList";
import { companies, fmtNum, fmtWan, interviews, meta, sectors, submissions, type Stats } from "@/lib/data";

export const metadata: Metadata = {
  title: "雲端 / 資安薪資",
  description: "台灣 DevOps、SRE、雲端架構師、資安研究員、SOC 與資安公司的薪資、年薪、證照與面試心得。",
  alternates: { canonical: "/sectors/cloud-security/" },
};

export default function CloudSecurityPage() {
  const cloud = sectors.find((s) => s.id === "cloud")!;
  const security = sectors.find((s) => s.id === "security")!;
  const groups: { label: string; note: string; stats: Stats | null }[] = [
    { label: "雲端 / DevOps / SRE 職務", note: "依職稱", stats: cloud.roleStats },
    { label: "資安職務", note: "依職稱，例如資安研究員、SOC", stats: security.roleStats },
    { label: "資安公司（所有職務）", note: "趨勢、TXOne、奧義、Netskope 等", stats: security.companyStats },
    { label: "雲端公司（所有職務）", note: "雲端代理商等", stats: cloud.companyStats },
  ];
  const max = Math.max(...groups.map((g) => g.stats?.monthly?.p75 ?? 0), 1) * 1.05;
  const rowIds = new Set([...cloud.rowIds, ...security.rowIds]);
  const rows = submissions.filter((s) => rowIds.has(s.id));
  const companyNames = Object.fromEntries(companies.filter((c) => rows.some((r) => r.company === c.slug)).map((c) => [c.slug, c.name]));
  const offers = interviews.filter((i) => i.offered);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold">雲端 / 資安薪資</h1>
        <p className="mt-2 text-sm text-ink-2">
          從三個分頁中挑出 DevOps、SRE、雲端與資安相關職稱，以及資安、雲端公司的所有分享，共 {rows.length} 筆。
          樣本仍小，數字請當作參考區間，不是行情定價。
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">總覽</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 font-normal">群組</th>
                <th className="px-3 py-2 text-right font-normal">筆數</th>
                <th className="px-3 py-2 font-normal">月底薪分布（P25–P75，直線為中位數）</th>
                <th className="px-3 py-2 text-right font-normal">月薪中位數</th>
                <th className="px-3 py-2 text-right font-normal">年薪中位數</th>
                <th className="px-3 py-2 text-right font-normal">爽度</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {groups.map((g) => (
                <tr key={g.label} className="border-t border-border">
                  <td className="px-3 py-2">
                    {g.label}
                    <div className="text-xs text-ink-3">{g.note}</div>
                  </td>
                  <td className="px-3 py-2 text-right text-ink-2">{g.stats?.n ?? "—"}</td>
                  <td className="w-1/3 px-3 py-2">
                    <RangeBar dist={g.stats?.monthly ?? null} max={max} />
                  </td>
                  <td className="px-3 py-2 text-right">{fmtWan(g.stats?.monthly?.median)}</td>
                  <td className="px-3 py-2 text-right">{fmtWan(g.stats?.annual?.median, 0)}</td>
                  <td className="px-3 py-2 text-right">{fmtNum(g.stats?.happiness)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">細分職務</h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 font-normal">職務</th>
                <th className="px-3 py-2 text-right font-normal">筆數</th>
                <th className="px-3 py-2 font-normal">月底薪分布</th>
                <th className="px-3 py-2 text-right font-normal">月底薪</th>
                <th className="px-3 py-2 text-right font-normal">年薪中位數</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {[cloud, security].flatMap((sec) =>
                sec.subRoles.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      {s.label}
                      <div className="text-xs text-ink-3">{sec.id === "cloud" ? "雲端" : "資安"}</div>
                    </td>
                    <td className="px-3 py-2 text-right text-ink-2">{s.n}</td>
                    <td className="w-1/3 px-3 py-2">
                      <RangeBar dist={s.stats?.monthly ?? null} max={max} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {s.stats?.monthly ? `中位數 ${s.stats.monthly.median} 萬` : s.monthly.length ? `${s.monthly.join("、")} 萬` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{fmtWan(s.stats?.annual?.median, 0)}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink-3">
          紅隊、GRC、雲端架構師等樣本仍少。新投稿表單可填證照（AWS、CKA、OSCP…）與面試題型，
          <Link href="/submit/" className="underline">
            歡迎分享
          </Link>
          。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <PercentileTool values={cloud.monthlyValues} scope="雲端 / DevOps / SRE 職務" />
        <PercentileTool values={security.monthlyValues} scope="資安職務" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {groups.slice(0, 3).map(
          (g) =>
            g.stats && (
              <div key={g.label}>
                <h2 className="mb-3 text-lg font-semibold">{g.label}・依年資</h2>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <LevelTable stats={g.stats} />
                </div>
              </div>
            ),
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {[security, cloud].map((sec) => (
          <div key={sec.id}>
            <h2 className="mb-3 text-lg font-semibold">{sec.label}・公司</h2>
            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="w-full text-sm">
                <tbody className="tabular">
                  {sec.companies.map((c) => (
                    <tr key={c.slug} className="border-t border-border first:border-t-0">
                      <td className="px-3 py-2">
                        <Link href={`/companies/${c.slug}/`} className="hover:text-accent">
                          {c.name}
                        </Link>
                        <div className="text-xs text-ink-3">{c.isSectorCompany ? (sec.id === "security" ? "資安公司" : "雲端公司") : "相關職缺"}</div>
                      </td>
                      <td className="px-3 py-2 text-right text-ink-2">{c.n} 筆</td>
                      <td className="px-3 py-2 text-right">
                        {c.stats?.monthly
                          ? `中位數 ${c.stats.monthly.median} 萬`
                          : c.monthly.length
                            ? `${c.monthly.join("、")} 萬`
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold">面試心得（{interviews.length}）</h2>
        <p className="mt-1 mb-3 text-sm text-ink-2">
          以 DevOps / SRE 職缺為主。{offers.length} 間錄取，有寫薪資的 offer：
          {offers
            .filter((i) => i.offerMonthly)
            .map((i) => `${i.company} ${i.offerMonthly} 萬${i.offerGuaranteedMonths ? ` × ${i.offerGuaranteedMonths}` : ""}`)
            .join("、")}
          。
        </p>
        <ul className="space-y-3">
          {interviews.map((i) => (
            <li key={i.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  {i.companySlug ? (
                    <Link href={`/companies/${i.companySlug}/`} className="font-medium hover:text-accent">
                      {i.company}
                    </Link>
                  ) : (
                    <span className="font-medium">{i.company}</span>
                  )}
                  <span className="ml-2 text-sm text-ink-2">{i.role}</span>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${i.offered ? "border-accent text-ink" : "border-border text-ink-3"}`}
                >
                  {i.offered ? "錄取" : "未錄取 / 未進行"}
                </span>
              </div>
              {i.salary && <div className="tabular mt-1 text-sm">Offer：{i.salary}</div>}
              <p className="mt-2 whitespace-pre-line text-sm text-ink-2">{i.process}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">每筆分享</h2>
        <SubmissionList
          rows={rows}
          recentFromYear={meta.recentFromYear}
          roleLabels={meta.roleLabels}
          companyNames={companyNames}
          filters={[
            { id: "cloud", label: "雲端", match: cloud.rowIds },
            { id: "security", label: "資安", match: security.rowIds },
          ]}
        />
      </section>
    </div>
  );
}
