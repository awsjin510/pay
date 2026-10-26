"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { setTray, TRAY_MAX, useTray } from "@/lib/compareTray";

export function AddToCompare({ slug, name }: { slug: string; name: string }) {
  const tray = useTray();
  const added = tray.some((t) => t.slug === slug);
  const full = !added && tray.length >= TRAY_MAX;
  return (
    <button
      type="button"
      disabled={full}
      onClick={() => setTray(added ? tray.filter((t) => t.slug !== slug) : [...tray, { slug, name }])}
      aria-pressed={added}
      className={`rounded-xl border px-3.5 py-2 text-sm disabled:opacity-50 ${added ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent"}`}
      title={full ? `最多比較 ${TRAY_MAX} 間` : undefined}
    >
      {added ? `已加入比較（${tray.length}/${TRAY_MAX}）` : full ? "比較清單已滿" : "加入比較"}
    </button>
  );
}

// Floating tray: what's queued for comparison and a way to open it, on every page.
export function CompareTray() {
  const tray = useTray();
  const pathname = usePathname();
  if (!tray.length || pathname.startsWith("/compare")) return null;
  return (
    <div className="fixed right-4 bottom-20 z-30 flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border border-border bg-surface py-1.5 pr-1.5 pl-4 text-sm shadow-lg sm:bottom-6">
      <span className="truncate text-ink-2">比較：{tray.map((t) => t.name).join("、")}</span>
      {tray.length >= 2 ? (
        <Link href={`/compare/?c=${tray.map((t) => t.slug).join(",")}`} className="shrink-0 rounded-full bg-accent px-3 py-1.5 font-medium text-accent-ink">
          開始比較
        </Link>
      ) : (
        <span className="shrink-0 px-2 text-xs text-ink-3">再選 1 間</span>
      )}
      <button type="button" onClick={() => setTray([])} className="grid size-8 shrink-0 place-items-center rounded-full text-ink-3 hover:text-ink" aria-label="清空比較清單">
        ✕
      </button>
    </div>
  );
}
