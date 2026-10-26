// Small stroke icons, drawn inline so the site needs no icon dependency.
type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const SearchIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const MenuIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const CloseIcon = ({ className = "size-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const ChevronDown = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const SunIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const MoonIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
  </svg>
);
export const AutoIcon = ({ className = "size-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" />
  </svg>
);
export const CheckBadge = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 3l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 21l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2Z" />
    <path d="m8.5 12 2.3 2.3 4.7-4.6" />
  </svg>
);
export const DocIcon = ({ className = "size-3.5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M7 3h7l4 4v14H7Z" />
    <path d="M14 3v4h4M10 12h5M10 16h5" />
  </svg>
);

// Payslip logo: a strip of paper with a torn bottom edge and two line items.
export const LogoMark = ({ className = "size-7" }: P) => (
  <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
    <path d="M6 3h16v19l-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2Z" fill="var(--brand)" />
    <path d="M9.5 9h9M9.5 13h6M9.5 17h9" stroke="var(--brand-ink)" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
