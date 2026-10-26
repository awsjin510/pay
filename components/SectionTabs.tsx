"use client";

import { useEffect, useState } from "react";

type Summary = { title: string; value: string; observe: string };

// Sticky in-page navigation for long pages; highlights the section in view. With `summary`,
// it also shows the page's headline number once the hero (#observe) has scrolled away, so a
// long page never loses its context.
export function SectionTabs({ sections, summary }: { sections: { id: string; label: string }[]; summary?: Summary }) {
  const [active, setActive] = useState(sections[0]?.id);
  const [heroGone, setHeroGone] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -55% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const hero = summary && document.getElementById(summary.observe);
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: "-56px 0px 0px 0px" });
    io.observe(hero);
    return () => io.disconnect();
  }, [summary]);

  return (
    <nav className="sticky top-14 z-20 -mx-4 flex items-center border-b border-border bg-background/95 px-4 backdrop-blur" aria-label="本頁內容">
      {summary && heroGone && (
        <div className="mr-3 flex shrink-0 items-baseline gap-2 border-r border-border pr-3 text-sm">
          <span className="max-w-28 truncate font-bold">{summary.title}</span>
          <span className="num text-base font-semibold">{summary.value}</span>
        </div>
      )}
      <ul className="flex min-w-0 gap-1 overflow-x-auto text-sm">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={`block border-b-2 px-3 py-3 whitespace-nowrap ${active === s.id ? "border-accent font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
