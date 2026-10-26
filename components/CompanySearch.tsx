"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "@/components/Icons";
import { track } from "@/lib/track";

type Entry = { s: string; n: string; e: string | null; a: string[]; t: string; c: number; m: number | null };

const TRACKS: Record<string, string> = { soft: "純軟", system: "系統廠", ic: "IC 設計" };
const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");

// The company index is fetched on first focus instead of being inlined into the home page.
let cache: Promise<Entry[]> | null = null;
const loadIndex = () => (cache ??= fetch("/search-index.json").then((r) => r.json() as Promise<Entry[]>));

export function CompanySearch() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const k = norm(q);
    if (!k) return [];
    const score = (e: Entry) => {
      const names = [e.n, e.e ?? "", ...e.a].map(norm);
      if (names.some((n) => n === k)) return 3;
      if (names.some((n) => n.startsWith(k))) return 2;
      return names.some((n) => n.includes(k)) ? 1 : 0;
    };
    return entries
      .map((e) => [e, score(e)] as const)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1] || b[0].c - a[0].c)
      .slice(0, 8)
      .map(([e]) => e);
  }, [q, entries]);

  const empty = q.trim().length >= 2 && entries.length > 0 && results.length === 0;
  useEffect(() => {
    if (!empty) return;
    const t = setTimeout(() => track("search_empty", "home"), 1200);
    return () => clearTimeout(t);
  }, [empty, q]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-surface px-4 focus-within:border-accent">
        <SearchIcon className="size-5 shrink-0 text-ink-3" />
        <input
          type="search"
          value={q}
          onFocus={() => loadIndex().then(setEntries)}
          onChange={(e) => setQ(e.target.value)}
          placeholder="公司、英文名或代號"
          className="h-14 w-full bg-transparent text-lg outline-none placeholder:text-ink-3"
          aria-label="搜尋公司"
        />
      </div>
      {q && entries.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-20 mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          {results.length === 0 && (
            <li className="px-4 py-4 text-sm text-ink-2">
              找不到「{q}」。可以試英文名或 PTT 代號，或
              <Link href="/offer/" className="text-accent underline">
                用產業資料檢查 offer
              </Link>
              、
              <Link href="/submit/" className="text-accent underline">
                分享這間公司的薪資
              </Link>
              。
            </li>
          )}
          {results.map((e) => (
            <li key={e.s}>
              <Link
                href={`/companies/${e.s}/`}
                onClick={() => track("search_select", e.m != null ? "home:stats" : "home:thin")}
                className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2"
              >
                <span className="min-w-0 truncate">
                  {e.n}
                  {e.e && e.e !== e.n && <span className="ml-2 text-sm text-ink-3">{e.e}</span>}
                </span>
                <span className="tabular shrink-0 text-xs text-ink-2">
                  {e.m != null ? `${e.m} 萬` : <span className="rounded bg-surface-2 px-1.5 py-0.5">資料不足</span>}
                  <span className="ml-2 text-ink-3">
                    {TRACKS[e.t]}　{e.c} 筆
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
