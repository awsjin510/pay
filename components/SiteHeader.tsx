"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AutoIcon, ChevronDown, CloseIcon, LogoMark, MenuIcon, MoonIcon, SearchIcon, SunIcon } from "@/components/Icons";
import { SearchPalette } from "@/components/SearchPalette";

const INDUSTRIES = [
  { href: "/industries/soft/", label: "純軟" },
  { href: "/industries/system/", label: "系統廠" },
  { href: "/industries/ic/", label: "IC 設計" },
  { href: "/sectors/it-services/", label: "資訊服務業" },
  { href: "/sectors/cloud-security/", label: "雲端／資安" },
];
const LINKS = [
  { href: "/roles/", label: "職務" },
  { href: "/compare/", label: "比較" },
  { href: "/nicknames/", label: "代號表" },
];

type Theme = "system" | "light" | "dark";
const THEMES: { id: Theme; label: string; Icon: typeof SunIcon }[] = [
  { id: "system", label: "跟隨系統", Icon: AutoIcon },
  { id: "light", label: "淺色", Icon: SunIcon },
  { id: "dark", label: "深色", Icon: MoonIcon },
];

function ThemeButton() {
  const [theme, setTheme] = useState<Theme>("system");
  // The no-flash script in <head> already applied the stored theme; mirror it here.
  useEffect(() => {
    const t = document.documentElement.dataset.theme as Theme | undefined;
    if (t === "light" || t === "dark") queueMicrotask(() => setTheme(t));
  }, []);
  const current = THEMES.find((t) => t.id === theme)!;
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  return (
    <button
      onClick={() => {
        setTheme(next.id);
        try {
          if (next.id === "system") {
            localStorage.removeItem("theme");
            delete document.documentElement.dataset.theme;
          } else {
            localStorage.setItem("theme", next.id);
            document.documentElement.dataset.theme = next.id;
          }
        } catch {
          // Storage blocked: the theme still applies for this page view.
          if (next.id !== "system") document.documentElement.dataset.theme = next.id;
        }
      }}
      className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink"
      aria-label={`主題：${current.label}（切換為${next.label}）`}
      title={`主題：${current.label}`}
    >
      <current.Icon />
    </button>
  );
}

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);
  const pathname = usePathname();
  const dropdown = useRef<HTMLDivElement>(null);

  // Ctrl/⌘+K or "/" opens search from anywhere (except while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, select");
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!dropdown.current?.contains(e.target as Node)) setIndustryOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  const isActive = (href: string) => pathname.startsWith(href);
  const navLink = (href: string) =>
    `rounded-lg px-3 py-1.5 hover:bg-surface-2 hover:text-ink ${isActive(href) ? "text-ink font-medium" : "text-ink-2"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="mr-3 flex items-center gap-2 font-bold" onClick={() => setMenuOpen(false)}>
          <LogoMark />
          <span>科技業薪資參考</span>
        </Link>

        <nav className="hidden items-center text-sm lg:flex" aria-label="主要">
          <div className="relative" ref={dropdown}>
            <button
              onClick={() => setIndustryOpen((o) => !o)}
              className={`flex items-center gap-1 ${navLink("/industries/")} ${isActive("/sectors/") ? "font-medium text-ink" : ""}`}
              aria-expanded={industryOpen}
              aria-haspopup="true"
            >
              產業與專區 <ChevronDown />
            </button>
            {industryOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
                {INDUSTRIES.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={() => setIndustryOpen(false)}
                    className={`block rounded-lg px-3 py-2 hover:bg-surface-2 ${isActive(i.href) ? "font-medium text-ink" : "text-ink-2"}`}
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={navLink(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-ink-3 hover:text-ink-2 max-sm:w-9 max-sm:justify-center max-sm:px-0"
            aria-label="搜尋公司"
          >
            <SearchIcon />
            <span className="hidden sm:inline">搜尋公司</span>
            <kbd className="ml-4 hidden rounded border border-border px-1 text-xs md:inline">Ctrl K</kbd>
          </button>
          <ThemeButton />
          <Link href="/submit/" className="ml-1 hidden h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-medium text-accent-ink hover:opacity-90 sm:flex">
            分享薪資
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-surface-2 lg:hidden"
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-border bg-surface px-4 pt-2 pb-4 lg:hidden" aria-label="行動版">
          <div className="pb-1 text-xs text-ink-3">產業與專區</div>
          <div className="grid grid-cols-2 gap-1">
            {INDUSTRIES.map((i) => (
              <Link key={i.href} href={i.href} onClick={() => setMenuOpen(false)} className={`rounded-lg px-3 py-2.5 ${isActive(i.href) ? "bg-accent-soft font-medium" : "hover:bg-surface-2"}`}>
                {i.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 border-t border-border pt-3">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-center hover:bg-surface-2">
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
