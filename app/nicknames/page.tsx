import type { Metadata } from "next";
import Link from "next/link";
import { companies, fmtWan, nicknamesOf, trackLabel } from "@/lib/data";

export const metadata: Metadata = {
  title: "PTT 科技公司代號對照表",
  description: "螃蟹是瑞昱、滷肉是聯詠、肉鬆是廣達、海邊是鴻海……PTT 科技業公司代號與對應薪資一覽。",
  alternates: { canonical: "/nicknames/" },
};

export default function NicknamesPage() {
  const list = companies.filter((c) => nicknamesOf(c).length);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black sm:text-4xl">PTT 科技公司代號對照表</h1>
        <p className="mt-1 text-sm text-ink-2">
          代號經 PTT Stock「公司綽號」整理文、工商時報外號盤點等來源交叉比對；無法確認的（寶寶、三角、小W 等）不列入。
        </p>
      </header>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="text-left text-xs text-ink-2">
            <tr>
              <th className="px-3 py-2 font-normal">代號</th>
              <th className="px-3 py-2 font-normal">公司</th>
              <th className="px-3 py-2 font-normal">產業</th>
              <th className="px-3 py-2 text-right font-normal">月底薪中位數</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {list.map((c) => (
              <tr key={c.slug} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{nicknamesOf(c).join("、")}</td>
                <td className="px-3 py-2">
                  <Link href={`/companies/${c.slug}/`} className="hover:text-accent">
                    {c.name}薪資
                  </Link>
                </td>
                <td className="px-3 py-2 text-ink-2">{trackLabel(c.track)}</td>
                <td className="px-3 py-2 text-right">{fmtWan(c.stats?.monthly?.median)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
