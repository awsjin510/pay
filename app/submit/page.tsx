import type { Metadata } from "next";
import { SubmitForm } from "@/components/Forms";

export const metadata: Metadata = {
  title: "匿名分享薪資",
  description: "匿名分享你的科技業薪資、年終、工時與面試經驗，審核後彙整公開，免費查詢。",
  alternates: { canonical: "/submit/" },
};

export default function SubmitPage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="text-3xl font-black sm:text-4xl">匿名分享薪資</h1>
        <p className="mt-2 mb-6 text-ink-2">
          30 秒、不用註冊。送出後馬上看到你在同產業、同公司的位置，還能下載一張不含金額的分享圖。網站資料永遠免費查詢。
        </p>
        <SubmitForm />
      </section>
      <aside className="space-y-4 text-sm leading-7">
        <h2 className="text-xl font-bold">投稿規範</h2>
        <ul className="list-disc space-y-1 pl-5 text-ink-2">
          <li>只分享本人經驗，數字盡量準確；月底薪以「萬」為單位。</li>
          <li>主觀感受（推不推、累不累、氣氛）可以寫；請勿寫人名、具名指控或未經證實的違法情事。</li>
          <li>不要寫部門代號、主管姓氏、專案名稱等能認出你或他人的細節。</li>
          <li>同一職稱在全站只出現一次時，公開時會改顯示職務分類，保護投稿者。</li>
          <li>只有數字、且數字合理的投稿會自動通過；有填心得、證照、面試題型等文字的投稿，人工審核後才公開。</li>
          <li>明顯錯誤、重複或廣告的投稿不予刊登。</li>
        </ul>
        <h2 className="text-xl font-bold">隱私</h2>
        <p className="text-ink-2">
          我們不收集姓名或 email。為防灌票，僅記錄當日加鹽的 IP 雜湊值（隔天即無法比對），不公開、不提供第三方。網站使用統計只累計「事件次數」（例如今天有幾人送出投稿），不含任何個人、裝置或薪資資料。
        </p>
      </aside>
    </div>
  );
}
