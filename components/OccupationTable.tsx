"use client";

import { useState } from "react";
import type { MolOccupation } from "@/lib/data";

type Industry = { code: string; label: string; occupations: MolOccupation[] };

// One industry's occupations at a time, grouped under their 職類大類, bars on a shared scale.
export function OccupationTable({ industries, annualYear }: { industries: Industry[]; annualYear: number }) {
  const [code, setCode] = useState(industries[0]?.code);
  const ind = industries.find((i) => i.code === code) ?? industries[0];
  const max = Math.max(...industries.flatMap((i) => i.occupations.filter((o) => !o.name.startsWith("高階")).map((o) => o.monthly)), 1);

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2 text-sm" role="tablist">
        {industries.map((i) => (
          <button
            key={i.code}
            role="tab"
            aria-selected={i.code === ind.code}
            onClick={() => setCode(i.code)}
            className={`min-h-11 rounded-full border px-3 py-0.5 sm:min-h-0 ${i.code === ind.code ? "border-accent text-ink" : "border-border text-ink-2 hover:text-ink"}`}
          >
            {i.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="text-left text-xs text-ink-2">
            <tr>
              <th className="px-3 py-2 font-normal">職類</th>
              <th className="px-3 py-2 font-normal">月經常性薪資</th>
              <th className="px-3 py-2 text-right font-normal">{annualYear} 全年薪資</th>
              <th className="px-3 py-2 text-right font-normal">受僱人數</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {ind.occupations.map((o) => (
              <tr key={o.name} className={`border-t border-border ${o.major ? "bg-background font-medium" : ""}`}>
                <td className={`px-3 py-2 ${o.major ? "" : "pl-6"}`}>{o.name}</td>
                <td className="w-2/5 px-3 py-2">
                  <div className="flex items-center gap-2" title={`${o.name}：月經常性薪資 ${o.monthly} 萬`}>
                    <div className="h-2.5 flex-1 rounded-sm bg-grid/60">
                      <div className="h-full rounded-sm bg-official" style={{ width: `${Math.min(100, (o.monthly / max) * 100)}%` }} />
                    </div>
                    <span className="w-14 text-right">{o.monthly.toFixed(1)} 萬</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">{o.annual != null ? `${o.annual} 萬` : "—"}</td>
                <td className="px-3 py-2 text-right text-ink-2">{o.employees.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
