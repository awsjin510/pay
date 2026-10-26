import type { Metadata, Viewport } from "next";
import { Barlow_Semi_Condensed, Noto_Sans_TC } from "next/font/google";
import Link from "next/link";
import { LogoMark } from "@/components/Icons";
import { MobileCta } from "@/components/MobileCta";
import { SiteHeader } from "@/components/SiteHeader";
import { meta, SITE_URL } from "@/lib/data";
import "./globals.css";

// CJK glyphs are split by unicode-range and fetched as needed, so only Latin is preloaded.
const noto = Noto_Sans_TC({ variable: "--font-noto", subsets: ["latin"], weight: ["400", "500", "700", "900"], display: "swap" });
const barlow = Barlow_Semi_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "科技業薪資參考", template: "%s｜科技業薪資參考" },
  description: "台灣純軟、系統廠、IC 設計、資訊服務與雲端資安的薪資、年終與工作負荷，整理自 2,000+ 筆匿名分享並對照官方揭露，免費查詢。",
  openGraph: { siteName: "科技業薪資參考", locale: "zh_TW", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#16213a" },
  ],
};

// Applies a stored light/dark choice before first paint so there is no flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

const FOOTER = [
  { href: "/submit/", label: "分享薪資" },
  { href: "/report/", label: "下架申請與回報" },
  { href: "/nicknames/", label: "PTT 代號對照" },
  { href: "/about/", label: "資料說明與開放資料" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant-TW" className={`${noto.variable} ${barlow.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
          跳到主要內容
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-24 sm:pb-12">
          {children}
        </main>
        <footer className="border-t border-border bg-surface px-4 pt-8 pb-24 sm:pb-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm md:flex-row md:justify-between">
            <div className="max-w-md">
              <div className="flex items-center gap-2 font-bold">
                <LogoMark className="size-6" />
                科技業薪資參考
              </div>
              <p className="mt-2 text-ink-2">
                {meta.total.toLocaleString()} 筆匿名分享，對照官方揭露。數字僅供參考，不代表公司官方薪資。核心資料永久免費，不接受付費修改。
              </p>
              <p className="mt-1 text-xs text-ink-3">最後整理於 {meta.generatedAt.slice(0, 10)}</p>
            </div>
            <nav className="grid grid-cols-2 gap-x-8 gap-y-2" aria-label="頁尾">
              {FOOTER.map((n) => (
                <Link key={n.href} href={n.href} className="text-ink-2 hover:text-ink">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </footer>
        <MobileCta />
        {/* Cloudflare Web Analytics: cookieless page views and Core Web Vitals. The token is a public site id. */}
        <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "2cfee835fb3e404681016bf401fcfdf2"}' />
      </body>
    </html>
  );
}
