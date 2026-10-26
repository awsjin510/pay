"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { OFFER_PREFILL_KEY, type OfferPrefill } from "@/components/Forms";
import { Payslip } from "@/components/Payslip";
import { toWan, WanInput } from "@/components/WanInput";
import { track } from "@/lib/track";

type IndexEntry = { s: string; n: string; e: string | null; a: string[]; t: string; c: number };
type OfferIndex = {
  companies: string[];
  roles: string[];
  tracks: string[];
  official: Record<string, number>;
  recentFromYear: number;
  rows: [number, number, number, number, number, number][];
};
type Level = { id: string; label: string; industryLevel: boolean; match: (r: OfferIndex["rows"][number]) => boolean };
type Result = {
  level: Level;
  n: number;
  recent: number;
  p25: number;
  median: number;
  p75: number;
  pct: number;
  verdict: "low" | "fair" | "high";
  confidence: "high" | "medium" | "low";
  companyName: string | null;
  official: number | null;
  annual: number;
  annualAssumed: boolean;
};

const TRACK_LABELS: Record<string, string> = { soft: "純軟", system: "系統廠", ic: "IC 設計" };
const VERDICT = { low: "偏低", fair: "合理", high: "偏高" } as const;
const CONFIDENCE = { high: "高", medium: "中", low: "低" } as const;
const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
const q = (s: number[], p: number) => {
  const pos = (s.length - 1) * p;
  const lo = Math.floor(pos);
  return Math.round((s[lo] + (s[Math.ceil(pos)] - s[lo]) * (pos - lo)) * 10) / 10;
};

const input = "w-full rounded-lg border border-border bg-background px-3 py-2";

let cache: Promise<[OfferIndex, IndexEntry[]]> | null = null;
const load = () =>
  (cache ??= Promise.all([fetch("/offer-index.json").then((r) => r.json()), fetch("/search-index.json").then((r) => r.json())]) as Promise<
    [OfferIndex, IndexEntry[]]
  >);

// Narrowest comparison that still has 3+ rows: same company & role & experience first,
// widening to the whole industry. Everything runs in the browser; the offer is never sent.
function evaluate(data: OfferIndex, index: IndexEntry[], f: { company: string; track: string; role: string; yoe: number; monthly: number; bonus: number | null }): Result | null {
  const entry = index.find((e) => [e.n, e.e ?? "", ...e.a].some((x) => norm(x) === norm(f.company)));
  const ci = entry ? data.companies.indexOf(entry.s) : -1;
  const ti = data.tracks.indexOf(entry?.t ?? f.track);
  const ri = data.roles.indexOf(f.role);
  const near = (y: number) => y >= 0 && Math.abs(y - f.yoe) <= 2;
  const roleName = f.role ? `同職務` : "";
  const levels: Level[] = [
    ...(ci >= 0 && ri >= 0 ? [{ id: "company-role-yoe", label: `${entry!.n}・${roleName}・年資相近`, industryLevel: false, match: (r: OfferIndex["rows"][number]) => r[0] === ci && r[2] === ri && near(r[3]) }] : []),
    ...(ci >= 0 ? [{ id: "company", label: `${entry!.n}（所有職務）`, industryLevel: false, match: (r: OfferIndex["rows"][number]) => r[0] === ci }] : []),
    ...(ri >= 0 ? [{ id: "track-role-yoe", label: `${TRACK_LABELS[data.tracks[ti]]}・${roleName}・年資相近`, industryLevel: false, match: (r: OfferIndex["rows"][number]) => r[1] === ti && r[2] === ri && near(r[3]) }] : []),
    ...(ri >= 0 ? [{ id: "track-role", label: `${TRACK_LABELS[data.tracks[ti]]}・${roleName}`, industryLevel: false, match: (r: OfferIndex["rows"][number]) => r[1] === ti && r[2] === ri }] : []),
    { id: "track-yoe", label: `${TRACK_LABELS[data.tracks[ti]]}・年資相近`, industryLevel: true, match: (r) => r[1] === ti && near(r[3]) },
    { id: "track", label: `${TRACK_LABELS[data.tracks[ti]]}整體`, industryLevel: true, match: (r) => r[1] === ti },
  ];
  for (const level of levels) {
    const rows = data.rows.filter(level.match);
    if (rows.length < 3) continue;
    const vals = rows.map((r) => r[4]).sort((a, b) => a - b);
    const recent = rows.filter((r) => r[5] >= data.recentFromYear).length;
    const p25 = q(vals, 0.25);
    const p75 = q(vals, 0.75);
    const pct = Math.round(((vals.filter((v) => v < f.monthly).length + vals.filter((v) => v === f.monthly).length / 2) / vals.length) * 100);
    return {
      level,
      n: rows.length,
      recent,
      p25,
      median: q(vals, 0.5),
      p75,
      pct,
      verdict: f.monthly < p25 ? "low" : f.monthly > p75 ? "high" : "fair",
      confidence: level.industryLevel ? "low" : rows.length >= 10 && recent > 0 ? "high" : "medium",
      companyName: entry?.n ?? null,
      official: entry ? (data.official[entry.s] ?? null) : null,
      annual: Math.round(f.monthly * (12 + (f.bonus ?? 2)) * 10) / 10,
      annualAssumed: f.bonus == null,
    };
  }
  return null;
}

export function OfferChecker({ roleLabels }: { roleLabels: Record<string, string> }) {
  const router = useRouter();
  const [data, setData] = useState<[OfferIndex, IndexEntry[]] | null>(null);
  const [result, setResult] = useState<Result | null | "none">(null);
  const [last, setLast] = useState<OfferPrefill | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const suggestions = useMemo(() => (data ? [...data[1]].sort((a, b) => b.c - a.c).slice(0, 400) : []), [data]);
  const roleOptions = Object.entries(roleLabels).filter(([id]) => id !== "other");

  useEffect(() => {
    track("offer_view");
    load().then((d) => {
      setData(d);
      const slug = new URLSearchParams(window.location.search).get("company");
      const hit = slug ? d[1].find((e) => e.s === slug) : undefined;
      const form = formRef.current;
      if (hit && form) {
        (form.elements.namedItem("company") as HTMLInputElement).value = hit.n;
        (form.elements.namedItem("track") as HTMLSelectElement).value = hit.t;
      }
    });
  }, []);

  // On a phone the result renders below the form; bring it into view and move focus to it.
  useEffect(() => {
    if (result === null || !resultRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    resultRef.current.focus({ preventScroll: true });
  }, [result]);

  const editField = (name: string) => {
    const el = formRef.current?.elements.namedItem(name) as HTMLElement | null;
    el?.scrollIntoView({ block: "center" });
    el?.focus();
  };

  const shareOffer = () => {
    if (!last) return;
    track("offer_share_click", result && result !== "none" ? result.confidence : "");
    try {
      sessionStorage.setItem(OFFER_PREFILL_KEY, JSON.stringify(last));
    } catch {
      // Storage blocked: the form opens empty.
    }
    router.push("/submit/?kind=offer");
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form
        ref={formRef}
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!data) return;
          const fd = new FormData(e.currentTarget);
          const get = (k: string) => String(fd.get(k) ?? "").trim();
          const monthly = toWan(get("monthly")).value;
          (e.currentTarget.elements.namedItem("monthly") as HTMLInputElement).value = monthly;
          const f = { company: get("company"), track: get("track"), role: get("role"), yoe: Number(get("yoe")), monthly: Number(monthly), bonus: get("bonus") ? Number(get("bonus")) : null };
          const r = evaluate(data[0], data[1], f);
          setResult(r ?? "none");
          setLast({ company: f.company, track: f.track, role: roleLabels[f.role] ?? "", yoe: get("yoe"), monthly, bonus: get("bonus") });
          track("offer_check", r ? `${r.level.id}:${r.confidence}` : "none");
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block">公司</span>
          <input name="company" required list="offer-companies" autoComplete="off" placeholder="例如 聯發科、螃蟹" className={input} />
          <datalist id="offer-companies">
            {suggestions.map((e) => (
              <option key={e.s} value={e.n} />
            ))}
          </datalist>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block">產業</span>
            <select name="track" required defaultValue="" className={input}>
              <option value="" disabled>
                請選擇
              </option>
              {Object.entries(TRACK_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">職務類別</span>
            <select name="role" defaultValue="" className={input}>
              <option value="">不確定</option>
              {roleOptions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">相關年資（年）</span>
            <input name="yoe" type="number" inputMode="decimal" required min={0} max={50} step={0.5} className={input} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">offer 月底薪（萬）</span>
            <WanInput name="monthly" className={input} />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block">保障年終＋獎金（幾個月，選填）</span>
            <input name="bonus" type="number" inputMode="decimal" min={0} max={60} step={0.1} className={input} />
          </label>
        </div>
        <button disabled={!data} className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-60">
          {data ? "檢查這個 offer" : "載入資料中…"}
        </button>
        <p className="text-xs text-ink-3">比對在你的瀏覽器裡完成，輸入的數字不會送出或記錄。</p>
      </form>

      <div ref={resultRef} tabIndex={-1} aria-live="polite" className="scroll-mt-20 outline-none">
        {result !== null && last && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm">
            <span>
              {last.company}，年資 {last.yoe} 年，月薪 {last.monthly} 萬{last.role ? `，${last.role}` : ""}
            </span>
            <button type="button" onClick={() => editField("company")} className="min-h-11 px-2 text-accent underline sm:min-h-0">
              修改
            </button>
          </div>
        )}
        {result === null && (
          <div className="rounded-xl border border-dashed border-border p-6 text-ink-2">
            輸入 offer 後，這裡會顯示它在同公司、同職務、相近年資的人裡算偏低、合理還是偏高，並告訴你這個結論有多可信。
          </div>
        )}
        {result === "none" && (
          <div className="rounded-xl border border-dashed border-border p-6 text-ink-2">
            這個組合的資料還不到 3 筆，沒辦法給出可信的結論。分享你的 offer，就能幫下一個人。
            <button onClick={shareOffer} className="mt-3 block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
              匿名分享這個 offer
            </button>
          </div>
        )}
        {result && result !== "none" && (
          <div className="space-y-4">
            <Payslip
              heading={
                <span className="flex items-center gap-3">
                  這個 offer
                  <span className={`rounded-full px-3 py-0.5 text-base ${result.verdict === "low" ? "bg-official/15 text-official-text" : result.verdict === "high" ? "bg-data/15 text-data-text" : "bg-surface-2 text-ink"}`}>
                    {VERDICT[result.verdict]}
                  </span>
                </span>
              }
              sub={`可信度：${CONFIDENCE[result.confidence]}`}
              rows={[
                { label: "高於同組的", value: String(result.pct), unit: "%", emphasis: true },
                { label: "同組月底薪中位數", value: String(result.median), unit: "萬", note: `中間一半落在 ${result.p25}–${result.p75} 萬` },
                { label: "你的年薪估算", value: String(result.annual), unit: "萬", note: result.annualAssumed ? "未填年終，以 14 個月估算" : "月薪 ×（12＋年終）" },
                ...(result.official != null ? [{ label: "官方非主管薪資中位數", value: String(result.official), unit: "萬", official: true, note: "全公司非主管員工的全年薪資，可對照年薪估算" }] : []),
              ]}
              footnote={`比對依據：${result.level.label}，共 ${result.n} 筆（2025 年後 ${result.recent} 筆）。${
                result.confidence === "low" ? "這間公司或這個職務的資料不夠，改用產業整體比對，僅供粗略參考。" : result.confidence === "medium" ? "資料筆數不多，請搭配其他來源判斷。" : ""
              }${!result.companyName ? "找不到這間公司的資料，改用產業資料比對。" : ""}`}
            />
            {!last?.role && (
              <p className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                沒有選職務，所以拿同公司或同產業所有職務來比。選了會比得更準。
                <button type="button" onClick={() => editField("role")} className="min-h-11 font-medium text-accent underline sm:min-h-0">
                  選擇職務
                </button>
              </p>
            )}
            <div className="rounded-xl border border-accent bg-accent-soft p-4">
              <p className="font-medium">讓下一個人也查得到</p>
              <p className="mt-1 text-sm text-ink-2">匿名分享這個 offer（剛填的欄位會自動帶入），{result.confidence !== "high" ? "這裡的資料還不多，你的一筆影響很大。" : "幫資料保持新鮮。"}</p>
              <button onClick={shareOffer} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
                匿名分享這個 offer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
