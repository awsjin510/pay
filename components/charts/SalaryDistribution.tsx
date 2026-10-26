"use client";

import { useMemo, useState } from "react";
import { fmt, linear, niceTicks, quantile } from "@/components/charts/scale";
import { useWidth } from "@/components/charts/useWidth";

const PAD = { l: 16, r: 16 };
const R = 4; // 8px markers
const STEP = R * 2 + 1.5;
const MAX_PER_SIDE = 7; // beyond this a dot stack is unreadable, so switch to a histogram
const TOP = 22; // room for the median label
const AXIS = 22;
const BAR_H = 110;

type Dot = { v: number; cx: number; off: number };
type Bin = { from: number; to: number; count: number };

// Small samples: every submission is a dot, stacked where they collide. Large samples: a
// histogram. Either way the middle half is a band, the median a line, and "你" can be dropped
// onto the same axis to get a percentile.
export function SalaryDistribution({ values, scope }: { values: number[]; scope: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [box, W] = useWidth<HTMLDivElement>();

  const layout = useMemo(() => {
    const lo = Math.floor(values[0]);
    const hi = Math.ceil(values[values.length - 1]);
    const x = linear(lo, hi, PAD.l, W - PAD.r);
    const stacks = new Map<number, number>();
    const dots: Dot[] = values.map((v) => {
      const col = Math.round(x(v) / STEP);
      const k = stacks.get(col) ?? 0;
      stacks.set(col, k + 1);
      return { v, cx: x(v), off: k === 0 ? 0 : (k % 2 ? -1 : 1) * Math.ceil(k / 2) * STEP };
    });
    const perSide = Math.max(...[...stacks.values()].map((k) => Math.ceil((k - 1) / 2)));
    const mode = perSide <= MAX_PER_SIDE ? ("dots" as const) : ("bars" as const);

    // Bin width: the smallest of these that keeps bars at least ~12px wide.
    const binW = [0.25, 0.5, 1, 2, 5].find((w) => (hi - lo) / w <= (W - PAD.l - PAD.r) / 12) ?? 5;
    const bins: Bin[] = [];
    for (let f = lo; f < hi; f += binW) bins.push({ from: f, to: f + binW, count: 0 });
    for (const v of values) bins[Math.min(bins.length - 1, Math.floor((v - lo) / binW))].count++;

    const plotH = mode === "dots" ? perSide * STEP * 2 + R * 2 + 12 : BAR_H;
    return { x, dots, bins, mode, plotH, ticks: niceTicks(lo, hi, Math.max(3, Math.floor(W / 110))) };
  }, [values, W]);

  if (values.length < 3) return null;
  const { x, dots, bins, mode, plotH, ticks } = layout;
  const H = TOP + plotH + AXIS;
  const base = TOP + plotH; // bottom of the plot area
  const mid = TOP + plotH / 2;
  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const p25 = quantile(values, 0.25);
  const p50 = quantile(values, 0.5);
  const p75 = quantile(values, 0.75);
  const mine = Number(input);
  const hasMine = input !== "" && Number.isFinite(mine) && mine > 0;
  const below = hasMine ? values.filter((v) => v < mine).length + values.filter((v) => v === mine).length / 2 : 0;
  const pct = hasMine ? Math.round((below / values.length) * 100) : null;
  const mineX = hasMine ? Math.min(Math.max(x(mine), PAD.l), W - PAD.r) : 0;
  const hovered =
    hover == null ? null : mode === "dots" ? `${fmt(dots[hover].v)} 萬` : `${fmt(bins[hover].from)}–${fmt(bins[hover].to)} 萬：${bins[hover].count} 筆`;

  return (
    <figure className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <figcaption className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-medium">月底薪分布</div>
          <div className="text-xs text-ink-3">
            {mode === "dots" ? `每個點是一筆分享（${values.length} 筆）` : `${values.length} 筆分享的分布`}，色帶是中間一半的人
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          我的月底薪
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="7.5"
            className="tabular w-20 rounded-lg border border-border bg-background px-2 py-1 text-right"
          />
          萬
        </label>
      </figcaption>

      <div ref={box} className="mt-3" style={{ minHeight: H }}>
        {W > 0 && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={`${scope}月底薪分布：P25 ${fmt(p25)} 萬、中位數 ${fmt(p50)} 萬、P75 ${fmt(p75)} 萬`}>
          <rect x={x(p25)} y={TOP} width={Math.max(x(p75) - x(p25), 2)} height={plotH} rx={4} fill="var(--data-soft)" />

          {mode === "dots" &&
            dots.map((d, i) => (
              <circle
                key={i}
                cx={d.cx}
                cy={mid + d.off}
                r={hover === i ? R + 1.5 : R}
                fill="var(--data)"
                stroke="var(--surface)"
                strokeWidth={2}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onClick={() => setHover(i)}
              />
            ))}

          {mode === "bars" &&
            bins.map((b, i) => {
              const h = (b.count / maxCount) * (plotH - 6);
              const bx = x(b.from) + 1;
              const bw = Math.max(x(b.to) - x(b.from) - 2, 1);
              return (
                <g key={b.from} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onClick={() => setHover(i)}>
                  <rect x={bx - 1} y={TOP} width={bw + 2} height={plotH} fill="transparent" />
                  {b.count > 0 && <path d={`M${bx},${base} v${-h + 2} q0,-2 2,-2 h${bw - 4} q2,0 2,2 v${h - 2} z`} fill="var(--data)" opacity={hover == null || hover === i ? 1 : 0.55} />}
                </g>
              );
            })}

          <line x1={x(p50)} x2={x(p50)} y1={TOP - 4} y2={base} stroke="var(--ink)" strokeWidth={2} />
          <text x={x(p50)} y={TOP - 8} textAnchor="middle" className="tabular" fontSize={12} fill="var(--ink)">
            中位數 {fmt(p50)} 萬
          </text>

          {hasMine && (
            <g>
              <line x1={mineX} x2={mineX} y1={TOP} y2={base} stroke="var(--ink)" strokeWidth={2} strokeDasharray="4 3" />
              <text x={mineX} y={base - 4} dx={mineX > W - 60 ? -6 : 6} textAnchor={mineX > W - 60 ? "end" : "start"} fontSize={12} fontWeight={700} fill="var(--ink)">
                你
              </text>
            </g>
          )}

          <line x1={PAD.l} x2={W - PAD.r} y1={base + 0.5} y2={base + 0.5} stroke="var(--grid)" />
          {ticks.map((t) => (
            <text key={t} x={x(t)} y={H - 4} textAnchor="middle" className="tabular" fontSize={11} fill="var(--ink-3)">
              {t}
            </text>
          ))}
        </svg>
        )}
      </div>
      <p className="tabular mt-1 min-h-6 text-sm text-ink-2" aria-live="polite">
        {hovered ??
          (pct == null ? (
            <>中間一半的人落在 {fmt(p25)}–{fmt(p75)} 萬。輸入你的月底薪，看你在「{scope}」的位置。</>
          ) : (
            <>
              你高於 <strong className="text-base text-ink">{pct}%</strong> 的「{scope}」分享（PR {Math.min(99, pct)}）。
            </>
          ))}
      </p>
    </figure>
  );
}
