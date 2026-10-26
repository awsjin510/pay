"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { RangeBar } from "@/components/RangeBar";
import type { Dist } from "@/lib/data";

export type CompareEntry = {
  slug: string;
  name: string;
  aliases: string[];
  track: string;
  n: number;
  recentN: number;
  monthly: Dist | null;
  annual: Dist | null;
  bonus: number | null;
  hours: number | null;
  overtime: number | null;
  happiness: number | null;
  loading: number | null;
  official: number | null;
  officialYear: number | null;
};

const MAX = 3;
const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");

const noSubscribe = () => () => {};

export function CompareTool({ entries, trackLabels }: { entries: CompareEntry[]; trackLabels: Record<string, string> }) {
  // Shareable links: /compare/?c=mediatek,realtek. The URL seeds the selection until the
  // visitor changes it (null = still following the URL).
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  const fromUrl = useMemo(
    () => (new URLSearchParams(search).get("c") ?? "").split(",").filter((s) => entries.some((e) => e.slug === s)).slice(0, MAX),
    [search, entries],
  );
  const [chosenSlugs, setPicked] = useState<string[] | null>(null);
  const picked = chosenSlugs ?? fromUrl;
  const [q, setQ] = useState("");

  useEffect(() => {
    if (chosenSlugs == null) return;
    window.history.replaceState(null, "", chosenSlugs.length ? `?c=${chosenSlugs.join(",")}` : window.location.pathname);
  }, [chosenSlugs]);

  const matches = useMemo(() => {
    const k = norm(q);
    if (!k) return [];
    return entries.filter((e) => !picked.includes(e.slug) && [e.name, ...e.aliases].some((s) => norm(s).includes(k))).slice(0, 8);
  }, [q, entries, picked]);
  const chosen = picked.map((s) => entries.find((e) => e.slug === s)!);
  const max = Math.max(...chosen.map((c) => c.monthly?.p75 ?? 0), 1) * 1.1;

  const rows: { label: string; value: (c: CompareEntry) => React.ReactNode }[] = [
    { label: "產業", value: (c) => trackLabels[c.track] },
    { label: "資料筆數", value: (c) => `${c.n}（近期 ${c.recentN}）` },
    { label: "月底薪分布", value: (c) => <RangeBar dist={c.monthly} max={max} /> },
    { label: "月底薪中位數", value: (c) => (c.monthly ? `${c.monthly.median} 萬` : "—") },
    { label: "總年薪中位數", value: (c) => (c.annual ? `${c.annual.median} 萬` : "—") },
    { label: "官方非主管薪資中位數", value: (c) => (c.official ? `${c.official} 萬（${c.officialYear}）` : "—") },
    { label: "Bonus 中位數", value: (c) => (c.bonus != null ? `${c.bonus} 個月` : "—") },
    { label: "每日工時", value: (c) => (c.hours != null ? `${c.hours} 小時` : "—") },
    { label: "每月加班", value: (c) => (c.overtime != null ? `${c.overtime} 小時` : "—") },
    { label: "爽度 / Loading", value: (c) => `${c.happiness ?? "—"} / ${c.loading ?? "—"}` },
  ];

  return (
    <div className="space-y-4">
      {picked.length < MAX && (
        <div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`加入公司（最多 ${MAX} 間），例如：聯發科、螃蟹`}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent"
            aria-label="加入比較的公司"
          />
          {matches.length > 0 && (
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-surface">
              {matches.map((m) => (
                <li key={m.slug}>
                  <button
                    onClick={() => {
                      setPicked([...picked, m.slug]);
                      setQ("");
                    }}
                    className="flex w-full justify-between px-4 py-2 text-left hover:bg-background"
                  >
                    <span>{m.name}</span>
                    <span className="text-xs text-ink-2">{m.n} 筆</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {chosen.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr>
                <th className="w-36" />
                {chosen.map((c) => (
                  <th key={c.slug} className="px-3 py-2 text-left font-medium">
                    <Link href={`/companies/${c.slug}/`} className="hover:text-accent">
                      {c.name}
                    </Link>
                    <button onClick={() => setPicked(picked.filter((p) => p !== c.slug))} className="ml-2 text-xs text-ink-3 hover:text-ink" aria-label={`移除 ${c.name}`}>
                      ✕
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular">
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="px-3 py-2 text-xs text-ink-2">{r.label}</td>
                  {chosen.map((c) => (
                    <td key={c.slug} className="px-3 py-2">
                      {r.value(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {chosen.length === 0 && <p className="text-sm text-ink-2">只列出資料達 3 筆以上的公司。</p>}
    </div>
  );
}
