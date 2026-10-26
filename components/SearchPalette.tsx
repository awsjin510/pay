"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "@/components/Icons";
import { track } from "@/lib/track";

type Entry = { s: string; n: string; e: string | null; a: string[]; t: string; c: number; m: number | null };

const TRACKS: Record<string, string> = { soft: "純軟", system: "系統廠", ic: "IC 設計" };
const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, "");

let cache: Promise<Entry[]> | null = null;
const loadIndex = () => (cache ??= fetch("/search-index.json").then((r) => r.json() as Promise<Entry[]>));

// Exact name/alias first, then prefix, then substring; more submissions break ties.
function rank(entries: Entry[], q: string) {
  const k = norm(q);
  if (!k) return entries.filter((e) => e.m != null).slice(0, 8);
  const scored: [Entry, number][] = [];
  for (const e of entries) {
    const names = [e.n, e.e ?? "", ...e.a].map(norm);
    let score = 0;
    if (names.some((n) => n === k)) score = 3;
    else if (names.some((n) => n.startsWith(k))) score = 2;
    else if (names.some((n) => n.includes(k))) score = 1;
    if (score) scored.push([e, score * 10000 + e.c]);
  }
  return scored.sort((a, b) => b[1] - a[1]).slice(0, 10).map(([e]) => e);
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const results = useMemo(() => rank(entries, q), [entries, q]);

  useEffect(() => {
    if (!open) return;
    loadIndex().then(setEntries);
    input.current?.focus();
  }, [open]);

  // A query that settles with no match is a demand signal for a company we don't cover.
  const empty = open && q.trim().length >= 2 && entries.length > 0 && results.length === 0;
  useEffect(() => {
    if (!empty) return;
    const t = setTimeout(() => track("search_empty", "palette"), 1200);
    return () => clearTimeout(t);
  }, [empty, q]);

  if (!open) return null;
  const go = (e: Entry) => {
    track("search_select", e.m != null ? "palette:stats" : "palette:thin");
    onClose();
    router.push(`/companies/${e.s}/`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[12vh] backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="搜尋公司"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <SearchIcon className="size-5 text-ink-3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter" && results[active]) go(results[active]);
            }}
            placeholder="公司名稱、英文或 PTT 代號（螃蟹、滷肉…）"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-ink-3"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `sr-${results[active].s}` : undefined}
          />
          <kbd className="hidden rounded border border-border px-1.5 text-xs text-ink-3 sm:block">Esc</kbd>
        </div>
        <ul id="search-results" role="listbox" className="max-h-[50vh] overflow-y-auto py-2">
          {!q && <li className="px-4 pb-1 text-xs text-ink-3">資料最多的公司</li>}
          {q && entries.length > 0 && results.length === 0 && (
            <li className="px-4 py-6 text-sm text-ink-2">
              找不到「{q}」。試試英文名或代號，或
              <Link href="/submit/" onClick={onClose} className="text-accent underline">
                分享這間公司的薪資
              </Link>
              。
            </li>
          )}
          {results.map((e, i) => (
            <li key={e.s} id={`sr-${e.s}`} role="option" aria-selected={i === active}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(e)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left ${i === active ? "bg-accent-soft" : ""}`}
              >
                <span className="min-w-0 truncate">
                  {e.n}
                  {e.e && e.e !== e.n && <span className="ml-2 text-sm text-ink-3">{e.e}</span>}
                </span>
                <span className="tabular shrink-0 text-sm text-ink-2">
                  {e.m != null ? `${e.m} 萬` : `${e.c} 筆`}
                  <span className="ml-2 text-xs text-ink-3">{TRACKS[e.t]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
