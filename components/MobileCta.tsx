"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Phones hide the header's "分享薪資" button, so it lives in a bottom bar instead.
export function MobileCta() {
  const pathname = usePathname();
  if (pathname.startsWith("/submit") || pathname.startsWith("/report")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-2.5 backdrop-blur sm:hidden">
      <Link href="/submit/" className="flex h-11 items-center justify-center rounded-lg bg-accent text-sm font-medium text-accent-ink">
        匿名分享我的薪資
      </Link>
    </div>
  );
}
