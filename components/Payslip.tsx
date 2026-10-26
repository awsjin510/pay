// The site's signature element: numbers set as a payslip — item, dot leader, amount.
// Rows marked `official` carry the 官方 seal; everything else is crowd data.

export type PayslipRow = {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  official?: boolean;
  emphasis?: boolean;
};

export function Payslip({
  heading,
  sub,
  rows,
  footnote,
  animate = false,
  tilt = false,
  className = "",
}: {
  heading: React.ReactNode;
  sub?: React.ReactNode;
  rows: PayslipRow[];
  footnote?: React.ReactNode;
  animate?: boolean;
  // A slight paper tilt, only for the home page's showcase slip.
  tilt?: boolean;
  className?: string;
}) {
  return (
    <div className={`payslip-shadow ${tilt ? "-rotate-1 transition-transform duration-300 hover:rotate-0" : ""} ${className}`}>
    <div className="payslip px-5 pt-7 pb-8 sm:px-7">
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
        <div className="text-lg font-bold">{heading}</div>
        {sub && <div className="text-xs text-ink-3">{sub}</div>}
      </div>
      <dl className="mt-3 space-y-2.5">
        {rows.map((r, i) => (
          <div key={r.label} className={animate ? "print-row" : undefined} style={animate ? ({ "--i": i } as React.CSSProperties) : undefined}>
            <div className="flex items-baseline">
              <dt className={`flex items-center gap-2 ${r.emphasis ? "font-medium" : "text-ink-2"}`}>
                {r.label}
                {r.official && <span className="seal">官方</span>}
              </dt>
              <span className="leader" aria-hidden="true" />
              <dd className={`num whitespace-nowrap ${r.emphasis ? "text-3xl font-semibold" : "text-xl font-medium"} ${r.official ? "text-seal" : ""}`}>
                {r.value}
                {r.unit && <span className="ml-1 font-sans text-sm font-normal text-ink-2">{r.unit}</span>}
              </dd>
            </div>
            {r.note && <div className="text-right text-xs text-ink-3">{r.note}</div>}
          </div>
        ))}
      </dl>
      {footnote && <div className="mt-4 border-t border-dashed border-border pt-3 text-xs leading-5 text-ink-3">{footnote}</div>}
    </div>
    </div>
  );
}
