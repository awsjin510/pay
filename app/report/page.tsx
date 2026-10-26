import type { Metadata } from "next";
import { ReportForm } from "@/components/Forms";

export const metadata: Metadata = {
  title: "下架申請與回報",
  description: "申請下架不實或可識別個人的內容、回報資料錯誤，或聯絡合作。",
  alternates: { canonical: "/report/" },
};

export default function ReportPage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <section>
        <h1 className="text-2xl font-semibold">下架申請與回報</h1>
        <p className="mt-2 mb-6 text-sm text-ink-2">公司、當事人或投稿者都可以使用。不需要登入。</p>
        <ReportForm />
      </section>
      <aside className="space-y-4 text-sm leading-7">
        <h2 className="text-lg font-semibold">處理原則</h2>
        <ul className="list-disc space-y-1 pl-5 text-ink-2">
          <li>收到後 7 個工作天內處理；有留聯絡方式的會回覆結果。</li>
          <li>具名指控、未經證實的違法情事、可識別個人的內容：確認後直接下架。</li>
          <li>薪資數字本身與主觀感受屬於意見分享，原則上保留；若有明顯錯誤會修正或標註。</li>
          <li>下架後的資料會從下一次網站更新起移除，也不會出現在開放資料中。</li>
        </ul>
      </aside>
    </div>
  );
}
