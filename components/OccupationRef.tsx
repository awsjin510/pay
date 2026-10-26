import Link from "next/link";
import type { OccupationRef as Ref } from "@/lib/data";

// Industries worth showing next to tech roles; media and the broad totals are left out.
const SHOWN = ["電腦程式設計、諮詢及相關服務業", "資訊服務業", "電子零組件製造業", "金融及保險業", "電信業"];

export function OccupationRef({ data, crowdMonthly }: { data: Ref; crowdMonthly?: number | null }) {
  const rows = data.rows.filter((r) => SHOWN.includes(r.industry)).sort((a, b) => SHOWN.indexOf(a.industry) - SHOWN.indexOf(b.industry));
  if (!rows.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-sm">
      <div className="text-xs text-ink-2">
        官方參考・勞動部 {data.year} 年職類別薪資調查：{data.occupation}
      </div>
      <table className="tabular mt-2 w-full">
        <thead className="text-left text-xs text-ink-3">
          <tr>
            <th className="py-1 font-normal">行業</th>
            <th className="py-1 text-right font-normal">月經常性薪資</th>
            <th className="py-1 text-right font-normal">{data.annualYear} 全年薪資</th>
            <th className="py-1 text-right font-normal">受僱人數</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.industry} className="border-t border-border">
              <td className="py-1.5">{r.industry}</td>
              <td className="py-1.5 text-right">{r.monthly.toFixed(1)} 萬</td>
              <td className="py-1.5 text-right">{r.annual != null ? `${r.annual} 萬` : "—"}</td>
              <td className="py-1.5 text-right text-ink-2">{r.employees.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-ink-3">
        經常性薪資＝月底薪＋固定津貼，不含年終與加班費，可和本站「月底薪」大致對照
        {crowdMonthly != null && `（本站中位數 ${crowdMonthly} 萬）`}；全年薪資含獎金。為平均數，非中位數。
        <Link href="/sectors/it-services/" className="ml-1 underline">
          看資訊服務業完整職類表
        </Link>
      </p>
    </div>
  );
}
