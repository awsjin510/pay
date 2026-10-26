"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Phones hide the header's "分享薪資" button, so it lives in a bottom bar instead. It steps
// aside on pages whose main action is something else, and whenever the page's own share
// button (marked data-cta) is on screen, so two identical buttons never compete.
export function MobileCta() {
  const pathname = usePathname();
  const [ctaVisible, setCtaVisible] = useState(false);
  const hiddenHere = /^\/(submit|report|offer)/.test(pathname);

  useEffect(() => {
    if (hiddenHere) return;
    const targets = document.querySelectorAll("[data-cta]");
    if (!targets.length) return;
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      }
      setCtaVisible(visible.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [pathname, hiddenHere]);

  if (hiddenHere) return null;
  const slug = pathname.match(/^\/companies\/([^/]+)/)?.[1];
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur transition-transform duration-200 sm:hidden ${ctaVisible ? "translate-y-full" : ""}`}
      aria-hidden={ctaVisible}
    >
      <Link
        href={slug ? `/submit/?company=${slug}` : "/submit/"}
        tabIndex={ctaVisible ? -1 : undefined}
        className="flex h-11 items-center justify-center rounded-lg bg-accent text-sm font-medium text-accent-ink"
      >
        {slug ? "匿名分享我在這間的薪資" : "匿名分享我的薪資"}
      </Link>
    </div>
  );
}
