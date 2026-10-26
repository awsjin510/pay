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
        <p className="mt-2 mb-6 text-sm text-ink-2">不需要註冊。每筆投稿人工審核後才會公開，網站資料永遠免費查詢，不用「分享才解鎖」。</p>
        <SubmitForm />
      </section>
      <aside className="space-y-4 text-sm leading-7">
        <h2 className="text-xl font-bold">投稿規範</h2>
        <ul className="list-disc space-y-1 pl-5 text-ink-2">
          <li>只分享本人經驗，數字盡量準確；月底薪以「萬」為單位。</li>
          <li>主觀感受（推不推、累不累、氣氛）可以寫；請勿寫人名、具名指控或未經證實的違法情事。</li>
          <li>不要寫部門代號、主管姓氏、專案名稱等能認出你或他人的細節。</li>
          <li>同一職稱在全站只出現一次時，公開時會改顯示職務分類，保護投稿者。</li>
          <li>明顯錯誤、重複或廣告的投稿不予刊登。</li>
        </ul>
        <h2 className="text-xl font-bold">隱私</h2>
        <p className="text-ink-2">
          我們不收集姓名或 email。為防灌票，僅記錄當日加鹽的 IP 雜湊值（隔天即無法比對），不公開、不提供第三方。
        </p>
      </aside>
    </div>
  );
}
