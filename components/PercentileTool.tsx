"use client";

import { useState } from "react";

// "Where do I stand": share of submissions whose monthly base pay is below the input.
export function PercentileTool({ values, scope }: { values: number[]; scope: string }) {
  const [input, setInput] = useState("");
  if (values.length < 3) return null;
  const v = Number(input);
  const valid = input !== "" && Number.isFinite(v) && v > 0;
  const below = valid ? values.filter((x) => x < v).length + values.filter((x) => x === v).length / 2 : 0;
  const pct = valid ? Math.round((below / values.length) * 100) : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <span>我的月底薪</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={0.1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="例如 7.5"
          className="w-24 rounded border border-border bg-background px-2 py-1"
        />
        <span>萬</span>
      </label>
      <p className="tabular mt-2 text-sm text-ink-2" aria-live="polite">
        {pct == null ? (
          <>輸入後顯示你在「{scope}」{values.length} 筆分享中的位置。</>
        ) : (
          <>
            高於 <span className="text-lg font-semibold text-ink">{pct}%</span> 的「{scope}」分享（共 {values.length} 筆，PR {Math.min(99, pct)}）
          </>
        )}
      </p>
    </div>
  );
}
