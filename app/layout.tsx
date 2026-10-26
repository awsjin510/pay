import type { Metadata } from "next";
import Link from "next/link";
import { meta } from "@/lib/data";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "科技業薪資參考", template: "%s｜科技業薪資參考" },
  description: "台灣純軟、系統廠、IC 設計的薪資、年終與工作負荷，整理自 2,000+ 筆匿名分享。",
};

const NAV = [
  { href: "/industries/soft/", label: "純軟" },
  { href: "/industries/system/", label: "系統廠" },
  { href: "/industries/ic/", label: "IC 設計" },
  { href: "/sectors/cloud-security/", label: "雲端 / 資安" },
  { href: "/roles/", label: "職務" },
  { href: "/about/", label: "資料說明" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant-TW" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-semibold">
              科技業薪資參考
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-ink">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-border px-4 py-6 text-center text-xs text-ink-3">
          資料共 {meta.total.toLocaleString()} 筆匿名分享，最後整理於 {meta.generatedAt.slice(0, 10)}。數字僅供參考，不代表公司官方薪資。
        </footer>
      </body>
    </html>
  );
}
