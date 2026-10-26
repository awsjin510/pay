import type { Metadata } from "next";
import Link from "next/link";
import { OfferCalculator } from "@/components/OfferCalculator";

export const metadata: Metadata = {
  title: "多份 offer 總薪酬試算：4 年下來哪個拿最多？",
  description: "把底薪、年終、員工酬勞、股票歸屬、簽約金和調薪放在一起，算出每份 offer 第一年與 4 年的總薪酬，還能算時薪。免費、數字不會送出。",
  alternates: { canonical: "/offer/compare/" },
};

export default function OfferComparePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black sm:text-4xl">多份 offer，4 年下來哪個拿最多？</h1>
        <p className="mt-2 max-w-2xl text-ink-2">
          月薪高不一定總額高。把年終、分紅、股票、簽約金和調薪一起算，看第一年和 4 年的總薪酬。想知道單一 offer 在市場上的位置，用
          <Link href="/offer/" className="mx-1 text-accent underline">
            Offer 檢查
          </Link>
          。
        </p>
      </header>
      <OfferCalculator />
    </div>
  );
}
