"use client";

import { useState } from "react";

export type AcrossRow = { code: string; industry: string; major: boolean; employees: number; monthly: number; annual: number | null };

const TABS = [
  { id: "pro", label: "資訊及通訊專業人員", hint: "系統分析、程式設計、資料庫、網路" },
  { id: "tech", label: "資訊管理及維護技術員", hint: "MIS、網管、IT 支援" },
] as const;

// The same IT occupation in every industry that reports it: where does it pay most?
export function ItAcrossIndustries({ pro, tech, year, annualYear }: { pro: AcrossRow[]; tech: AcrossRow[]; year: number; annualYear: number }) {
  const [tab, setTab] = useState<"pro" | "tech">("pro");
  const rows = tab === "pro" ? pro : tech;
  const max = Math.max(...pro.map((r) => r.monthly), ...tech.map((r) => r.monthly), 1);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-3 py-1 text-sm ${tab === t.id ? "border-accent bg-accent-soft text-ink" : "border-border text-ink-2 hover:text-ink"}`}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-ink-3">{t.hint}</span>
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-surface-2 text-left text-xs text-ink-2">
            <tr>
              <th className="px-3 py-2 font-normal">行業</th>
              <th className="px-3 py-2 font-normal">{year} 年 7 月經常性薪資</th>
              <th className="px-3 py-2 text-right font-normal">{annualYear} 全年薪資</th>
              <th className="px-3 py-2 text-right font-normal">受僱人數</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.map((r) => (
              <tr key={r.code} className="border-t border-border">
                <td className={`px-3 py-2 font-sans ${r.major ? "font-medium" : "pl-6 text-ink-2"}`}>{r.industry}</td>
                <td className="w-2/5 px-3 py-2">
                  <div className="flex items-center gap-2" title={`${r.industry}：${r.monthly} 萬`}>
                    <div className="h-2.5 flex-1 rounded-sm bg-grid/60">
                      <div className="h-full rounded-sm bg-official" style={{ width: `${(r.monthly / max) * 100}%` }} />
                    </div>
                    <span className="w-14 text-right">{r.monthly.toFixed(1)} 萬</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">{r.annual != null ? `${r.annual} 萬` : "—"}</td>
                <td className="px-3 py-2 text-right text-ink-2">{r.employees.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-3">粗體是行業大類，縮排是其中的細分行業。平均數；少於可公布門檻的行業不列出。</p>
    </div>
  );
}
