"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { OFFER_PREFILL_KEY, type OfferPrefill } from "@/components/Forms";
import { OFFER_CHECK_KEY, type OfferCheckPrefill } from "@/components/OfferChecker";
import { toWan } from "@/components/WanInput";
import { useStored, writeStored } from "@/lib/storage";
import { track } from "@/lib/track";

type Offer = {
  name: string;
  monthly: string;
  guaranteed: string;
  variable: string;
  profitSharing: string;
  stockTotal: string;
  vestYears: string;
  signOn: string;
  raise: string;
  other: string;
  weeklyHours: string;
};

const blank = (i: number): Offer => ({
  name: `Offer ${String.fromCharCode(65 + i)}`,
  monthly: "",
  guaranteed: "2",
  variable: "",
  profitSharing: "",
  stockTotal: "",
  vestYears: "4",
  signOn: "",
  raise: "3",
  other: "",
  weeklyHours: "",
});

const YEARS = 4;
const MAX = 4;
const STORE = "offerCalc";
const num = (s: string) => (Number.isFinite(Number(s)) && s !== "" ? Number(s) : 0);
const r1 = (v: number) => Math.round(v * 10) / 10;
const fmt = (v: number) => Math.round(v).toLocaleString();

type Breakdown = { base: number; bonus: number; profit: number; stock: number; signOn: number; other: number; total: number };

// Year-by-year total pay, in 萬. Base and bonus grow with the yearly raise; stock vests
// evenly; the sign-on bonus lands in year one.
function project(o: Offer): Breakdown[] {
  const m = num(o.monthly);
  const vest = Math.max(1, num(o.vestYears) || 4);
  return Array.from({ length: YEARS }, (_, i) => {
    const grown = m * (1 + num(o.raise) / 100) ** i;
    const b = {
      base: grown * 12,
      bonus: grown * (num(o.guaranteed) + num(o.variable)),
      profit: num(o.profitSharing),
      stock: i < vest ? num(o.stockTotal) / vest : 0,
      signOn: i === 0 ? num(o.signOn) : 0,
      other: num(o.other),
    };
    return { ...b, total: b.base + b.bonus + b.profit + b.stock + b.signOn + b.other };
  });
}

const ROWS: { key: keyof Omit<Breakdown, "total">; label: string }[] = [
  { key: "base", label: "底薪 ×12" },
  { key: "bonus", label: "年終＋績效獎金" },
  { key: "profit", label: "員工酬勞／分紅" },
  { key: "stock", label: "股票（當年歸屬）" },
  { key: "signOn", label: "簽約金" },
  { key: "other", label: "其他福利" },
];

const input = "w-full rounded-lg border border-border bg-background px-3 py-2";

function NumField({ label, hint, value, onChange, onBlur, inputMode = "decimal" }: { label: string; hint?: string; value: string; onChange: (v: string) => void; onBlur?: () => void; inputMode?: "decimal" | "numeric" }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block">{label}</span>
      <input type="number" inputMode={inputMode} min={0} step="any" value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className={input} />
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  );
}

export function OfferCalculator() {
  const router = useRouter();
  // Kept on this device only (localStorage), so a reload doesn't lose the numbers.
  // `local` keeps the form working when storage is blocked.
  const stored = useStored(STORE);
  const [local, setLocal] = useState<string | null>(null);
  const source = stored ?? local;
  const offers = useMemo(() => {
    try {
      const saved = JSON.parse(source ?? "null") as Offer[] | null;
      if (Array.isArray(saved) && saved.length >= 1) return saved.slice(0, MAX).map((o, i) => ({ ...blank(i), ...o }));
    } catch {
      // Corrupt: start blank.
    }
    return [blank(0), blank(1)];
  }, [source]);
  const setOffers = (fn: (os: Offer[]) => Offer[]) => {
    const next = JSON.stringify(fn(offers));
    setLocal(next);
    writeStored(STORE, next);
  };
  const [notes, setNotes] = useState<Record<number, string>>({});
  const counted = useRef(false);

  useEffect(() => track("calc_view"), []);

  const update = (i: number, patch: Partial<Offer>) => setOffers((os) => os.map((o, j) => (j === i ? { ...o, ...patch } : o)));
  const results = useMemo(() => offers.map(project), [offers]);
  const filled = offers.map((o) => num(o.monthly) > 0);
  const totals = results.map((r) => r.reduce((t, y) => t + y.total, 0));
  const best = Math.max(...totals.filter((_, i) => filled[i]), 0);
  const ready = filled.filter(Boolean).length >= 1;

  useEffect(() => {
    if (counted.current || filled.filter(Boolean).length < 2) return;
    counted.current = true;
    track("calc_compute", String(offers.length));
  }, [filled, offers.length]);

  const check = (o: Offer) => {
    track("calc_check_click");
    try {
      const p: OfferCheckPrefill = { company: o.name.startsWith("Offer ") ? "" : o.name, monthly: o.monthly, bonus: o.guaranteed };
      sessionStorage.setItem(OFFER_CHECK_KEY, JSON.stringify(p));
    } catch {
      // Storage blocked: the checker opens empty.
    }
    router.push("/offer/");
  };
  const share = (o: Offer) => {
    try {
      const p: OfferPrefill = { company: o.name.startsWith("Offer ") ? "" : o.name, track: "", role: "", yoe: "", monthly: o.monthly, bonus: o.guaranteed };
      sessionStorage.setItem(OFFER_PREFILL_KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
    router.push("/submit/?kind=offer");
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {offers.map((o, i) => (
          <fieldset key={i} className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <legend className="sr-only">第 {i + 1} 份 offer</legend>
              <input
                aria-label="公司或名稱"
                value={o.name}
                onChange={(e) => update(i, { name: e.target.value })}
                onFocus={(e) => o.name.startsWith("Offer ") && e.target.select()}
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-1 text-lg font-bold hover:border-border focus:border-border"
              />
              {offers.length > 1 && (
                <button
                  type="button"
                  onClick={() => setOffers((os) => os.filter((_, j) => j !== i))}
                  className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-3 hover:text-ink sm:size-8"
                  aria-label={`移除 ${o.name}`}
                >
                  ✕
                </button>
              )}
            </div>
            <NumField
              label="月底薪（萬）"
              value={o.monthly}
              onChange={(v) => update(i, { monthly: v })}
              onBlur={() => {
                const { value, note } = toWan(o.monthly);
                update(i, { monthly: value });
                setNotes((n) => ({ ...n, [i]: note ?? "" }));
              }}
              hint={notes[i] || undefined}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumField label="保障年終（月）" value={o.guaranteed} onChange={(v) => update(i, { guaranteed: v })} />
              <NumField label="績效獎金（月）" hint="預期平均" value={o.variable} onChange={(v) => update(i, { variable: v })} />
            </div>
            <NumField label="員工酬勞／分紅（萬／年）" value={o.profitSharing} onChange={(v) => update(i, { profitSharing: v })} />
            <div className="grid grid-cols-2 gap-3">
              <NumField label="股票總額（萬）" value={o.stockTotal} onChange={(v) => update(i, { stockTotal: v })} />
              <NumField label="分幾年歸屬" value={o.vestYears} inputMode="numeric" onChange={(v) => update(i, { vestYears: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="簽約金（萬）" value={o.signOn} onChange={(v) => update(i, { signOn: v })} />
              <NumField label="每年調薪（%）" value={o.raise} onChange={(v) => update(i, { raise: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField label="其他福利（萬／年）" hint="伙食、保險等" value={o.other} onChange={(v) => update(i, { other: v })} />
              <NumField label="每週工時（選填）" hint="用來算時薪" value={o.weeklyHours} onChange={(v) => update(i, { weeklyHours: v })} />
            </div>
            {filled[i] && (
              <div className="flex flex-wrap gap-x-3 border-t border-dashed border-border pt-2 text-sm">
                <button type="button" onClick={() => check(o)} className="min-h-11 text-accent underline sm:min-h-0">
                  檢查落點
                </button>
                <button type="button" onClick={() => share(o)} className="min-h-11 text-accent underline sm:min-h-0">
                  匿名分享這個 offer
                </button>
              </div>
            )}
          </fieldset>
        ))}
        {offers.length < MAX && (
          <button
            type="button"
            onClick={() => setOffers((os) => [...os, blank(os.length)])}
            className="min-h-32 rounded-xl border border-dashed border-border text-sm text-ink-2 hover:border-accent hover:text-ink"
          >
            ＋ 再加一份 offer
          </button>
        )}
      </div>

      {ready && (
        <section aria-labelledby="calc-result" className="space-y-5">
          <h2 id="calc-result" className="text-xl font-bold">
            {YEARS} 年總薪酬
          </h2>
          <ul className="space-y-3">
            {offers.map((o, i) =>
              filled[i] ? (
                <li key={i}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {o.name}
                      {totals[i] === best && filled.filter(Boolean).length > 1 && <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-ink">最高</span>}
                    </span>
                    <span>
                      <span className="num text-xl font-semibold">{Math.round(totals[i]).toLocaleString()}</span>
                      <span className="ml-1 text-ink-2">萬</span>
                    </span>
                  </div>
                  <div className="mt-1 h-3 rounded-r bg-surface-2">
                    <div className="h-3 rounded-r bg-data" style={{ width: `${best ? (totals[i] / best) * 100 : 0}%` }} />
                  </div>
                  {totals[i] !== best && <div className="mt-0.5 text-xs text-ink-3">比最高少 {Math.round(best - totals[i]).toLocaleString()} 萬，平均每年 {r1((best - totals[i]) / YEARS)} 萬</div>}
                </li>
              ) : null,
            )}
          </ul>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm" style={{ minWidth: 140 + 90 * filled.filter(Boolean).length }}>
              <caption className="sr-only">第一年薪酬拆解與 {YEARS} 年合計</caption>
              <thead className="bg-surface-2 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">第一年（萬）</th>
                  {offers.map((o, i) => filled[i] && <th key={i} className="px-3 py-2 text-right font-medium">{o.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ROWS.filter((row) => offers.some((_, i) => filled[i] && results[i][0][row.key] > 0)).map((row) => (
                  <tr key={row.key}>
                    <td className="px-3 py-2 text-ink-2">{row.label}</td>
                    {offers.map((_, i) => filled[i] && <td key={i} className="num px-3 py-2 text-right">{fmt(results[i][0][row.key])}</td>)}
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="px-3 py-2">第一年合計</td>
                  {offers.map((_, i) => filled[i] && <td key={i} className="num px-3 py-2 text-right">{fmt(results[i][0].total)}</td>)}
                </tr>
                {Array.from({ length: YEARS - 1 }, (_, y) => (
                  <tr key={y}>
                    <td className="px-3 py-2 text-ink-2">第 {y + 2} 年合計</td>
                    {offers.map((_, i) => filled[i] && <td key={i} className="num px-3 py-2 text-right">{fmt(results[i][y + 1].total)}</td>)}
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="px-3 py-2">{YEARS} 年合計</td>
                  {offers.map((_, i) => filled[i] && <td key={i} className="num px-3 py-2 text-right">{Math.round(totals[i]).toLocaleString()}</td>)}
                </tr>
                {offers.some((o, i) => filled[i] && num(o.weeklyHours) > 0) && (
                  <tr>
                    <td className="px-3 py-2 text-ink-2">第一年估計時薪（元）</td>
                    {offers.map(
                      (o, i) =>
                        filled[i] && (
                          <td key={i} className="num px-3 py-2 text-right">
                            {num(o.weeklyHours) > 0 ? Math.round((results[i][0].total * 10000) / (num(o.weeklyHours) * 52)).toLocaleString() : "—"}
                          </td>
                        ),
                    )}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs leading-5 text-ink-3">
            底薪與年終每年依你填的調薪幅度成長；股票按年平均歸屬，不計股價漲跌；簽約金算在第一年。實際金額以 offer letter 為準。數字只存在這台裝置的瀏覽器裡，不會送出。
          </p>
        </section>
      )}
    </div>
  );
}
