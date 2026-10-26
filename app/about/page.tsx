import type { Metadata } from "next";
import { companies, meta } from "@/lib/data";

export const metadata: Metadata = { title: "資料說明" };

const f = (key: string) => (meta.flags as Record<string, number>)[key] ?? 0;

export default function AboutPage() {
  const nicknames = companies.filter((c) => c.verified && c.aliases.some((a) => /^[^\x00-\x7f]{1,3}$/.test(a) && !c.name.includes(a)));

  return (
    <article className="max-w-3xl space-y-8 text-sm leading-7">
      <h1 className="text-2xl font-semibold">資料說明</h1>

      <section>
        <h2 className="mb-2 text-lg font-semibold">來源</h2>
        <p>
          資料來自網友匿名填寫的「薪資紀錄」Google 試算表，分為純軟、系統廠、IC 設計三個分頁，共 {meta.total.toLocaleString()} 筆，
          已取得授權整理公開。每次更新時重新抓取並清理，最後更新：{meta.generatedAt.slice(0, 10)}。
        </p>
        <ul className="mt-2 list-disc pl-5 text-ink-2">
          {Object.entries(meta.years).map(([y, n]) => (
            <li key={y}>
              {y === "unknown" ? "日期不明" : `${y} 年`}：{n} 筆
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">清理規則</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>月底薪單位統一為「萬」：填成元的 {f("monthly_unit_yuan")} 筆除以 10,000；介於 50–200 的 {f("monthly_unit_guess_k")} 筆視為千元除以 10；仍不合理的 {f("monthly_invalid")} 筆不採計。</li>
          <li>總年薪填成元的 {f("annual_unit_yuan")} 筆換算為萬；不合理的 {f("annual_invalid")} 筆不採計。未填總年薪但有月薪與 Bonus 的 {f("annual_estimated")} 筆，以「月薪 ×（12 + Bonus）」估算並標示「≈」。</li>
          <li>Bonus 填百分比的 {f("bonus_from_percent")} 筆換算為月數；超過 60 個月等不合理值 {f("bonus_invalid")} 筆不採計。</li>
          <li>總年薪含分紅，本來就可能高於「月薪 ×（12 + Bonus）」；只有低於 12 個月底薪的 {f("annual_below_base")} 筆會被標記為可疑。</li>
          <li>職級是各公司自己的制度（例如 E7、L4、高工），無法跨公司比較，統計改用「相關年資」分段。</li>
          <li>任何公司或職務少於 {meta.minN} 筆時不顯示統計，避免誤導與識別填寫者。</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">公司名稱與代號</h2>
        <p>
          同一間公司常有多種寫法與 PTT 代號，例如「MTK／M／發哥」都是聯發科。代號對照經 PTT Stock「公司綽號」整理文、工商時報外號盤點等來源交叉比對，
          無法確認的代號（例如「寶寶」「三角」「小W」）維持原樣，不併入任何公司。「新創」「某外商」等未具名資料（{meta.anonymousRows} 筆）只計入產業與職務統計。
        </p>
        <ul className="mt-2 grid gap-1 text-ink-2 sm:grid-cols-2">
          {nicknames.map((c) => (
            <li key={c.slug}>
              {c.name}：{c.aliases.filter((a) => /^[^\x00-\x7f]{1,3}$/.test(a) && !c.name.includes(a)).join("、")}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">心得內容</h2>
        <p>
          心得為填寫者個人意見，不代表本站立場。含有針對特定個人的貶損字眼（例如人身攻擊、未經查證的指控）的 {f("comment_harsh")} 則心得不公開，
          只保留該筆的薪資數字。若您認為某則內容不實或侵權，請到{" "}
          <a href="https://github.com/awsjin510/pay/issues" className="underline">
            GitHub Issues
          </a>{" "}
          回報，我們會儘快下架。
        </p>
      </section>
    </article>
  );
}
