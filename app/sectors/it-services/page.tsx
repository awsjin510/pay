import type { Metadata } from "next";
import Link from "next/link";
import { ItAcrossIndustries } from "@/components/ItAcrossIndustries";
import { JobListings } from "@/components/JobListings";
import { OccupationTable } from "@/components/OccupationTable";
import { SectionTabs } from "@/components/SectionTabs";
import { PercentileTool } from "@/components/PercentileTool";
import { StatTile } from "@/components/RangeBar";
import { SubmissionList } from "@/components/SubmissionList";
import { TrackView } from "@/components/TrackView";
import { fmtWan, itServices, meta, submissions } from "@/lib/data";

export const metadata: Metadata = {
  title: "資訊服務業薪資",
  description:
    "資訊服務業各職類薪資：勞動部職類別薪資調查（軟體、系統分析、資訊管理、PM、業務…）、資訊人員在 25 個行業的薪資、台灣就業通資訊職缺、80 間上市櫃資訊服務與數位雲端公司官方薪資，以及本站匿名分享。",
  alternates: { canonical: "/sectors/it-services/" },
};

const ICT_PRO = "資訊及通訊專業人員(含系統分析、程式設計、資料庫及網路專業人員)";

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export default function ItServicesPage() {
  const { mol, listed, crowd } = itServices;
  const industries = mol?.industries ?? [];
  const jobs = itServices.jobs;
  const ictPro = (code: string) => mol?.industries.find((i) => i.code === code)?.occupations.find((o) => o.name === ICT_PRO);
  const j62 = ictPro("J620000000");
  const j63 = ictPro("J630000000");
  const listedMax = Math.max(...listed.map((l) => l.median), 1);
  const rowIds = new Set(crowd.rowIds);
  const rows = submissions.filter((s) => rowIds.has(s.id));
  const companyNames = Object.fromEntries(crowd.companies.map((c) => [c.slug, c.name]));

  return (
    <div className="space-y-10">
      <TrackView name="answer_view" scope="sector:it" />
      <header>
        <h1 className="text-3xl font-black sm:text-4xl">資訊服務業薪資</h1>
        <p className="mt-2 text-sm text-ink-2">
          合併四種來源：勞動部{mol?.year}年職類別薪資調查（按職類、按行業）、台灣就業通現有資訊職缺、{listed.length} 間上市櫃資訊服務／數位雲端公司的官方非主管薪資，以及本站 {crowd.stats?.n ?? 0} 筆匿名分享。
          定義不同，請對照閱讀（見頁尾說明）。
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="資訊及通訊專業人員・電腦程式設計業（62）" value={j62 ? `${j62.monthly.toFixed(1)} 萬` : "—"} sub={j62 ? `月經常性薪資｜全年 ${j62.annual} 萬` : undefined} />
        <StatTile label="資訊及通訊專業人員・資訊服務業（63）" value={j63 ? `${j63.monthly.toFixed(1)} 萬` : "—"} sub={j63 ? `月經常性薪資｜全年 ${j63.annual} 萬` : undefined} />
        <StatTile
          label={`上市櫃資訊服務／數位雲端（${listed.length} 間）`}
          value={listed.length ? `${median(listed.map((l) => l.median)).toFixed(1)} 萬` : "—"}
          sub={`各公司非主管薪資中位數的中位數・${listed[0]?.year ?? ""} 年`}
        />
        <StatTile label="本站分享・月底薪中位數" value={fmtWan(crowd.stats?.monthly?.median)} sub={`${crowd.stats?.n ?? 0} 筆・總年薪中位數 ${fmtWan(crowd.stats?.annual?.median, 0)}`} />
      </section>

      <SectionTabs
        sections={[
          { id: "occupations", label: "各職類" },
          { id: "across", label: "跨行業" },
          { id: "jobs", label: `現有職缺（${jobs.list.length}）` },
          { id: "listed", label: "上市櫃公司" },
          { id: "crowd", label: "本站分享" },
        ]}
      />

      {mol && (
        <section id="occupations" className="scroll-mt-28">
          <h2 className="text-xl font-bold">各職類薪資（勞動部）</h2>
          <p className="mt-1 mb-3 text-sm text-ink-2">
            {mol.year} 年 7 月經常性薪資與 {mol.annualYear} 年全年薪資的平均數。行業代碼 62「電腦程式設計、諮詢及相關服務業」涵蓋 SI、軟體開發外包與 IT 顧問；63「資訊服務業」是入口網站、資料處理、網站代管與雲端服務。也可切換到電子製造業、金融業等資訊人員多的行業。
          </p>
          <OccupationTable industries={industries} annualYear={mol.annualYear} />
        </section>
      )}

      {mol && (
        <section id="across" className="scroll-mt-28">
          <h2 className="text-xl font-bold">資訊人員在各行業的薪資</h2>
          <p className="mt-1 mb-3 text-sm text-ink-2">
            同樣是資訊工作，在不同行業的薪水差很多：{mol.itAcross.pro[0]?.industry}最高（{mol.itAcross.pro[0]?.monthly} 萬），
            {mol.itAcross.pro.at(-1)?.industry}最低（{mol.itAcross.pro.at(-1)?.monthly} 萬）。
          </p>
          <ItAcrossIndustries pro={mol.itAcross.pro} tech={mol.itAcross.tech} year={mol.year} annualYear={mol.annualYear} />
        </section>
      )}

      <section id="jobs" className="scroll-mt-28">
        <h2 className="text-xl font-bold">現有資訊職缺（台灣就業通）</h2>
        <p className="mt-1 mb-3 text-sm text-ink-2">
          政府就業服務網站上仍在招募的資訊類職缺，每週隨資料同步更新（最後抓取 {jobs.fetchedAt}）。點職稱可看原始職缺。
        </p>
        <JobListings jobs={jobs} />
      </section>

      <section id="listed" className="scroll-mt-28">
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

      <section id="crowd" className="scroll-mt-28 space-y-4">
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
            「-」或「---」（無資料或保密）的職類不列出。行業依行業統計分類第 11 次修正。來源：
            <a href="https://data.gov.tw/dataset/41692" className="underline">政府資料開放平臺「受僱員工人數、每人薪資（按職類別分）」系列</a>（政府資料開放授權條款第 1 版），跨行業表可下載{" "}
            <a href="/data/it-occupations-by-industry.csv" className="underline">it-occupations-by-industry.csv</a>。
          </li>
          <li>
            台灣就業通職缺：勞動部勞動力發展署開放資料（
            <a href="https://data.gov.tw/dataset/44062" className="underline">台灣就業通網站職缺清單</a>），職務大類「資訊／軟體／系統」，只列全職、仍在招募的職缺；職缺內容以原網站為準。
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
