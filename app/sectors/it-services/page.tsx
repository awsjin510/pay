import type { Metadata } from "next";
import Link from "next/link";
import { OccupationTable } from "@/components/OccupationTable";
import { PercentileTool } from "@/components/PercentileTool";
import { StatTile } from "@/components/RangeBar";
import { SubmissionList } from "@/components/SubmissionList";
import { fmtWan, itServices, meta, submissions } from "@/lib/data";

export const metadata: Metadata = {
  title: "資訊服務業薪資",
  description:
    "資訊服務業各職類薪資：勞動部職類別薪資調查（軟體、系統分析、資訊管理、PM、業務、客服…）、80 間上市櫃資訊服務與數位雲端公司官方非主管薪資，以及本站匿名分享。",
  alternates: { canonical: "/sectors/it-services/" },
};

// Industries shown in the occupation table, in this order.
const TABLE_CODES = ["J620000000", "J630000000", "J610000000", "J000000000"];
const ICT_PRO = "資訊及通訊專業人員(含系統分析、程式設計、資料庫及網路專業人員)";

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export default function ItServicesPage() {
  const { mol, listed, crowd } = itServices;
  const industries = TABLE_CODES.map((c) => mol?.industries.find((i) => i.code === c)).filter((i) => i != null);
  const ictPro = (code: string) => mol?.industries.find((i) => i.code === code)?.occupations.find((o) => o.name === ICT_PRO);
  const j62 = ictPro("J620000000");
  const j63 = ictPro("J630000000");
  const listedMax = Math.max(...listed.map((l) => l.median), 1);
  const rowIds = new Set(crowd.rowIds);
  const rows = submissions.filter((s) => rowIds.has(s.id));
  const companyNames = Object.fromEntries(crowd.companies.map((c) => [c.slug, c.name]));

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-black sm:text-4xl">資訊服務業薪資</h1>
        <p className="mt-2 text-sm text-ink-2">
          合併三種來源：勞動部{mol?.year}年職類別薪資調查（按職類）、{listed.length} 間上市櫃資訊服務／數位雲端公司的官方非主管薪資，以及本站 {crowd.stats?.n ?? 0} 筆匿名分享。
          定義不同，請對照閱讀（見頁尾說明）。
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="資訊及通訊專業人員・電腦程式設計業" value={j62 ? `${j62.monthly.toFixed(1)} 萬` : "—"} sub={j62 ? `月經常性薪資｜全年 ${j62.annual} 萬` : undefined} />
        <StatTile label="資訊及通訊專業人員・資料處理業" value={j63 ? `${j63.monthly.toFixed(1)} 萬` : "—"} sub={j63 ? `月經常性薪資｜全年 ${j63.annual} 萬` : undefined} />
        <StatTile
          label={`上市櫃資訊服務／數位雲端（${listed.length} 間）`}
          value={listed.length ? `${median(listed.map((l) => l.median)).toFixed(1)} 萬` : "—"}
          sub={`各公司非主管薪資中位數的中位數・${listed[0]?.year ?? ""} 年`}
        />
        <StatTile label="本站分享・月底薪中位數" value={fmtWan(crowd.stats?.monthly?.median)} sub={`${crowd.stats?.n ?? 0} 筆・總年薪中位數 ${fmtWan(crowd.stats?.annual?.median, 0)}`} />
      </section>

      {mol && (
        <section>
          <h2 className="text-xl font-bold">各職類薪資（勞動部）</h2>
          <p className="mt-1 mb-3 text-sm text-ink-2">
            {mol.year} 年 7 月經常性薪資與 {mol.annualYear} 年全年薪資的平均數。「電腦程式設計、諮詢及相關服務業」就是一般說的資訊服務業（SI、軟體外包、IT 顧問）。
          </p>
          <OccupationTable industries={industries} annualYear={mol.annualYear} />
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold">上市櫃公司官方薪資</h2>
        <p className="mt-1 mb-3 text-sm text-ink-2">
          證交所／櫃買中心產業別為「資訊服務業」或「數位雲端」的公司，{listed[0]?.year} 年非擔任主管全時員工薪資（全年，含獎金）。有本站資料的公司可點進去看細節。
        </p>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 font-normal">公司</th>
                <th className="px-3 py-2 font-normal">分類</th>
                <th className="px-3 py-2 font-normal">非主管薪資中位數</th>
                <th className="px-3 py-2 text-right font-normal">平均數</th>
                <th className="px-3 py-2 text-right font-normal">中位數年增</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {listed.map((l) => (
                <tr key={l.code} className="border-t border-border">
                  <td className="px-3 py-2">
                    {l.slug ? (
                      <Link href={`/companies/${l.slug}/`} className="text-accent hover:underline">
                        {l.name}
                      </Link>
                    ) : (
                      l.name
                    )}
                    <span className="ml-1 text-xs text-ink-3">
                      {l.market} {l.code}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-ink-2">{l.industryLabel}</td>
                  <td className="w-2/5 px-3 py-2">
                    <div className="flex items-center gap-2" title={`${l.name} 非主管薪資中位數 ${l.median} 萬`}>
                      <div className="h-2.5 flex-1 rounded-sm bg-grid/60">
                        <div className="h-full rounded-sm bg-official" style={{ width: `${(l.median / listedMax) * 100}%` }} />
                      </div>
                      <span className="w-16 text-right">{l.median} 萬</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">{l.mean != null ? `${l.mean} 萬` : "—"}</td>
                  <td className="px-3 py-2 text-right text-ink-2">{l.medianChange || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">本站分享（資訊服務公司）</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="text-left text-xs text-ink-2">
              <tr>
                <th className="px-3 py-2 font-normal">公司</th>
                <th className="px-3 py-2 text-right font-normal">筆數</th>
                <th className="px-3 py-2 text-right font-normal">月底薪中位數</th>
                <th className="px-3 py-2 text-right font-normal">總年薪中位數</th>
                <th className="px-3 py-2 text-right font-normal">官方非主管中位數</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {crowd.companies.map((c) => (
                <tr key={c.slug} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link href={`/companies/${c.slug}/`} className="hover:text-accent">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right text-ink-2">{c.n}</td>
                  <td className="px-3 py-2 text-right">{fmtWan(c.stats?.monthly?.median)}</td>
                  <td className="px-3 py-2 text-right">{fmtWan(c.stats?.annual?.median, 0)}</td>
                  <td className="px-3 py-2 text-right">{c.official ? `${c.official.median} 萬` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PercentileTool values={crowd.monthlyValues} scope="資訊服務公司" />
        <SubmissionList rows={rows} recentFromYear={meta.recentFromYear} roleLabels={meta.roleLabels} companyNames={companyNames} />
      </section>

      <section className="text-xs leading-6 text-ink-3">
        <h2 className="mb-1 text-sm font-semibold text-ink-2">資料定義與來源</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            勞動部職類別薪資調查：抽樣調查，數字為平均數。「經常性薪資」＝本薪＋固定津貼，不含年終、績效獎金與加班費，可和本站「月底薪」對照；「全年薪資」含各項獎金。
            「-」或「---」（無資料或保密）的職類不列出。來源：
            <a href="https://data.gov.tw/dataset/41692" className="underline">政府資料開放平臺</a>（政府資料開放授權條款第 1 版）。
          </li>
          <li>
            上市櫃官方薪資：公開資訊觀測站「非擔任主管職務之全時員工薪資」，為全年薪資總額（含獎金），全公司非主管員工，不分職務。來源：證交所、櫃買中心 OpenAPI。
            整理後的表格可下載 <a href="/data/it-services-listed.csv" className="underline">it-services-listed.csv</a>。
          </li>
          <li>本站分享：自行回報、未逐筆驗證，涵蓋上表中有資料的公司及昕力資訊、緯創軟體等未上市資訊服務公司。</li>
        </ul>
      </section>
    </div>
  );
}
