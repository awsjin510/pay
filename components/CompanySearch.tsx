"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type SearchEntry = { slug: string; name: string; en: string | null; aliases: string[]; track: string; n: number };

const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");

export function CompanySearch({ entries, trackLabels }: { entries: SearchEntry[]; trackLabels: Record<string, string> }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const k = norm(q);
    if (!k) return [];
    return entries
      .filter((e) => [e.name, e.en ?? "", ...e.aliases].some((s) => norm(s).includes(k)))
      .slice(0, 12);
  }, [q, entries]);

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜尋公司，例如：聯發科、MTK、螃蟹、Google"
        className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
        aria-label="搜尋公司"
      />
      {q && (
        <ul className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {results.length === 0 && <li className="px-4 py-3 text-sm text-ink-2">找不到「{q}」</li>}
          {results.map((e) => (
            <li key={e.slug}>
              <Link href={`/companies/${e.slug}/`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-background">
                <span>
                  {e.name}
                  {e.en && e.en !== e.name && <span className="ml-2 text-sm text-ink-3">{e.en}</span>}
                </span>
                <span className="shrink-0 text-xs text-ink-2">
                  {trackLabels[e.track]}・{e.n} 筆
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
