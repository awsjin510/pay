"use client";

import { useState } from "react";
import { linear, niceTicks } from "@/components/charts/scale";
import { useWidth } from "@/components/charts/useWidth";
import type { Dist } from "@/lib/data";

export type CurvePoint = { label: string; n: number; monthly: Dist | null };

const H = 240;
const M = { t: 16, r: 16, b: 34, l: 40 };

// Median monthly pay by years of experience, with the P25–P75 band. Buckets with fewer than
// three entries have no point, and the line breaks there instead of inventing a value.
export function ExperienceCurve({ points, title = "年資與月底薪" }: { points: CurvePoint[]; title?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [box, W] = useWidth<HTMLDivElement>();
  const valid = points.filter((p) => p.monthly);
  if (valid.length < 3) return null;

  const lo = Math.floor(Math.min(...valid.map((p) => p.monthly!.p25)) - 0.5);
  const hi = Math.ceil(Math.max(...valid.map((p) => p.monthly!.p75)) + 0.5);
  const y = linear(lo, hi, H - M.b, M.t);
  const band = (W - M.l - M.r) / points.length;
  const x = (i: number) => M.l + band * (i + 0.5);
  const ticks = niceTicks(lo, hi, 5);

  // Consecutive runs of buckets that have data become separate line/band segments.
  const runs: number[][] = [];
  points.forEach((p, i) => {
    if (!p.monthly) return;
    const last = runs.at(-1);
    if (last && last.at(-1) === i - 1) last.push(i);
    else runs.push([i]);
  });
  const h = hover != null ? points[hover] : null;

  return (
    <figure className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <figcaption>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-ink-3">線是中位數，色帶是中間一半的人；少於 3 筆的年資不畫</div>
      </figcaption>
      <div ref={box} className="mt-3" style={{ minHeight: H }}>
      {W > 0 && (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={`${title}：${valid.map((p) => `${p.label} 年 ${p.monthly!.median} 萬`).join("，")}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="var(--grid)" />
            <text x={M.l - 8} y={y(t) + 4} textAnchor="end" className="tabular" fontSize={11} fill="var(--ink-3)">
              {t}
            </text>
          </g>
        ))}
        {runs.map((run) => {
          const top = run.map((i) => `${x(i)},${y(points[i].monthly!.p75)}`);
          const bottom = [...run].reverse().map((i) => `${x(i)},${y(points[i].monthly!.p25)}`);
          return (
            <g key={run[0]}>
              <polygon points={[...top, ...bottom].join(" ")} fill="var(--data-soft)" />
              <polyline points={run.map((i) => `${x(i)},${y(points[i].monthly!.median)}`).join(" ")} fill="none" stroke="var(--data)" strokeWidth={2} strokeLinejoin="round" />
            </g>
          );
        })}
        {hover != null && <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={H - M.b} stroke="var(--ink-3)" strokeDasharray="3 3" />}
        {points.map((p, i) =>
          p.monthly ? <circle key={p.label} cx={x(i)} cy={y(p.monthly.median)} r={hover === i ? 6 : 4} fill="var(--data)" stroke="var(--surface)" strokeWidth={2} /> : null,
        )}
        {points.map((p, i) => (
          <text key={p.label} x={x(i)} y={H - M.b + 18} textAnchor="middle" className="tabular" fontSize={11} fill={p.monthly ? "var(--ink-2)" : "var(--ink-3)"}>
            {p.label}
          </text>
        ))}
        <text x={W - M.r} y={H - 2} textAnchor="end" fontSize={11} fill="var(--ink-3)">
          相關年資（年）
        </text>
        {points.map((p, i) => (
          <rect key={p.label} x={x(i) - band / 2} y={M.t} width={band} height={H - M.t - M.b} fill="transparent" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onClick={() => setHover(i)} />
        ))}
      </svg>
      )}
      </div>
      <p className="tabular min-h-6 text-sm text-ink-2" aria-live="polite">
        {h
          ? h.monthly
            ? `年資 ${h.label} 年：中位數 ${h.monthly.median} 萬，中間一半落在 ${h.monthly.p25}–${h.monthly.p75} 萬（${h.monthly.n} 筆）`
            : `年資 ${h.label} 年：只有 ${h.n} 筆，不足以計算`
          : "點一下或把游標移到圖上，看各年資的數字。"}
      </p>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>年資</th>
            <th>中位數</th>
            <th>P25</th>
            <th>P75</th>
            <th>筆數</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.label}>
              <td>{p.label}</td>
              <td>{p.monthly?.median ?? "—"}</td>
              <td>{p.monthly?.p25 ?? "—"}</td>
              <td>{p.monthly?.p75 ?? "—"}</td>
              <td>{p.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
