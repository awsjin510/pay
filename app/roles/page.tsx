import type { Metadata } from "next";
import Link from "next/link";
import { RangeBar } from "@/components/RangeBar";
import { fmtWan, roles } from "@/lib/data";

export const metadata: Metadata = { title: "職務薪資" };

export default function RolesPage() {
  const list = roles.filter((r) => r.stats).sort((a, b) => (b.stats!.monthly?.median ?? 0) - (a.stats!.monthly?.median ?? 0));
  const max = Math.max(...list.map((r) => r.stats!.monthly?.p75 ?? 0), 1) * 1.05;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">職務薪資</h1>
        <p className="mt-1 text-sm text-ink-2">職務名稱是自由填寫，這裡依關鍵字歸類；只填「工程師」「RD」的歸在「研發（未細分）」。</p>
      </header>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="text-left text-xs text-ink-2">
            <tr>
              <th className="px-3 py-2 font-normal">職務</th>
              <th className="px-3 py-2 text-right font-normal">筆數</th>
              <th className="px-3 py-2 font-normal">月底薪分布</th>
              <th className="px-3 py-2 text-right font-normal">月薪中位數</th>
              <th className="px-3 py-2 text-right font-normal">年薪中位數</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {list.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <Link href={`/roles/${r.id}/`} className="hover:text-accent">
                    {r.label}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right text-ink-2">{r.stats!.n}</td>
                <td className="w-1/3 px-3 py-2">
                  <RangeBar dist={r.stats!.monthly} max={max} />
                </td>
                <td className="px-3 py-2 text-right">{fmtWan(r.stats!.monthly?.median)}</td>
                <td className="px-3 py-2 text-right">{fmtWan(r.stats!.annual?.median, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
