import type { Metadata } from "next";
import Link from "next/link";
import { companies, meta, nicknamesOf } from "@/lib/data";

export const metadata: Metadata = {
  title: "資料說明與開放資料",
  description: "資料來源、清理與去識別規則、官方薪資對照、可信度標示、下架政策、CSV 開放資料下載（CC BY 4.0）。",
  alternates: { canonical: "/about/" },
};

const f = (key: string) => (meta.flags as Record<string, number>)[key] ?? 0;

export default function AboutPage() {
  const nicknamed = companies.filter((c) => nicknamesOf(c).length);

  return (
    <article className="max-w-3xl space-y-8 text-sm leading-7">
      <h1 className="text-3xl font-black sm:text-4xl">資料說明與開放資料</h1>

      <section>
        <h2 className="mb-2 text-xl font-bold">資料來源</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>原始表單</strong>：網友匿名填寫的「薪資紀錄」Google 試算表（純軟、系統廠、IC 設計三個分頁），{meta.sources.sheet.toLocaleString()} 筆，已取得授權整理公開。
          </li>
          <li>
            <strong>網站投稿</strong>：透過<Link href="/submit/" className="underline">分享薪資</Link>表單送出、經人工審核的資料，目前 {meta.sources.web} 筆。
          </li>
          <li>
            <strong>官方揭露</strong>：公開資訊觀測站「非擔任主管職務之全時員工薪資」（證交所、櫃買中心開放資料），{meta.official.year} 年度共 {meta.official.companies.toLocaleString()} 間公司，
            其中 {meta.official.matched} 間對應到本站公司頁。
          </li>
          <li>
            <strong>台灣就業通職缺</strong>：勞動部勞動力發展署開放資料，資訊類全職職缺 {meta.itServices.jobs} 筆，每週更新。
          </li>
          {meta.mol && (
            <li>
              <strong>勞動部職類別薪資調查</strong>：{meta.mol.year} 年 17 個行業「受僱員工人數、每人薪資（按職類別分）」，用於
              <Link href="/sectors/it-services/" className="underline">資訊服務業專區</Link>（各職類、資訊人員跨行業比較）與各職務頁的官方參考（政府資料開放授權條款第 1 版）。
            </li>
          )}
        </ul>
        <p className="mt-2">每次網站更新都會重新抓取以上來源。最後更新：{meta.generatedAt.slice(0, 10)}。依填寫年份：</p>
        <ul className="mt-1 list-disc pl-5 text-ink-2">
          {Object.entries(meta.years).map(([y, n]) => (
            <li key={y}>
              {y === "unknown" ? "日期不明" : `${y} 年`}：{n} 筆
            </li>
          ))}
        </ul>
        <p className="mt-1 text-ink-2">多數資料填寫於 2023 年，每筆都標示年份，各頁也可切換「只看 {meta.recentFromYear} 年後」，並可對照官方最新年度的數字。</p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">可信度標示</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>原始表單・未驗證</strong>：群眾自填，未經本站查證。
          </li>
          <li>
            <strong>網站投稿・已審核</strong>：人工檢查過數字合理性與內容規範。
          </li>
          <li>
            <strong>疑似填寫錯誤</strong>：月薪超出同公司分布 3 個四分位距、且高於中位數 2 倍或低於一半者（共 {f("outlier")} 筆），仍顯示但不納入統計。
          </li>
        </ul>
        <p className="mt-1 text-ink-2">尚未提供公司信箱或文件驗證；若未來加入，會在每筆資料上另外標示。</p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">清理規則</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>月底薪單位統一為「萬」：填成元的 {f("monthly_unit_yuan")} 筆除以 10,000；介於 50–200 的 {f("monthly_unit_guess_k")} 筆視為千元除以 10；仍不合理的 {f("monthly_invalid")} 筆不採計。</li>
          <li>總年薪填成元的 {f("annual_unit_yuan")} 筆換算為萬；不合理的 {f("annual_invalid")} 筆不採計。未填總年薪但有月薪與 Bonus 的 {f("annual_estimated")} 筆，以「月薪 ×（12 + Bonus）」估算並標示「≈」。</li>
          <li>Bonus 填百分比的 {f("bonus_from_percent")} 筆換算為月數；不合理值 {f("bonus_invalid")} 筆不採計。</li>
          <li>職級是各公司自己的制度（E7、L4、高工），統計改用「相關年資」分段比較。</li>
          <li>任何公司或職務少於 {meta.minN} 筆時不顯示統計。</li>
          <li>
            「推估 {meta.estimate.year} 月底薪」：每筆資料依填寫年份，以上市櫃公司非主管薪資中位數的年增率中位數（{meta.estimate.growth}%，{meta.estimate.basis.toLocaleString()} 家）逐年成長後再取中位數。這是推估，不是實際回報，也不代表公司今年的調薪幅度。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">去識別化</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>全站只出現一次的職稱或職級（{f("rare_title_merged")} 筆）改顯示職務分類，避免從罕見職稱認出投稿者。</li>
          <li>心得中的「姓氏＋職稱」（例如某董、某經理）、email、電話會自動遮蔽。</li>
          <li>含針對個人的貶損字眼的 {f("comment_harsh")} 則心得不公開，只保留薪資數字。</li>
          <li>網站投稿不收集姓名與 email；防灌票只用當日加鹽的 IP 雜湊。</li>
          <li>薪酬組成（分紅、股票、簽約金）與工作條件（每週工時、加班費、遠端、特休）只公開 {meta.minN} 人以上的統計，不出現在單筆資料或開放資料檔中。</li>
          <li>使用統計只累計每日事件次數（看了哪類頁面、是否完成投稿、從哪個管道來），不記錄 IP、cookie、裝置或輸入的薪資；Offer 檢查器的比對完全在瀏覽器內完成。</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">下架政策</h2>
        <p>
          公司、當事人或投稿者都可以透過<Link href="/report/" className="underline">下架申請表</Link>提出，不需登入，7 個工作天內處理。
          具名指控、未經證實的違法情事、可識別個人的內容，確認後直接下架；每筆分享下方也有「回報這筆資料」。
          心得為填寫者個人意見，不代表本站立場。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">公司名稱與 PTT 代號</h2>
        <p>
          同一間公司常有多種寫法與代號，例如「MTK／M／發哥」都是聯發科。代號經 PTT Stock「公司綽號」整理文、工商時報外號盤點等來源交叉比對，
          無法確認的（寶寶、三角、小W）不併入任何公司；完整列表見<Link href="/nicknames/" className="underline">代號對照表</Link>（{nicknamed.length} 間）。
          「新創」「某外商」等未具名資料（{meta.anonymousRows} 筆）只計入產業與職務統計。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">開放資料</h2>
        <p>彙總統計以 CC BY 4.0 授權開放下載（不含逐筆資料與心得），引用時請註明「科技業薪資參考 pay.operation.tw」：</p>
        <ul className="mt-1 list-disc pl-5">
          <li>
            <a href="/data/companies.csv" className="underline">companies.csv</a>：各公司統計（含官方非主管薪資中位數）
          </li>
          <li>
            <a href="/data/roles.csv" className="underline">roles.csv</a>：各職務統計
          </li>
          <li>
            <a href="/data/industries.csv" className="underline">industries.csv</a>：各產業統計
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">營運原則</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>核心資料永久免費，不做「分享才解鎖」或付費牆。</li>
          <li>不接受任何形式的付費修改、隱藏或置頂數字；公司只能透過下架政策提出申請，標準與一般申請相同。</li>
          <li>
            若未來接受贊助或職缺刊登，會清楚標示並與薪資數據分開呈現。合作請透過<Link href="/report/?kind=contact" className="underline">聯絡表單</Link>。
          </li>
        </ul>
      </section>
    </article>
  );
}
