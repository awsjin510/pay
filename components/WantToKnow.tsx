"use client";

import { useEffect, useState } from "react";
import { useStored, writeStored } from "@/lib/storage";
import { track } from "@/lib/track";

const votedKey = (slug: string) => `wanted:${slug}`;

// 「我也想知道這家」 on thin company pages: a public demand counter (no identity stored) and
// a link that asks colleagues to fill the gap.
export function WantToKnow({ slug, name }: { slug: string; name: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [clicked, setClicked] = useState(false);
  const voted = useStored(votedKey(slug)) === "1" || clicked;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/wants?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? (r.json() as Promise<{ count: number }>) : null))
      .then((d) => d && setCount(d.count))
      .catch(() => {});
  }, [slug]);

  const want = async () => {
    setClicked(true);
    writeStored(votedKey(slug), "1");
    track("want_click", `company:${slug}`);
    try {
      const r = await fetch("/api/wants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) });
      if (r.ok) setCount(((await r.json()) as { count: number }).count);
    } catch {
      // The count is a nicety; the invite below still works.
    }
  };

  const invite = async () => {
    const url = `${window.location.origin}/submit/?company=${slug}&ref=invite`;
    const text = `幫忙匿名分享在${name}的薪資，再幾筆就能看到統計：`;
    track("invite_click", `company:${slug}`);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name}薪資`, text, url });
        return;
      } catch {
        // Cancelled or unsupported target: fall back to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("複製這個連結傳給同事：", url);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-border p-4">
      <p className="text-sm">
        {count != null && count > 0 ? (
          <>
            已有 <strong className="num text-lg">{count}</strong> 人想知道{name}的薪資。
          </>
        ) : (
          `想知道${name}的薪資？`
        )}
        <span className="text-ink-2">在這裡工作的人看到需求，比較願意分享。</span>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={want}
          disabled={voted}
          aria-pressed={voted}
          className="min-h-11 rounded-lg border border-border bg-background px-3.5 text-sm hover:border-accent disabled:border-accent disabled:bg-accent-soft"
        >
          {voted ? "✓ 已記下，我也想知道" : "我也想知道這家"}
        </button>
        <button type="button" onClick={invite} className="min-h-11 rounded-lg border border-border bg-background px-3.5 text-sm hover:border-accent">
          {copied ? "已複製邀請連結" : "邀在這裡工作的朋友分享"}
        </button>
      </div>
    </div>
  );
}
