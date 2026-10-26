"use client";

import { useEffect, useState } from "react";

// Sticky in-page navigation for long pages; highlights the section in view.
export function SectionTabs({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className="sticky top-14 z-20 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur" aria-label="本頁內容">
      <ul className="flex gap-1 overflow-x-auto text-sm">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={`block border-b-2 px-3 py-2.5 whitespace-nowrap ${active === s.id ? "border-accent font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
