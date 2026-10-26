"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/Icons";

export type SearchEntry = { slug: string; name: string; en: string | null; aliases: string[]; track: string; n: number };

const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");

export function CompanySearch({ entries, trackLabels }: { entries: SearchEntry[]; trackLabels: Record<string, string> }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const k = norm(q);
    if (!k) return [];
    const score = (e: SearchEntry) => {
      const names = [e.name, e.en ?? "", ...e.aliases].map(norm);
      if (names.some((n) => n === k)) return 3;
      if (names.some((n) => n.startsWith(k))) return 2;
      return names.some((n) => n.includes(k)) ? 1 : 0;
    };
    return entries
      .map((e) => [e, score(e)] as const)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1] || b[0].n - a[0].n)
      .slice(0, 8)
      .map(([e]) => e);
  }, [q, entries]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-surface px-4 focus-within:border-accent">
        <SearchIcon className="size-5 shrink-0 text-ink-3" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="公司、英文名或代號"
          className="h-14 w-full bg-transparent text-lg outline-none placeholder:text-ink-3"
          aria-label="搜尋公司"
        />
      </div>
      {q && (
        <ul className="absolute inset-x-0 top-full z-20 mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          {results.length === 0 && (
            <li className="px-4 py-4 text-sm text-ink-2">
              找不到「{q}」。可以試英文名或 PTT 代號，或
              <Link href="/submit/" className="text-accent underline">
                分享這間公司的薪資
              </Link>
              。
            </li>
          )}
          {results.map((e) => (
            <li key={e.slug}>
              <Link href={`/companies/${e.slug}/`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2">
                <span>
                  {e.name}
                  {e.en && e.en !== e.name && <span className="ml-2 text-sm text-ink-3">{e.en}</span>}
                </span>
                <span className="tabular shrink-0 text-xs text-ink-2">
                  {trackLabels[e.track]}　{e.n} 筆
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
