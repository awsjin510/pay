import type { Metadata } from "next";
import { OfferChecker } from "@/components/OfferChecker";
import { meta } from "@/lib/data";

export const metadata: Metadata = {
  title: "Offer 檢查器：這個薪水算高還是低？",
  description: "輸入公司、職務、年資與 offer 月薪，立刻知道在同公司、同職務、相近年資的人裡算偏低、合理還是偏高，並附可信度與官方薪資對照。免費、不記錄。",
  alternates: { canonical: "/offer/" },
};

export default function OfferPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black sm:text-4xl">這個 offer 算高還是低？</h1>
        <p className="mt-2 max-w-2xl text-ink-2">
          和同公司、同職務、相近年資的 {meta.total.toLocaleString()} 筆分享比對，告訴你偏低、合理還是偏高，以及這個結論有多可信。
        </p>
      </header>
      <OfferChecker roleLabels={meta.roleLabels} />
    </div>
  );
}
